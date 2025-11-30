import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import {
  verifyGitHubWebhookSignature,
  validateWebhookHeaders,
} from '@/lib/github/verify-signature';
import { extractJiraTicketId } from '@/lib/github/extract-jira-ticket';
import { getPullRequestFiles } from '@/lib/github/client';
import type {
  PullRequestEvent,
  PullRequestReviewEvent,
  InstallationEvent,
  ProcessedPullRequest,
} from '@/lib/github/types';

const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET?.trim();

// Supported event types we process
const SUPPORTED_EVENTS = [
  'pull_request',
  'pull_request_review',
  'installation',
  'installation_repositories',
] as const;

// PR actions we care about
const PR_ACTIONS_TO_PROCESS = ['opened', 'reopened', 'synchronize', 'closed'] as const;

export async function POST(request: Request) {
  // Validate webhook secret is configured
  if (!WEBHOOK_SECRET) {
    console.error('GITHUB_WEBHOOK_SECRET is not configured');
    return NextResponse.json(
      { error: 'Webhook not configured' },
      { status: 500 }
    );
  }

  // Validate headers
  const headerValidation = validateWebhookHeaders(request.headers);
  if (!headerValidation.valid) {
    return NextResponse.json(
      { error: headerValidation.error },
      { status: 400 }
    );
  }

  const { deliveryId, eventType, signature } = headerValidation;

  // Read raw body for signature verification
  const rawBody = await request.text();

  // Verify signature
  if (!verifyGitHubWebhookSignature(rawBody, signature, WEBHOOK_SECRET)) {
    console.error('Invalid webhook signature', { 
      deliveryId,
      signaturePrefix: signature?.substring(0, 15),
      secretLength: WEBHOOK_SECRET.length,
      bodyLength: rawBody.length,
    });
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 401 }
    );
  }

  // Check if this event was already processed (idempotency)
  const supabase = await createAdminClient();
  
  const { data: existingEvent } = await supabase
    .from('processed_events')
    .select('id')
    .eq('event_id', deliveryId)
    .single();

  if (existingEvent) {
    // Already processed, return success
    return NextResponse.json({ status: 'already_processed', deliveryId });
  }

  // Parse the payload
  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON payload' },
      { status: 400 }
    );
  }

  // Check if we support this event type
  if (!SUPPORTED_EVENTS.includes(eventType as (typeof SUPPORTED_EVENTS)[number])) {
    // Mark as processed but don't do anything
    await markEventProcessed(supabase, deliveryId!, eventType!);
    return NextResponse.json({ status: 'ignored', eventType });
  }

  try {
    // Process based on event type
    switch (eventType) {
      case 'pull_request':
        await handlePullRequestEvent(supabase, payload as PullRequestEvent, deliveryId!);
        break;
      case 'pull_request_review':
        await handlePullRequestReviewEvent(supabase, payload as PullRequestReviewEvent);
        break;
      case 'installation':
        await handleInstallationEvent(supabase, payload as InstallationEvent);
        break;
      case 'installation_repositories':
        // Handle repository additions/removals
        // For now, just mark as processed
        break;
    }

    // Mark event as processed
    await markEventProcessed(supabase, deliveryId!, eventType!);

    return NextResponse.json({ status: 'processed', deliveryId, eventType });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal processing error' },
      { status: 500 }
    );
  }
}

async function markEventProcessed(
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
  eventId: string,
  eventType: string
) {
  await supabase.from('processed_events').insert({
    event_id: eventId,
    event_type: eventType,
  });
}

