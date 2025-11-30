import type { SupabaseClient } from '@supabase/supabase-js';
import { getOrgSlackClient, sendDirectMessage } from './client';
import {
  buildPrNotificationBlocks,
  buildFallbackText,
  buildReminderBlocks,
  buildEscalationBlocks,
} from './messages';
import type { ReviewerInfo } from '@/lib/routing/types';

/**
 * Send PR notification to assigned reviewers
 */
export async function sendPrNotifications(
  supabase: SupabaseClient,
  organizationId: string,
  pr: {
    id: string;
    title: string;
    github_pr_number: number;
    author_login: string;
    html_url: string;
    files_changed: string[];
    additions: number;
    deletions: number;
    jira_ticket_id: string | null;
  },
  repository: {
    full_name: string;
  },
  reviewers: ReviewerInfo[]
): Promise<{ sent: number; failed: number }> {
  const client = await getOrgSlackClient(supabase, organizationId);

  if (!client) {
    console.log('No Slack integration for org:', organizationId);
    return { sent: 0, failed: 0 };
  }

  const blocks = buildPrNotificationBlocks({
    title: pr.title,
    number: pr.github_pr_number,
    author: pr.author_login,
    repo: repository.full_name,
    url: pr.html_url,
    files_changed: pr.files_changed,
    additions: pr.additions,
    deletions: pr.deletions,
    jira_ticket: pr.jira_ticket_id,
  });

  const fallbackText = buildFallbackText({
    title: pr.title,
    number: pr.github_pr_number,
    repo: repository.full_name,
    url: pr.html_url,
  });

  let sent = 0;
  let failed = 0;

  for (const reviewer of reviewers) {
    if (!reviewer.slack_user_id) {
      console.log(`Reviewer ${reviewer.name} has no Slack ID, skipping`);
      failed++;
      continue;
    }

    const result = await sendDirectMessage(
      client,
      reviewer.slack_user_id,
      fallbackText,
      blocks
    );

    if (result.ok) {
      sent++;

      // Update review assignment with Slack message info
      await supabase
        .from('review_assignments')
        .update({
          slack_message_ts: result.ts,
          slack_channel_id: result.channel,
          notified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('pull_request_id', pr.id)
        .eq('reviewer_id', reviewer.id);
    } else {
      console.error(`Failed to notify ${reviewer.name}:`, result.error);
      failed++;
    }
  }

  return { sent, failed };
}

/**
 * Send 24h reminder to a reviewer
 */
export async function sendReviewReminder(
  supabase: SupabaseClient,
  organizationId: string,
  assignment: {
    id: string;
    reviewer_id: string;
    pull_request: {
      title: string;
      github_pr_number: number;
      html_url: string;
      repository: {
        full_name: string;
      };
    };
  },
  hoursPending: number
): Promise<boolean> {
  const client = await getOrgSlackClient(supabase, organizationId);

  if (!client) {
    return false;
  }

  // Get reviewer's Slack ID
  const { data: reviewer } = await supabase
    .from('reviewers')
    .select('slack_user_id, name')
    .eq('id', assignment.reviewer_id)
    .single();

  if (!reviewer?.slack_user_id) {
    return false;
  }

  const blocks = buildReminderBlocks({
    title: assignment.pull_request.title,
    number: assignment.pull_request.github_pr_number,
    repo: assignment.pull_request.repository.full_name,
    url: assignment.pull_request.html_url,
    hours_pending: Math.round(hoursPending),
  });

  const result = await sendDirectMessage(
    client,
    reviewer.slack_user_id,
    `Reminder: PR #${assignment.pull_request.github_pr_number} has been waiting for your review for ${Math.round(hoursPending)} hours.`,
    blocks
  );

  if (result.ok) {
    // Update assignment with reminder sent time
    await supabase
      .from('review_assignments')
      .update({
        reminder_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', assignment.id);

    return true;
  }

  return false;
}

/**
 * Send 48h escalation alert to team leads
 */
export async function sendEscalationAlert(
  supabase: SupabaseClient,
  organizationId: string,
  assignment: {
    id: string;
    reviewer_id: string;
    pull_request: {
      id: string;
      title: string;
      github_pr_number: number;
      html_url: string;
      repository: {
        full_name: string;
      };
    };
  },
  hoursPending: number
): Promise<boolean> {
  const client = await getOrgSlackClient(supabase, organizationId);

  if (!client) {
    return false;
  }

  // Get the Slack integration to find the default channel
  const { data: integration } = await supabase
    .from('slack_integrations')
    .select('default_channel_id')
    .eq('organization_id', organizationId)
    .single();

  // Get reviewer name
  const { data: reviewer } = await supabase
    .from('reviewers')
    .select('name')
    .eq('id', assignment.reviewer_id)
    .single();

  // Get org owners/admins for escalation
  const { data: admins } = await supabase
    .from('organization_members')
    .select('user_id, users(id)')
    .eq('organization_id', organizationId)
    .in('role', ['owner', 'admin']);

  // Get their Slack IDs from reviewers table
  const { data: adminReviewers } = await supabase
    .from('reviewers')
    .select('slack_user_id')
    .eq('organization_id', organizationId)
    .in('user_id', admins?.map((a) => a.user_id) || [])
    .not('slack_user_id', 'is', null);

  const blocks = buildEscalationBlocks({
    title: assignment.pull_request.title,
    number: assignment.pull_request.github_pr_number,
    repo: assignment.pull_request.repository.full_name,
    url: assignment.pull_request.html_url,
    reviewer_name: reviewer?.name || 'Unknown',
    hours_pending: Math.round(hoursPending),
  });

  const text = `🚨 Stale PR Alert: #${assignment.pull_request.github_pr_number} has been waiting for ${Math.round(hoursPending)} hours.`;

  let sent = false;

  // Send to default channel if configured
  if (integration?.default_channel_id) {
    const { sendChannelMessage } = await import('./client');
    const result = await sendChannelMessage(
      client,
      integration.default_channel_id,
      text,
      blocks
    );
    sent = result.ok;
  }

  // Also DM admins
  for (const admin of adminReviewers || []) {
    if (admin.slack_user_id) {
      await sendDirectMessage(client, admin.slack_user_id, text, blocks);
    }
  }

  // Record escalation
  if (sent || (adminReviewers && adminReviewers.length > 0)) {
    await supabase.from('escalations').insert({
      review_assignment_id: assignment.id,
      level: 'alert_48h',
      notified_user_ids: adminReviewers?.map((a) => a.slack_user_id).filter(Boolean) || [],
    });

    return true;
  }

  return false;
}

