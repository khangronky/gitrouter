import type { SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import {
  getPullRequestFiles,
  requestPullRequestReview,
} from '@/lib/github/client';
import {
  getWebhookSecret,
  verifyWebhookSignature,
} from '@/lib/github/signature';
import { syncPrWithJira } from '@/lib/jira';
import { routeAndAssignReviewers } from '@/lib/routing';
import type {
  PullRequestReviewWebhookPayload,
  PullRequestWebhookPayload,
} from '@/lib/schema/github';
import { jiraTicketIdPattern } from '@/lib/schema/jira';
import {
  sendPrClosedNotification,
  sendPrMergedNotification,
  sendPrNotifications,
} from '@/lib/slack';
import { createAdminClient } from '@/lib/supabase/server';
import type { Database } from '@/types/supabase';

/**
 * POST /api/github/webhook
 * Handle GitHub webhook events
 */
export async function POST(request: Request) {
  const startTime = Date.now();
  console.log('🔵 [WEBHOOK START] === GitHub Webhook Received ===');

  try {
    // Get raw body for signature verification
    console.log('⏱️ [1s] Getting raw body...');
    const rawBody = await request.text();
    console.log(
      '✅ [1] Webhook payload length:',
      rawBody.length,
      `(${Date.now() - startTime}ms)`
    );

    // Verify signature
    const signature = request.headers.get('x-hub-signature-256');
    console.log('⏱️ [2s] Checking signature...');
    console.log(
      '✅ [2] Signature present:',
      !!signature,
      `(${Date.now() - startTime}ms)`
    );

    if (!signature) {
      console.log('❌ [2] ERROR: Missing signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    let secret: string;
    try {
      console.log('⏱️ [3s] Getting webhook secret...');
      secret = getWebhookSecret();
      console.log(
        '✅ [3] Webhook secret configured:',
        !!secret,
        `(${Date.now() - startTime}ms)`
      );
    } catch (e) {
      console.error('❌ [3] ERROR: GITHUB_WEBHOOK_SECRET not configured!', e);
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    console.log('⏱️ [4s] Verifying webhook signature...');
    const isValid = await verifyWebhookSignature(secret, rawBody, signature);
    console.log(
      '✅ [4] Signature valid:',
      isValid,
      `(${Date.now() - startTime}ms)`
    );

    if (!isValid) {
      console.log('❌ [4] ERROR: Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Get event info
    const eventType = request.headers.get('x-github-event');
    const deliveryId = request.headers.get('x-github-delivery');

    console.log('⏱️ [5s] Getting event headers...');
    console.log(
      '✅ [5] Event info:',
      { eventType, deliveryId: deliveryId?.substring(0, 8) },
      `(${Date.now() - startTime}ms)`
    );

    if (!eventType || !deliveryId) {
      console.log('❌ [5] ERROR: Missing event headers');
      return NextResponse.json(
        { error: 'Missing event headers' },
        { status: 400 }
      );
    }

    // Parse payload
    console.log('⏱️ [6s] Parsing payload...');
    const payload = JSON.parse(rawBody);
    console.log(
      '✅ [6] Payload parsed, action:',
      payload.action,
      `(${Date.now() - startTime}ms)`
    );

    // Use admin client for webhook processing (bypasses RLS)
    console.log('⏱️ [7s] Creating admin client...');
    const supabase = await createAdminClient();
    console.log('✅ [7] Admin client created', `(${Date.now() - startTime}ms)`);

    // Check idempotency - skip if already processed
    console.log('⏱️ [8s] Checking idempotency...');
    const { data: existingEvent } = await supabase
      .from('webhook_events')
      .select('id')
      .eq('event_id', deliveryId)
      .single();
    console.log(
      '✅ [8] Idempotency check done, exists:',
      !!existingEvent,
      `(${Date.now() - startTime}ms)`
    );

    if (existingEvent) {
      // Already processed, return success
      console.log('ℹ️ [8] Event already processed, returning early');
      return NextResponse.json({ message: 'Event already processed' });
    }

    // Record event for idempotency
    console.log('⏱️ [9s] Recording event for idempotency...');
    await supabase.from('webhook_events').insert({
      event_id: deliveryId,
      event_type: eventType,
      action: payload.action,
    });
    console.log('✅ [9] Event recorded', `(${Date.now() - startTime}ms)`);

    // Route to appropriate handler
    console.log(`⏱️ [10s] Routing to handler for event: ${eventType}`);
    switch (eventType) {
      case 'pull_request':
        console.log('➡️ Handling pull_request event');
        return await handlePullRequestEvent(
          supabase,
          payload as PullRequestWebhookPayload,
          deliveryId
        );

      case 'pull_request_review':
        console.log('➡️ Handling pull_request_review event');
        return await handlePullRequestReviewEvent(
          supabase,
          payload as PullRequestReviewWebhookPayload
        );

      case 'installation':
        console.log('➡️ Handling installation event');
        return await handleInstallationEvent(supabase, payload);

      case 'installation_repositories':
        // Could handle repo add/remove from installation
        console.log(
          'ℹ️ installation_repositories event received but not handled'
        );
        return NextResponse.json({ message: 'Event received' });

      default:
        console.log(`ℹ️ Event type "${eventType}" not handled`);
        return NextResponse.json({ message: 'Event type not handled' });
    }
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    console.error(
      'Error details:',
      error instanceof Error ? error.message : String(error)
    );
    console.log(`Total time before error: ${Date.now() - startTime}ms`);
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
  supabase: SupabaseClient<Database>,
  payload: PullRequestWebhookPayload,
  deliveryId: string
) {
  const startTime = Date.now();
  const { action, pull_request: pr, repository, installation } = payload;
  console.log(`🔵 [PR HANDLER START] PR #${pr.number} ${action}`);

  // Only process specific actions
  if (
    ![
      'opened',
      'synchronize',
      'closed',
      'reopened',
      'ready_for_review',
    ].includes(action)
  ) {
    console.log(`ℹ️ Action "${action}" not handled`);
    return NextResponse.json({ message: 'Action not handled' });
  }

  // Skip draft PRs unless they're being marked ready
  if (pr.draft && action !== 'ready_for_review') {
    console.log('ℹ️ Draft PR skipped');
    return NextResponse.json({ message: 'Draft PR skipped' });
  }

  // Find repository in our database
  console.log(`⏱️ [A] Finding repository ${repository.id}...`);
  const repoStartTime = Date.now();
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
    .is('deleted_at', null)
    .single();
  console.log(
    `✅ [A] Repository lookup done (${Date.now() - repoStartTime}ms, total: ${Date.now() - startTime}ms)`
  );

  if (repoError || !repo) {
    // Repository not registered with any org - ignore
    console.log('ℹ️ Repository not registered');
    return NextResponse.json({ message: 'Repository not registered' });
  }

  if (!repo.is_active) {
    console.log('ℹ️ Repository is inactive');
    return NextResponse.json({ message: 'Repository is inactive' });
  }

  console.log(`✅ [A] Repo found: ${repo.id} (org: ${repo.organization_id})`);

  const installationId =
    (repo.github_installation as unknown as { installation_id: number } | null)
      ?.installation_id || installation?.id;

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
  const jiraTicketId =
    extractedJiraTicketId || existingPr?.jira_ticket_id || null;

  // Get list of changed files for routing
  let filesChanged: string[] = [];
  if (
    installationId &&
    ['opened', 'synchronize', 'ready_for_review', 'reopened'].includes(action)
  ) {
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

  // If PR is merged, mark all pending review assignments as reviewed
  if (status === 'merged' && pr.merged_at) {
    console.log(
      `⏱️ [AUTO-APPROVE] Marking pending assignments as reviewed for merged PR #${savedPr.github_pr_number}`
    );
    const autoApproveStart = Date.now();
    try {
      const { error: updateError } = await supabase
        .from('review_assignments')
        .update({
          status: 'approved' as Database['public']['Enums']['review_status'],
          reviewed_at: pr.merged_at,
          updated_at: new Date().toISOString(),
        })
        .eq('pull_request_id', savedPr.id)
        .eq('status', 'pending');

      if (updateError) {
        console.error('❌ Failed to auto-approve assignments:', updateError);
      } else {
        console.log(
          `✅ [AUTO-APPROVE] Completed (${Date.now() - autoApproveStart}ms)`
        );
      }
    } catch (autoApproveError) {
      console.error('❌ Auto-approve failed:', autoApproveError);
    }
  }

  // Update webhook event with repository_id
  await supabase
    .from('webhook_events')
    .update({ repository_id: repo.id })
    .eq('event_id', deliveryId);

  // Trigger routing for new/updated PRs (including reopened)
  if (
    ['opened', 'reopened', 'ready_for_review'].includes(action) &&
    status === 'open'
  ) {
    console.log(
      `⏱️ [B] Starting routing for PR #${savedPr.github_pr_number}...`
    );
    const routingStartTime = Date.now();

    try {
      const labels = pr.labels?.map((l) => l.name) || [];
      console.log(`  [B1] Running routing engine...`);
      const routingEngineStart = Date.now();
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

      console.log(
        `✅ [B1] Routing engine done (${Date.now() - routingEngineStart}ms)`
      );
      console.log('📊 Routing result:', {
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
          const githubStart = Date.now();
          try {
            console.log(
              `  [B2] Requesting GitHub reviews from ${githubReviewers.length} reviewers...`
            );
            const reviewResult = await requestPullRequestReview(
              installationId,
              repository.owner.login,
              repository.name,
              pr.number,
              githubReviewers
            );
            console.log(
              `✅ [B2] GitHub reviews done (${Date.now() - githubStart}ms)`,
              {
                requested: githubReviewers,
                success: !!reviewResult,
              }
            );
          } catch (githubError) {
            console.error(
              `❌ [B2] Failed to request GitHub reviews (${Date.now() - githubStart}ms):`,
              githubError
            );
            // Don't fail - continue with Slack notifications
          }
        }

        // Send Slack notifications
        console.log(`  [B3] Sending Slack notifications...`);
        const slackStart = Date.now();
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
        console.log(
          `✅ [B3] Slack notifications done (${Date.now() - slackStart}ms)`,
          notifyResult
        );
      }
      console.log(
        `✅ [B] Routing completed (${Date.now() - routingStartTime}ms total)`
      );
    } catch (routingError) {
      console.error(
        `❌ [B] Routing failed (${Date.now() - routingStartTime}ms):`,
        routingError
      );
      // Don't fail the webhook - PR is already saved
    }
  }

  // Sync with Jira (create ticket if none, link on open, update on merge, delete on close)
  let jiraStartTime = Date.now();
  try {
    console.log(`⏱️ [C] Starting Jira sync...`);
    jiraStartTime = Date.now();
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

    console.log(`✅ [C] Jira sync done (${Date.now() - jiraStartTime}ms)`);

    // If a new ticket was created, update the PR record
    if (
      jiraResult.jira_ticket_id &&
      jiraResult.jira_ticket_id !== jiraTicketId
    ) {
      console.log(`  [C1] Updating PR with new Jira ticket...`);
      const updateStart = Date.now();
      await supabase
        .from('pull_requests')
        .update({ jira_ticket_id: jiraResult.jira_ticket_id })
        .eq('id', savedPr.id);
      console.log(
        `✅ [C1] Updated PR ${savedPr.github_pr_number} with Jira ticket: ${jiraResult.jira_ticket_id} (${Date.now() - updateStart}ms)`
      );
    }

    // If Jira ticket was deleted, clear the reference
    if (jiraResult.deleted && jiraTicketId) {
      console.log(`  [C2] Clearing deleted Jira ticket reference...`);
      const deleteStart = Date.now();
      await supabase
        .from('pull_requests')
        .update({ jira_ticket_id: null })
        .eq('id', savedPr.id);
      console.log(
        `✅ [C2] Jira ticket ${jiraTicketId} deleted - PR #${savedPr.github_pr_number} was closed (${Date.now() - deleteStart}ms)`
      );
    }
  } catch (jiraError) {
    console.error(
      `❌ [C] Jira sync failed (${Date.now() - jiraStartTime}ms):`,
      jiraError
    );
    // Don't fail the webhook - PR is already saved
  }

  // Send Slack notifications for closed/merged PRs (regardless of Jira status)
  try {
    console.log(`⏱️ [D] Sending status-specific Slack notifications...`);
    const statusSlackStart = Date.now();
    if (status === 'closed') {
      console.log(
        `  [D] Sending closed notification for PR #${savedPr.github_pr_number}`
      );
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
      console.log(
        `✅ [D] Closed notification sent (${Date.now() - statusSlackStart}ms)`
      );
    } else if (status === 'merged') {
      console.log(
        `  [D] Sending merged notification for PR #${savedPr.github_pr_number}`
      );
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
      console.log(
        `✅ [D] Merged notification sent (${Date.now() - statusSlackStart}ms)`
      );
    }
  } catch (slackError) {
    console.error('❌ [D] Slack notification failed:', slackError);
    // Don't fail the webhook
  }

  console.log(
    `🟢 [WEBHOOK COMPLETE] PR #${savedPr.github_pr_number} processed in ${Date.now() - startTime}ms`
  );
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
  supabase: SupabaseClient<Database>,
  payload: PullRequestReviewWebhookPayload
) {
  const { action, review, pull_request: pr } = payload;

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
      status: reviewStatus as Database['public']['Enums']['review_status'],
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
  supabase: SupabaseClient<Database>,
  payload: {
    action: string;
    installation: { id: number; account: { login: string; type: string } };
  }
) {
  const { action, installation } = payload;

  if (action === 'deleted') {
    // Soft delete installation from our database
    await supabase
      .from('github_installations')
      .update({ deleted_at: new Date().toISOString() })
      .eq('installation_id', installation.id)
      .is('deleted_at', null);

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