async function handlePullRequestEvent(
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
  event: PullRequestEvent,
  deliveryId: string
) {
  const { action, pull_request: pr, repository, installation } = event;

  // Only process specific actions
  if (!PR_ACTIONS_TO_PROCESS.includes(action as (typeof PR_ACTIONS_TO_PROCESS)[number])) {
    return;
  }

  // Skip draft PRs unless they're being closed
  if (pr.draft && action !== 'closed') {
    return;
  }

  if (!installation) {
    console.warn('PR event without installation', { deliveryId });
    return;
  }

  // Find the organization by installation ID
  const { data: githubInstallation } = await supabase
    .from('github_installations')
    .select('organization_id')
    .eq('installation_id', installation.id)
    .single();

  if (!githubInstallation) {
    console.warn('Unknown installation', { installationId: installation.id });
    return;
  }

  const organizationId = githubInstallation.organization_id;

  // Determine PR status
  let status: 'open' | 'merged' | 'closed' = 'open';
  if (action === 'closed') {
    status = pr.merged ? 'merged' : 'closed';
  }

  // Extract Jira ticket ID
  const jiraTicketId = extractJiraTicketId(pr.title, pr.body);

  // Fetch changed files for routing (only for new/reopened PRs)
  let filesChanged: string[] = [];
  if (action === 'opened' || action === 'reopened' || action === 'synchronize') {
    try {
      const [owner, repo] = repository.full_name.split('/');
      const files = await getPullRequestFiles(installation.id, owner, repo, pr.number);
      filesChanged = files.map((f) => f.filename);
    } catch (error) {
      console.error('Failed to fetch PR files:', error);
    }
  }

  // Upsert the PR
  const prData = {
    organization_id: organizationId,
    github_pr_id: pr.id,
    github_pr_number: pr.number,
    repository: repository.full_name,
    title: pr.title,
    body: pr.body,
    author: pr.user.login,
    author_avatar_url: pr.user.avatar_url,
    files_changed: filesChanged,
    additions: pr.additions,
    deletions: pr.deletions,
    status,
    html_url: pr.html_url,
    jira_ticket_id: jiraTicketId,
    merged_at: pr.merged_at,
    closed_at: pr.closed_at,
  };

  const { data: savedPr, error: prError } = await supabase
    .from('pull_requests')
    .upsert(prData, {
      onConflict: 'organization_id,github_pr_id',
    })
    .select('id')
    .single();

  if (prError) {
    console.error('Failed to save PR:', prError);
    throw prError;
  }

  // For new PRs, trigger routing and assignment
  if (action === 'opened' || action === 'reopened') {
    // Queue PR for routing (will be handled by Trigger.dev job)
    // For now, we'll call the routing engine directly
    const processedPr: ProcessedPullRequest = {
      githubPrId: pr.id,
      githubPrNumber: pr.number,
      repository: repository.full_name,
      title: pr.title,
      body: pr.body,
      author: pr.user.login,
      authorAvatarUrl: pr.user.avatar_url,
      filesChanged,
      additions: pr.additions,
      deletions: pr.deletions,
      htmlUrl: pr.html_url,
      status,
      mergedAt: pr.merged_at,
      closedAt: pr.closed_at,
      jiraTicketId,
    };

    // Import and call routing engine (will be implemented)
    try {
      const { routePullRequest } = await import('@/lib/routing/engine');
      await routePullRequest(organizationId, savedPr.id, processedPr, installation.id);
    } catch (error) {
      console.error('Routing engine not available or failed:', error);
    }
  }

  // Trigger Jira sync
  try {
    const { jiraSyncTask } = await import('@/trigger/jobs/jira-sync');
    
    if (action === 'opened' || action === 'reopened') {
      if (jiraTicketId) {
        // Link PR to existing Jira issue
        await jiraSyncTask.trigger({
          type: 'pr_opened',
          organizationId,
          prId: savedPr.id,
          jiraTicketId,
          pr: {
            title: pr.title,
            body: pr.body,
            url: pr.html_url,
            repository: repository.full_name,
            author: pr.user.login,
          },
        });
      } else {
        // Check if auto-create tickets is enabled
        const { data: jiraIntegration } = await supabase
          .from('jira_integrations')
          .select('is_active, auto_create_tickets, project_keys')
          .eq('organization_id', organizationId)
          .single();

        if (jiraIntegration?.is_active && jiraIntegration?.auto_create_tickets && jiraIntegration?.project_keys?.length > 0) {
          // Create a new Jira ticket for this PR
          await jiraSyncTask.trigger({
            type: 'create_ticket',
            organizationId,
            prId: savedPr.id,
            pr: {
              title: pr.title,
              body: pr.body,
              url: pr.html_url,
              repository: repository.full_name,
              author: pr.user.login,
            },
          });
        }
      }
    } else if (status === 'merged' && jiraTicketId) {
      // Update Jira on merge
      await jiraSyncTask.trigger({
        type: 'pr_merged',
        organizationId,
        prId: savedPr.id,
        jiraTicketId,
        pr: {
          title: pr.title,
          body: pr.body,
          url: pr.html_url,
          repository: repository.full_name,
          author: pr.user.login,
          mergedAt: pr.merged_at,
        },
      });
    } else if (status === 'closed' && jiraTicketId) {
      // Update Jira on close
      await jiraSyncTask.trigger({
        type: 'pr_closed',
        organizationId,
        prId: savedPr.id,
        jiraTicketId,
        pr: {
          title: pr.title,
          body: pr.body,
          url: pr.html_url,
          repository: repository.full_name,
          author: pr.user.login,
        },
      });
    }
  } catch (error) {
    console.error('Failed to trigger Jira sync:', error);
  }
}

