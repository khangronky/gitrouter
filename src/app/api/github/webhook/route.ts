import { NextResponse } from 'next/server';
import { createDynamicAdminClient } from '@/lib/supabase/server';
import { verifyWebhookSignature, getWebhookSecret } from '@/lib/github/signature';
import { getPullRequestFiles, requestPullRequestReview } from '@/lib/github/client';
import type {
  PullRequestWebhookPayload,
  PullRequestReviewWebhookPayload,
} from '@/lib/schema/github';
import { jiraTicketIdPattern } from '@/lib/schema/jira';
import { routeAndAssignReviewers } from '@/lib/routing';
import { sendPrNotifications, sendPrClosedNotification, sendPrMergedNotification } from '@/lib/slack';
import { syncPrWithJira } from '@/lib/jira';

/**
 * POST /api/github/webhook
 * Handle GitHub webhook events
 */
export async function POST(request: Request) {
  console.log('=== GitHub Webhook Received ===');
  
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    console.log('Webhook payload length:', rawBody.length);

    // Verify signature
    const signature = request.headers.get('x-hub-signature-256');
    console.log('Signature present:', !!signature);
    
    if (!signature) {
      console.log('ERROR: Missing signature');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 401 }
      );
    }

    let secret: string;
    try {
      secret = getWebhookSecret();
      console.log('Webhook secret configured:', !!secret);
    } catch (e) {
      console.error('ERROR: GITHUB_WEBHOOK_SECRET not configured!', e);
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }
    
    const isValid = await verifyWebhookSignature(secret, rawBody, signature);
    console.log('Signature valid:', isValid);

    if (!isValid) {
      console.log('ERROR: Invalid signature');
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
    const supabase = await createDynamicAdminClient();

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
  supabase: Awaited<ReturnType<typeof createDynamicAdminClient>>,
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

  const installationId = (repo.github_installation as unknown as { installation_id: number } | null)?.installation_id 
    || installation?.id;

  // Determine PR status
  let status: 'open' | 'merged' | 'closed' = 'open';
  if (pr.merged) {
    status = 'merged';
  } else if (pr.state === 'closed') {
    status = 'closed';
  }

  // Extract Jira ticket ID from title or body
  const extractedJiraTicketId = extractJiraTicketId(pr.title, pr.body);

  // Check if PR already exists in database (to preserve existing jira_ticket_id)
  const { data: existingPr } = await supabase
    .from('pull_requests')
    .select('id, jira_ticket_id')
    .eq('repository_id', repo.id)
    .eq('github_pr_id', pr.id)
    .single();

  // Use extracted ticket ID, or preserve existing one from database
  const jiraTicketId = extractedJiraTicketId || existingPr?.jira_ticket_id || null;

  // Get list of changed files for routing
  let filesChanged: string[] = [];
  if (installationId && ['opened', 'synchronize', 'ready_for_review', 'reopened'].includes(action)) {
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

  // Trigger routing for new/updated PRs (including reopened)
  if (['opened', 'reopened', 'ready_for_review'].includes(action) && status === 'open') {
    console.log('Triggering routing for PR:', {
      action,
      pr_number: savedPr.github_pr_number,
      org_id: repo.organization_id,
      files_changed: savedPr.files_changed?.length || 0,
    });
    
    try {
      const labels = pr.labels?.map((l) => l.name) || [];
      const routingResult = await routeAndAssignReviewers(
        supabase,
        {
          id: savedPr.id,
          repository_id: savedPr.repository_id,
          github_pr_number: savedPr.github_pr_number,
          title: savedPr.title,
          author_login: savedPr.author_login,
          head_branch: savedPr.head_branch,
          base_branch: savedPr.base_branch,
          files_changed: savedPr.files_changed || [],
          created_at: savedPr.created_at,
        },
        repo.organization_id,
        labels
      );

      console.log('Routing result:', {
        pr: savedPr.github_pr_number,
        matched: routingResult.matched,
        reviewers: routingResult.reviewers.map((r) => r.name),
        fallback_used: routingResult.fallback_used,
        time_ms: routingResult.evaluation_time_ms,
      });

      // Assign reviewers on GitHub and send notifications
      if (routingResult.reviewers.length > 0) {
        // Get GitHub usernames for reviewers (exclude those without GitHub username)
        const githubReviewers = routingResult.reviewers
          .filter((r) => r.github_username)
          .map((r) => r.github_username as string);

        // Request reviews on GitHub
        if (githubReviewers.length > 0 && installationId) {
          try {
            const reviewResult = await requestPullRequestReview(
              installationId,
              repository.owner.login,
              repository.name,
              pr.number,
              githubReviewers
            );
            console.log('GitHub review request:', {
              requested: githubReviewers,
              success: !!reviewResult,
            });
          } catch (githubError) {
            console.error('Failed to request GitHub reviews:', githubError);
            // Don't fail - continue with Slack notifications
          }
        }

        // Send Slack notifications
        const notifyResult = await sendPrNotifications(
          supabase,
          repo.organization_id,
          {
            id: savedPr.id,
            title: savedPr.title,
            github_pr_number: savedPr.github_pr_number,
            author_login: savedPr.author_login,
            html_url: savedPr.html_url,
            files_changed: savedPr.files_changed || [],
            additions: savedPr.additions || 0,
            deletions: savedPr.deletions || 0,
            jira_ticket_id: savedPr.jira_ticket_id,
          },
          { full_name: repository.full_name },
          routingResult.reviewers
        );
        console.log('Slack notifications:', notifyResult);
      }
    } catch (routingError) {
      console.error('Routing failed:', routingError);
      // Don't fail the webhook - PR is already saved
    }
  }

  // Sync with Jira (create ticket if none, link on open, update on merge, delete on close)
  try {
    const jiraResult = await syncPrWithJira(supabase, repo.organization_id, {
      id: savedPr.id,
      title: savedPr.title,
      number: savedPr.github_pr_number,
      html_url: savedPr.html_url,
      author_login: savedPr.author_login,
      repository_full_name: repository.full_name,
      jira_ticket_id: jiraTicketId,
      status,
      merged_by: pr.merged_by?.login,
    });

    // If a new ticket was created, update the PR record
    if (jiraResult.jira_ticket_id && jiraResult.jira_ticket_id !== jiraTicketId) {
      await supabase
        .from('pull_requests')
        .update({ jira_ticket_id: jiraResult.jira_ticket_id })
        .eq('id', savedPr.id);
      console.log(`Updated PR ${savedPr.github_pr_number} with Jira ticket: ${jiraResult.jira_ticket_id}`);
    }

    // If Jira ticket was deleted, clear the reference
    if (jiraResult.deleted && jiraTicketId) {
      await supabase
        .from('pull_requests')
        .update({ jira_ticket_id: null })
        .eq('id', savedPr.id);
      console.log(`Jira ticket ${jiraTicketId} deleted - PR #${savedPr.github_pr_number} was closed`);
    }
  } catch (jiraError) {
    console.error('Jira sync failed:', jiraError);
    // Don't fail the webhook - PR is already saved
  }

  // Send Slack notifications for closed/merged PRs (regardless of Jira status)
  try {
    if (status === 'closed') {
      console.log(`Sending Slack notification for closed PR #${savedPr.github_pr_number}`);
      await sendPrClosedNotification(
        supabase,
        repo.organization_id,
        {
          id: savedPr.id,
          title: savedPr.title,
          github_pr_number: savedPr.github_pr_number,
          author_login: savedPr.author_login,
          html_url: savedPr.html_url,
        },
        { full_name: repository.full_name },
        jiraTicketId
      );
    } else if (status === 'merged') {
      console.log(`Sending Slack notification for merged PR #${savedPr.github_pr_number}`);
      await sendPrMergedNotification(
        supabase,
        repo.organization_id,
        {
          id: savedPr.id,
          title: savedPr.title,
          github_pr_number: savedPr.github_pr_number,
          author_login: savedPr.author_login,
          html_url: savedPr.html_url,
          merged_by: pr.merged_by?.login,
        },
        { full_name: repository.full_name },
        jiraTicketId
      );
    }
  } catch (slackError) {
    console.error('Slack notification failed:', slackError);
    // Don't fail the webhook
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
  supabase: Awaited<ReturnType<typeof createDynamicAdminClient>>,
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
  supabase: Awaited<ReturnType<typeof createDynamicAdminClient>>,
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

