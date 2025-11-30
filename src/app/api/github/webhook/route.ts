import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyWebhookSignature, getWebhookSecret } from '@/lib/github/signature';
import { getPullRequestFiles } from '@/lib/github/client';
import type {
  PullRequestWebhookPayload,
  PullRequestReviewWebhookPayload,
} from '@/lib/schema/github';
import { jiraTicketIdPattern } from '@/lib/schema/jira';

/**
 * POST /api/github/webhook
 * Handle GitHub webhook events
 */
export async function POST(request: Request) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();

    // Verify signature
    const signature = request.headers.get('x-hub-signature-256');
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 401 }
      );
    }

    const secret = getWebhookSecret();
    const isValid = await verifyWebhookSignature(secret, rawBody, signature);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Get event info
    const eventType = request.headers.get('x-github-event');
    const deliveryId = request.headers.get('x-github-delivery');

    if (!eventType || !deliveryId) {
      return NextResponse.json(
        { error: 'Missing event headers' },
        { status: 400 }
      );
    }

    // Parse payload
    const payload = JSON.parse(rawBody);

    // Use admin client for webhook processing (bypasses RLS)
    const supabase = await createAdminClient();

    // Check idempotency - skip if already processed
    const { data: existingEvent } = await supabase
      .from('webhook_events')
      .select('id')
      .eq('event_id', deliveryId)
      .single();

    if (existingEvent) {
      // Already processed, return success
      return NextResponse.json({ message: 'Event already processed' });
    }

    // Record event for idempotency
    await supabase.from('webhook_events').insert({
      event_id: deliveryId,
      event_type: eventType,
      action: payload.action,
    });

    // Route to appropriate handler
    switch (eventType) {
      case 'pull_request':
        return await handlePullRequestEvent(
          supabase,
          payload as PullRequestWebhookPayload,
          deliveryId
        );

      case 'pull_request_review':
        return await handlePullRequestReviewEvent(
          supabase,
          payload as PullRequestReviewWebhookPayload
        );

      case 'installation':
        return await handleInstallationEvent(supabase, payload);

      case 'installation_repositories':
        // Could handle repo add/remove from installation
        return NextResponse.json({ message: 'Event received' });

      default:
        return NextResponse.json({ message: 'Event type not handled' });
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle pull_request events
 */
async function handlePullRequestEvent(
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
  payload: PullRequestWebhookPayload,
  deliveryId: string
) {
  const { action, pull_request: pr, repository, installation } = payload;

  // Only process specific actions
  if (!['opened', 'synchronize', 'closed', 'reopened', 'ready_for_review'].includes(action)) {
    return NextResponse.json({ message: 'Action not handled' });
  }

  // Skip draft PRs unless they're being marked ready
  if (pr.draft && action !== 'ready_for_review') {
    return NextResponse.json({ message: 'Draft PR skipped' });
  }

  // Find repository in our database
  const { data: repo, error: repoError } = await supabase
    .from('repositories')
    .select(
      `
      id,
      organization_id,
      github_installation_id,
      is_active,
      github_installation:github_installations (
        installation_id
      )
    `
    )
    .eq('github_repo_id', repository.id)
    .single();

  if (repoError || !repo) {
    // Repository not registered with any org - ignore
    return NextResponse.json({ message: 'Repository not registered' });
  }

  if (!repo.is_active) {
    return NextResponse.json({ message: 'Repository is inactive' });
  }

  const installationId = (repo.github_installation as { installation_id: number })?.installation_id 
    || installation?.id;

  // Determine PR status
  let status: 'open' | 'merged' | 'closed' = 'open';
  if (pr.merged) {
    status = 'merged';
  } else if (pr.state === 'closed') {
    status = 'closed';
  }

  // Extract Jira ticket ID from title or body
  const jiraTicketId = extractJiraTicketId(pr.title, pr.body);

  // Get list of changed files for routing
  let filesChanged: string[] = [];
  if (installationId && ['opened', 'synchronize', 'ready_for_review'].includes(action)) {
    try {
      filesChanged = await getPullRequestFiles(
        installationId,
        repository.owner.login,
        repository.name,
        pr.number
      );
    } catch (error) {
      console.error('Failed to fetch PR files:', error);
    }
  }

  // Upsert pull request
  const prData = {
    repository_id: repo.id,
    github_pr_id: pr.id,
    github_pr_number: pr.number,
    title: pr.title,
    body: pr.body,
    author_login: pr.user.login,
    author_id: pr.user.id,
    head_branch: pr.head.ref,
    base_branch: pr.base.ref,
    files_changed: filesChanged,
    additions: pr.additions,
    deletions: pr.deletions,
    status,
    html_url: pr.html_url,
    jira_ticket_id: jiraTicketId,
    updated_at: new Date().toISOString(),
    merged_at: pr.merged_at,
    closed_at: pr.closed_at,
  };

  const { data: savedPr, error: prError } = await supabase
    .from('pull_requests')
    .upsert(prData, {
      onConflict: 'repository_id,github_pr_id',
    })
    .select()
    .single();

  if (prError) {
    console.error('Failed to save PR:', prError);
    return NextResponse.json(
      { error: 'Failed to save pull request' },
      { status: 500 }
    );
  }

  // Update webhook event with repository_id
  await supabase
    .from('webhook_events')
    .update({ repository_id: repo.id })
    .eq('event_id', deliveryId);

  // Trigger routing for new/updated PRs
  if (['opened', 'ready_for_review'].includes(action) && status === 'open') {
    // TODO: Call routing engine here
    // await routePullRequest(supabase, savedPr, repo.organization_id, filesChanged);
  }

  // Handle PR merge - update Jira if configured
  if (action === 'closed' && pr.merged && jiraTicketId) {
    // TODO: Update Jira ticket status
    // await updateJiraOnMerge(repo.organization_id, jiraTicketId, pr);
  }

  return NextResponse.json({
    message: 'Pull request processed',
    pr_id: savedPr.id,
    action,
  });
}

/**
 * Handle pull_request_review events
 */
async function handlePullRequestReviewEvent(
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
  payload: PullRequestReviewWebhookPayload
) {
  const { action, review, pull_request: pr, repository } = payload;

  if (action !== 'submitted') {
    return NextResponse.json({ message: 'Action not handled' });
  }

  // Find the PR in our database
  const { data: savedPr, error: prError } = await supabase
    .from('pull_requests')
    .select('id, repository_id')
    .eq('github_pr_id', pr.id)
    .single();

  if (prError || !savedPr) {
    return NextResponse.json({ message: 'PR not found in database' });
  }

  // Map GitHub review state to our status
  const statusMap: Record<string, string> = {
    approved: 'approved',
    changes_requested: 'changes_requested',
    commented: 'commented',
    dismissed: 'dismissed',
  };

  const reviewStatus = statusMap[review.state] || 'commented';

  // Find reviewer by GitHub username
  const { data: reviewer } = await supabase
    .from('reviewers')
    .select('id')
    .eq('github_username', review.user.login)
    .single();

  if (!reviewer) {
    // Reviewer not in our system - skip
    return NextResponse.json({ message: 'Reviewer not found in system' });
  }

  // Update review assignment
  const { error: updateError } = await supabase
    .from('review_assignments')
    .update({
      status: reviewStatus,
      reviewed_at: review.submitted_at,
      updated_at: new Date().toISOString(),
    })
    .eq('pull_request_id', savedPr.id)
    .eq('reviewer_id', reviewer.id);

  if (updateError) {
    console.error('Failed to update review assignment:', updateError);
  }

  return NextResponse.json({
    message: 'Review processed',
    state: review.state,
  });
}

/**
 * Handle installation events
 */
async function handleInstallationEvent(
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
  payload: { action: string; installation: { id: number; account: { login: string; type: string } } }
) {
  const { action, installation } = payload;

  if (action === 'deleted') {
    // Remove installation from our database
    await supabase
      .from('github_installations')
      .delete()
      .eq('installation_id', installation.id);

    return NextResponse.json({ message: 'Installation removed' });
  }

  // For 'created' action, the installation is handled via the callback flow
  return NextResponse.json({ message: 'Installation event received' });
}

/**
 * Extract Jira ticket ID from PR title or body
 */
function extractJiraTicketId(
  title: string,
  body: string | null
): string | null {
  // Check title first
  const titleMatch = title.match(jiraTicketIdPattern);
  if (titleMatch) {
    return titleMatch[1];
  }

  // Check body
  if (body) {
    const bodyMatch = body.match(jiraTicketIdPattern);
    if (bodyMatch) {
      return bodyMatch[1];
    }
  }

  return null;
}

