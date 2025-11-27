import { task } from '@trigger.dev/sdk/v3';
import { createAdminClient } from '@/lib/supabase/server';

interface PRDetails {
  id: string;
  title: string;
  author: string;
  authorAvatarUrl: string;
  repository: string;
  filesChanged: number;
  additions: number;
  deletions: number;
  htmlUrl: string;
}

interface ReviewerInfo {
  githubUsername: string;
  slackUserId?: string | null;
  email?: string | null;
}

interface NotificationPayload {
  type: 'new_pr' | 'reminder' | 'escalation';
  assignmentId: string;
  reviewerId: string;
  organizationId: string;
  prDetails: PRDetails;
  reviewer: ReviewerInfo;
}

/**
 * Background job to send notifications via Slack
 * Handles new PR notifications, reminders, and escalations
 */
export const sendNotificationTask = task({
  id: 'send-notification',
  retry: {
    maxAttempts: 5,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 60000,
  },
  run: async (payload: NotificationPayload) => {
    const { type, assignmentId, organizationId, prDetails, reviewer } = payload;

    console.log('Sending notification:', { type, assignmentId, reviewer: reviewer.githubUsername });

    const supabase = await createAdminClient();

    // Get Slack integration for the org
    const { data: slackIntegration } = await supabase
      .from('slack_integrations')
      .select('bot_token_encrypted, team_channel_id, escalation_channel_id')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .single();

    if (!slackIntegration) {
      console.warn('No Slack integration found for org:', organizationId);
      
      // Log the notification as pending (no integration)
      await logNotification(supabase, {
        organizationId,
        assignmentId,
        channel: 'slack_dm',
        recipient: reviewer.slackUserId || reviewer.githubUsername,
        messageType: type,
        status: 'failed',
        error: 'No Slack integration configured',
      });

      return { success: false, reason: 'No Slack integration' };
    }

    // Decrypt token (in production, use proper encryption)
    const botToken = slackIntegration.bot_token_encrypted; // TODO: Implement decryption

    if (!botToken) {
      console.error('No bot token available');
      return { success: false, reason: 'No bot token' };
    }

    // If reviewer has Slack user ID, send DM
    if (reviewer.slackUserId) {
      try {
        const { sendSlackDM } = await import('@/lib/slack/client');
        
        const message = buildPRMessage(type, prDetails, reviewer.githubUsername);
        const blocks = buildPRBlocks(type, prDetails);

        const result = await sendSlackDM(botToken, reviewer.slackUserId, message, blocks);

        // Update assignment with notification time
        const updateField = type === 'reminder' 
          ? { reminded_at: new Date().toISOString() }
          : type === 'escalation'
          ? { escalated_at: new Date().toISOString() }
          : { first_notified_at: new Date().toISOString() };

        await supabase
          .from('review_assignments')
          .update(updateField)
          .eq('id', assignmentId);

        // Log successful notification
        await logNotification(supabase, {
          organizationId,
          assignmentId,
          channel: 'slack_dm',
          recipient: reviewer.slackUserId,
          messageType: type,
          status: 'sent',
          externalMessageId: result.ts,
        });

        return { success: true, channel: 'slack_dm', messageTs: result.ts };
      } catch (error) {
        console.error('Failed to send Slack DM:', error);

        await logNotification(supabase, {
          organizationId,
          assignmentId,
          channel: 'slack_dm',
          recipient: reviewer.slackUserId,
          messageType: type,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        throw error; // Retry
      }
    }

    // Fallback: No Slack user ID, log for manual follow-up
    await logNotification(supabase, {
      organizationId,
      assignmentId,
      channel: 'pending',
      recipient: reviewer.githubUsername,
      messageType: type,
      status: 'pending',
      error: 'No Slack user ID configured',
    });

    return { success: false, reason: 'No Slack user ID' };
  },
});

async function logNotification(
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
  data: {
    organizationId: string;
    assignmentId: string;
    channel: string;
    recipient: string;
    messageType: string;
    status: string;
    externalMessageId?: string;
    error?: string;
  }
) {
  await supabase.from('notifications').insert({
    organization_id: data.organizationId,
    review_assignment_id: data.assignmentId,
    channel: data.channel,
    recipient: data.recipient,
    message_type: data.messageType,
    status: data.status,
    external_message_id: data.externalMessageId,
    error_message: data.error,
    sent_at: data.status === 'sent' ? new Date().toISOString() : null,
  });
}

function buildPRMessage(type: string, pr: PRDetails, reviewerUsername: string): string {
  switch (type) {
    case 'new_pr':
      return `New PR needs your review: "${pr.title}" by ${pr.author}`;
    case 'reminder':
      return `Reminder: PR "${pr.title}" is still waiting for your review (24h+)`;
    case 'escalation':
      return `Escalation: PR "${pr.title}" has been waiting 48+ hours for review from @${reviewerUsername}`;
    default:
      return `PR Update: "${pr.title}"`;
  }
}

function buildPRBlocks(type: string, pr: PRDetails): object[] {
  const headerText = type === 'new_pr' 
    ? ':eyes: New PR Needs Your Review'
    : type === 'reminder'
    ? ':bell: Review Reminder (24h+)'
    : ':warning: Review Escalation (48h+)';

  return [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: headerText,
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*<${pr.htmlUrl}|${pr.title}>*`,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Author:*\n${pr.author}`,
        },
        {
          type: 'mrkdwn',
          text: `*Repository:*\n${pr.repository}`,
        },
        {
          type: 'mrkdwn',
          text: `*Files Changed:*\n${pr.filesChanged}`,
        },
        {
          type: 'mrkdwn',
          text: `*Changes:*\n+${pr.additions} / -${pr.deletions}`,
        },
      ],
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'View PR',
            emoji: true,
          },
          url: pr.htmlUrl,
          style: 'primary',
        },
      ],
    },
    {
      type: 'divider',
    },
  ];
}