async function handlePullRequestReviewEvent(
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
  event: PullRequestReviewEvent
) {
  const { action, review, pull_request: pr, installation } = event;

  if (action !== 'submitted' || !installation) {
    return;
  }

  // Find the organization
  const { data: githubInstallation } = await supabase
    .from('github_installations')
    .select('organization_id')
    .eq('installation_id', installation.id)
    .single();

  if (!githubInstallation) {
    return;
  }

  // Find the PR in our system
  const { data: savedPr } = await supabase
    .from('pull_requests')
    .select('id')
    .eq('organization_id', githubInstallation.organization_id)
    .eq('github_pr_id', pr.id)
    .single();

  if (!savedPr) {
    return;
  }

  // Find the reviewer in our system
  const { data: reviewer } = await supabase
    .from('reviewers')
    .select('id')
    .eq('organization_id', githubInstallation.organization_id)
    .eq('github_username', review.user.login)
    .single();

  if (!reviewer) {
    return;
  }

  // Map GitHub review state to our assignment status
  const statusMap: Record<string, string> = {
    approved: 'approved',
    changes_requested: 'changes_requested',
    commented: 'commented',
    dismissed: 'dismissed',
  };

  const assignmentStatus = statusMap[review.state] || 'commented';

  // Update the assignment status
  await supabase
    .from('review_assignments')
    .update({
      status: assignmentStatus,
      completed_at: assignmentStatus === 'approved' ? new Date().toISOString() : null,
    })
    .eq('pull_request_id', savedPr.id)
    .eq('reviewer_id', reviewer.id);
}

async function handleInstallationEvent(
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
  event: InstallationEvent
) {
  const { action, installation, repositories } = event;

  if (action === 'created') {
    // New installation - store it with pending org assignment
    // The org link will be established through the setup flow
    console.log('New GitHub App installation:', {
      installationId: installation.id,
      account: installation.account.login,
      repos: repositories?.length ?? 0,
    });
    
    // Store installation with null org_id (will be linked during setup)
    // For now, we'll skip this as it requires a setup flow
  } else if (action === 'deleted') {
    // Installation removed - clean up
    await supabase
      .from('github_installations')
      .delete()
      .eq('installation_id', installation.id);
  }
}

// Support GET for webhook verification (if needed)
export async function GET() {
  return NextResponse.json({ status: 'GitHub webhook endpoint active' });
}

