import { task } from '@trigger.dev/sdk/v3';
import { createDynamicAdminClient } from '@/lib/supabase/server';

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

    const supabase = await createDynamicAdminClient();

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

    // Determine target channel based on notification type
    const targetChannelId = type === 'escalation' 
      ? (slackIntegration.escalation_channel_id || slackIntegration.team_channel_id)
      : slackIntegration.team_channel_id;

    if (!targetChannelId) {
      console.warn('No channel configured for org:', organizationId);
      
      await logNotification(supabase, {
        organizationId,
        assignmentId,
        channel: 'slack_channel',
        recipient: reviewer.githubUsername,
        messageType: type,
        status: 'failed',
        error: 'No Slack channel configured',
      });

      return { success: false, reason: 'No Slack channel configured' };
    }

    try {
      const { sendSlackChannelMessage } = await import('@/lib/slack/client');
      
      const message = buildPRMessage(type, prDetails, reviewer.githubUsername, reviewer.slackUserId);
      const blocks = buildPRBlocks(type, prDetails, reviewer.githubUsername, reviewer.slackUserId);

      const result = await sendSlackChannelMessage(botToken, targetChannelId, message, blocks);

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
        channel: 'slack_channel',
        recipient: targetChannelId,
        messageType: type,
        status: 'sent',
        externalMessageId: result.ts,
      });

      return { success: true, channel: 'slack_channel', messageTs: result.ts };
    } catch (error) {
      console.error('Failed to send Slack channel message:', error);

      await logNotification(supabase, {
        organizationId,
        assignmentId,
        channel: 'slack_channel',
        recipient: targetChannelId,
        messageType: type,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error; // Retry
    }
  },
});

async function logNotification(
  supabase: Awaited<ReturnType<typeof createDynamicAdminClient>>,
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

function buildPRMessage(type: string, pr: PRDetails, reviewerUsername: string, slackUserId?: string | null): string {
  const reviewerMention = slackUserId ? `<@${slackUserId}>` : `@${reviewerUsername}`;
  
  switch (type) {
    case 'new_pr':
      return `${reviewerMention} New PR needs your review: "${pr.title}" by ${pr.author}`;
    case 'reminder':
      return `${reviewerMention} Reminder: PR "${pr.title}" is still waiting for your review (24h+)`;
    case 'escalation':
      return `Escalation: PR "${pr.title}" has been waiting 48+ hours for review from ${reviewerMention}`;
    default:
      return `PR Update: "${pr.title}"`;
  }
}

function buildPRBlocks(type: string, pr: PRDetails, reviewerUsername: string, slackUserId?: string | null): object[] {
  const isNew = type === 'new_pr';
  const isReminder = type === 'reminder';
  const isEscalation = type === 'escalation';

  // Reviewer mention for channel messages
  const reviewerMention = slackUserId ? `<@${slackUserId}>` : `@${reviewerUsername}`;

  // Dynamic styling based on notification type
  const headerEmoji = isNew ? '🆕' : isReminder ? '⏰' : '🚨';
  const accentEmoji = isNew ? '👀' : isReminder ? '🔔' : '⚠️';
  const urgencyText = isNew 
    ? `${reviewerMention} - New PR awaiting your review` 
    : isReminder 
    ? `${reviewerMention} - Gentle reminder, this PR has been waiting 24+ hours`
    : `${reviewerMention} - Urgent! This PR has been waiting 48+ hours`;

  // Calculate PR size indicator
  const totalChanges = pr.additions + pr.deletions;
  const sizeEmoji = totalChanges < 50 ? '🟢' : totalChanges < 200 ? '🟡' : totalChanges < 500 ? '🟠' : '🔴';
  const sizeLabel = totalChanges < 50 ? 'Small' : totalChanges < 200 ? 'Medium' : totalChanges < 500 ? 'Large' : 'XL';

  return [
    // Header with emoji
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${headerEmoji} ${isNew ? 'New Review Request' : isReminder ? 'Review Reminder' : 'Review Escalation'}`,
        emoji: true,
      },
    },
    // Context bar with urgency
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `${accentEmoji} ${urgencyText}`,
        },
      ],
    },
    // Divider
    {
      type: 'divider',
    },
    // PR Title as rich section with author avatar
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*<${pr.htmlUrl}|${pr.title}>*\n\n📂 \`${pr.repository}\``,
      },
      accessory: pr.authorAvatarUrl ? {
        type: 'image',
        image_url: pr.authorAvatarUrl,
        alt_text: pr.author,
      } : undefined,
    },
    // Stats in a clean grid
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*👤 Author*\n<https://github.com/${pr.author}|@${pr.author}>`,
        },
        {
          type: 'mrkdwn',
          text: `*📊 PR Size*\n${sizeEmoji} ${sizeLabel} (${totalChanges} lines)`,
        },
        {
          type: 'mrkdwn',
          text: `*📁 Files*\n${pr.filesChanged} file${pr.filesChanged !== 1 ? 's' : ''} changed`,
        },
        {
          type: 'mrkdwn',
          text: `*📈 Changes*\n\`+${pr.additions}\` · \`-${pr.deletions}\``,
        },
      ],
    },
    // Visual change bar (simple ASCII representation)
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: buildChangeBar(pr.additions, pr.deletions),
        },
      ],
    },
    // Action buttons
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '👁️ Review PR',
            emoji: true,
          },
          url: pr.htmlUrl,
          style: 'primary',
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '📝 View Files',
            emoji: true,
          },
          url: `${pr.htmlUrl}/files`,
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '💬 View Commits',
            emoji: true,
          },
          url: `${pr.htmlUrl}/commits`,
        },
      ],
    },
    // Footer
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `🤖 _Sent by SEPM-Noti_ · <${pr.htmlUrl}|Open in GitHub>`,
        },
      ],
    },
    {
      type: 'divider',
    },
  ];
}

// Helper function to create a visual change bar
function buildChangeBar(additions: number, deletions: number): string {
  const total = additions + deletions;
  if (total === 0) return '━━━━━━━━━━ No changes';
  
  const barLength = 10;
  const additionBars = Math.round((additions / total) * barLength);
  const deletionBars = barLength - additionBars;
  
  const greenBar = '🟩'.repeat(Math.max(1, additionBars));
  const redBar = '🟥'.repeat(Math.max(0, deletionBars));
  
  return `${greenBar}${redBar} +${additions} / -${deletions}`;
}


