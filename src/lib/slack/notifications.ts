import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

type TypedSupabaseClient = SupabaseClient<Database>;

import type { ReviewerInfo } from '@/lib/routing/types';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  type NotificationSettings,
} from '@/lib/schema/organization';
import {
  getOrgSlackClient,
  sendChannelMessage,
  sendDirectMessage,
} from './client';
import {
  buildEscalationBlocks,
  buildFallbackText,
  buildPrClosedBlocks,
  buildPrMergedNotificationBlocks,
  buildPrNotificationBlocks,
  buildReminderBlocks,
} from './messages';

/**
 * Get notification settings for an organization
 */
async function getNotificationSettings(
  supabase: TypedSupabaseClient,
  organizationId: string
): Promise<NotificationSettings> {
  try {
    const { data: org, error } = await supabase
      .from('organizations')
      .select('notification_settings')
      .eq('id', organizationId)
      .single();

    if (error) {
      console.log(
        'Could not fetch notification_settings, using defaults:',
        error.message
      );
      return DEFAULT_NOTIFICATION_SETTINGS;
    }

    return {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      ...(org?.notification_settings as Partial<NotificationSettings>),
    };
  } catch (error) {
    console.log('Error fetching notification settings, using defaults:', error);
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
}

/**
 * Send PR notification to assigned reviewers
 */
export async function sendPrNotifications(
  supabase: TypedSupabaseClient,
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
  // Check notification settings first
  const settings = await getNotificationSettings(supabase, organizationId);

  if (!settings.slack_notifications) {
    console.log('Slack notifications disabled for org:', organizationId);
    return { sent: 0, failed: 0 };
  }

  // For batched/daily frequency, we would queue the notification instead
  // For now, only send immediately if realtime is enabled
  if (settings.notification_frequency !== 'realtime') {
    console.log(
      `Notification frequency is ${settings.notification_frequency}, skipping immediate send`
    );
    // TODO: Queue notification for batch processing
    return { sent: 0, failed: 0 };
  }

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
    reviewers: reviewers.map((r) => ({
      name: r.name,
      slack_user_id: r.slack_user_id,
    })),
  });

  const fallbackText = buildFallbackText({
    title: pr.title,
    number: pr.github_pr_number,
    repo: repository.full_name,
    url: pr.html_url,
  });

  let sent = 0;
  let failed = 0;

  // Check notification destination setting
  if (settings.escalation_destination === 'channel') {
    // Send to public channel
    const { data: integration } = await supabase
      .from('slack_integrations')
      .select('default_channel_id')
      .eq('organization_id', organizationId)
      .single();

    if (!integration?.default_channel_id) {
      console.log('No default channel configured for org:', organizationId);
      return { sent: 0, failed: 0 };
    }

    console.log(
      `Sending PR notification to channel (channel_id: ${integration.default_channel_id})`
    );

    const result = await sendChannelMessage(
      client,
      integration.default_channel_id,
      fallbackText,
      blocks
    );

    console.log('Slack channel message result:', JSON.stringify(result));

    if (result.ok) {
      sent = 1;

      // Update all review assignments with Slack message info
      for (const reviewer of reviewers) {
        await supabase
          .from('review_assignments')
          .update({
            slack_message_ts: result.ts,
            slack_channel_id: integration.default_channel_id,
            notified_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('pull_request_id', pr.id)
          .eq('reviewer_id', reviewer.id);
      }
    } else {
      console.error('Failed to send channel message:', result.error);
      failed = 1;
    }
  } else {
    // Send DMs to reviewers (private)
    for (const reviewer of reviewers) {
      if (!reviewer.slack_user_id) {
        console.log(`Reviewer ${reviewer.name} has no Slack ID, skipping`);
        failed++;
        continue;
      }

      console.log(
        `Sending Slack DM to ${reviewer.name} (slack_user_id: ${reviewer.slack_user_id})`
      );

      const result = await sendDirectMessage(
        client,
        reviewer.slack_user_id,
        fallbackText,
        blocks
      );

      console.log(
        `Slack DM result for ${reviewer.name}:`,
        JSON.stringify(result)
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
  }

  return { sent, failed };
}

/**
 * Send 24h reminder to a reviewer
 */
export async function sendReviewReminder(
  supabase: TypedSupabaseClient,
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
  // Check notification settings
  const settings = await getNotificationSettings(supabase, organizationId);

  if (!settings.slack_notifications) {
    console.log('Slack notifications disabled for org:', organizationId);
    return false;
  }

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
  supabase: TypedSupabaseClient,
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
  // Check notification settings
  const settings = await getNotificationSettings(supabase, organizationId);

  if (!settings.slack_notifications) {
    console.log('Slack notifications disabled for org:', organizationId);
    return false;
  }

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

  // Check escalation destination setting
  if (settings.escalation_destination === 'channel') {
    // Send to default channel if configured
    if (integration?.default_channel_id) {
      const result = await sendChannelMessage(
        client,
        integration.default_channel_id,
        text,
        blocks
      );
      sent = result.ok;
    }
  } else {
    // Send DM to admins only (private)
    for (const admin of adminReviewers || []) {
      if (admin.slack_user_id) {
        const result = await sendDirectMessage(
          client,
          admin.slack_user_id,
          text,
          blocks
        );
        if (result.ok) sent = true;
      }
    }
  }

  // Record escalation
  if (sent) {
    await supabase.from('escalations').insert({
      review_assignment_id: assignment.id,
      level: 'alert_48h',
      notified_user_ids: adminReviewers?.map((a) => a.slack_user_id || ''),
    });

    return true;
  }

  return false;
}

/**
 * Send notification when a PR is closed without merge
 */
export async function sendPrClosedNotification(
  supabase: TypedSupabaseClient,
  organizationId: string,
  pr: {
    id: string;
    title: string;
    github_pr_number: number;
    author_login: string;
    html_url: string;
  },
  repository: {
    full_name: string;
  },
  jiraTicketDeleted?: string | null
): Promise<boolean> {
  // Check notification settings
  const settings = await getNotificationSettings(supabase, organizationId);

  if (!settings.slack_notifications) {
    console.log('Slack notifications disabled for org:', organizationId);
    return false;
  }

  const client = await getOrgSlackClient(supabase, organizationId);

  if (!client) {
    console.log('No Slack integration for org:', organizationId);
    return false;
  }

  const blocks = buildPrClosedBlocks({
    title: pr.title,
    number: pr.github_pr_number,
    repo: repository.full_name,
    url: pr.html_url,
    author: pr.author_login,
    jira_ticket_deleted: jiraTicketDeleted,
  });

  const text = `🔴 PR #${pr.github_pr_number} was closed without merge${jiraTicketDeleted ? ` (Jira ticket ${jiraTicketDeleted} deleted)` : ''}`;

  // Send to default channel if configured
  const { data: integration } = await supabase
    .from('slack_integrations')
    .select('default_channel_id')
    .eq('organization_id', organizationId)
    .single();

  if (!integration?.default_channel_id) {
    console.log('No default channel configured for org:', organizationId);
    return false;
  }

  const result = await sendChannelMessage(
    client,
    integration.default_channel_id,
    text,
    blocks
  );

  if (result.ok) {
    console.log(`Sent PR closed notification for PR #${pr.github_pr_number}`);
    return true;
  }

  console.error('Failed to send PR closed notification:', result.error);
  return false;
}

/**
 * Send notification when a PR is merged
 */
export async function sendPrMergedNotification(
  supabase: TypedSupabaseClient,
  organizationId: string,
  pr: {
    id: string;
    title: string;
    github_pr_number: number;
    author_login: string;
    html_url: string;
    merged_by?: string;
  },
  repository: {
    full_name: string;
  },
  jiraTicket?: string | null
): Promise<boolean> {
  // Check notification settings
  const settings = await getNotificationSettings(supabase, organizationId);

  if (!settings.slack_notifications) {
    console.log('Slack notifications disabled for org:', organizationId);
    return false;
  }

  const client = await getOrgSlackClient(supabase, organizationId);

  if (!client) {
    console.log('No Slack integration for org:', organizationId);
    return false;
  }

  const blocks = buildPrMergedNotificationBlocks({
    title: pr.title,
    number: pr.github_pr_number,
    repo: repository.full_name,
    url: pr.html_url,
    author: pr.author_login,
    merged_by: pr.merged_by,
    jira_ticket: jiraTicket,
  });

  const text = `🟣 PR #${pr.github_pr_number} was merged${jiraTicket ? ` (Jira ticket ${jiraTicket} moved to Done)` : ''}`;

  // Send to default channel if configured
  const { data: integration } = await supabase
    .from('slack_integrations')
    .select('default_channel_id')
    .eq('organization_id', organizationId)
    .single();

  if (!integration?.default_channel_id) {
    console.log('No default channel configured for org:', organizationId);
    return false;
  }

  const result = await sendChannelMessage(
    client,
    integration.default_channel_id,
    text,
    blocks
  );

  if (result.ok) {
    console.log(`Sent PR merged notification for PR #${pr.github_pr_number}`);
    return true;
  }

  console.error('Failed to send PR merged notification:', result.error);
  return false;
}
