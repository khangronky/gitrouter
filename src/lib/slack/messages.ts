import type { SlackBlock } from '@/lib/schema/slack';

/**
 * Build PR notification message blocks
 */
export function buildPrNotificationBlocks(pr: {
  title: string;
  number: number;
  author: string;
  repo: string;
  url: string;
  files_changed: string[];
  additions: number;
  deletions: number;
  jira_ticket?: string | null;
}): SlackBlock[] {
  const blocks: SlackBlock[] = [
    // Header
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '🔔 New PR Review Request',
        emoji: true,
      },
    },
    // PR Title and Link
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*<${pr.url}|#${pr.number}: ${escapeMarkdown(pr.title)}>*`,
      },
    },
    // Metadata
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Repository:*\n${pr.repo}`,
        },
        {
          type: 'mrkdwn',
          text: `*Author:*\n${pr.author}`,
        },
        {
          type: 'mrkdwn',
          text: `*Changes:*\n+${pr.additions} / -${pr.deletions}`,
        },
        {
          type: 'mrkdwn',
          text: `*Files:*\n${pr.files_changed.length} files`,
        },
      ],
    },
  ];

  // Jira ticket if present
  if (pr.jira_ticket) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Jira:* ${pr.jira_ticket}`,
      },
    });
  }

  // Files changed (truncated)
  if (pr.files_changed.length > 0) {
    const maxFiles = 5;
    const displayFiles = pr.files_changed.slice(0, maxFiles);
    const remaining = pr.files_changed.length - maxFiles;

    let filesText = displayFiles.map((f) => `• \`${f}\``).join('\n');
    if (remaining > 0) {
      filesText += `\n_...and ${remaining} more files_`;
    }

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Files Changed:*\n${filesText}`,
      },
    });
  }

  // Divider
  blocks.push({ type: 'divider' });

  // Action buttons
  blocks.push({
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: '👀 View PR',
          emoji: true,
        },
        url: pr.url,
        action_id: 'view_pr',
      },
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: '✅ Approve',
          emoji: true,
        },
        style: 'primary',
        action_id: 'approve_pr',
        value: JSON.stringify({ pr_number: pr.number, repo: pr.repo }),
      },
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: '🔄 Request Changes',
          emoji: true,
        },
        style: 'danger',
        action_id: 'request_changes_pr',
        value: JSON.stringify({ pr_number: pr.number, repo: pr.repo }),
      },
    ],
  });

  // Context footer
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `Sent via GitRouter • <${pr.url}|View on GitHub>`,
      },
    ],
  });

  return blocks;
}

/**
 * Build 24h reminder message blocks
 */
export function buildReminderBlocks(pr: {
  title: string;
  number: number;
  repo: string;
  url: string;
  hours_pending: number;
}): SlackBlock[] {
  return [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '⏰ PR Review Reminder',
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*<${pr.url}|#${pr.number}: ${escapeMarkdown(pr.title)}>*\n\nThis PR has been waiting for your review for *${pr.hours_pending} hours*.`,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Repository:*\n${pr.repo}`,
        },
      ],
    },
    { type: 'divider' },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '👀 Review Now',
            emoji: true,
          },
          url: pr.url,
          style: 'primary',
          action_id: 'view_pr',
        },
      ],
    },
  ];
}

/**
 * Build 48h escalation message blocks (for team lead)
 */
export function buildEscalationBlocks(pr: {
  title: string;
  number: number;
  repo: string;
  url: string;
  reviewer_name: string;
  hours_pending: number;
}): SlackBlock[] {
  return [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '🚨 Stale PR Alert',
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*<${pr.url}|#${pr.number}: ${escapeMarkdown(pr.title)}>*\n\nThis PR has been awaiting review for *${pr.hours_pending} hours* and may be blocking progress.`,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Repository:*\n${pr.repo}`,
        },
        {
          type: 'mrkdwn',
          text: `*Assigned Reviewer:*\n${pr.reviewer_name}`,
        },
      ],
    },
    { type: 'divider' },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '👀 View PR',
            emoji: true,
          },
          url: pr.url,
          action_id: 'view_pr',
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '📤 Reassign Review',
            emoji: true,
          },
          action_id: 'reassign_review',
          value: JSON.stringify({ pr_number: pr.number, repo: pr.repo }),
        },
      ],
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: '⚠️ Consider reassigning this review to ensure timely feedback.',
        },
      ],
    },
  ];
}

/**
 * Build PR merged notification blocks
 */
export function buildPrMergedBlocks(pr: {
  title: string;
  number: number;
  repo: string;
  url: string;
  merged_by: string;
}): SlackBlock[] {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `✅ *PR Merged:* <${pr.url}|#${pr.number}: ${escapeMarkdown(pr.title)}>\n\nMerged by ${pr.merged_by} in ${pr.repo}`,
      },
    },
  ];
}

/**
 * Escape special Slack mrkdwn characters
 */
function escapeMarkdown(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Build fallback text for accessibility
 */
export function buildFallbackText(pr: {
  title: string;
  number: number;
  repo: string;
  url: string;
}): string {
  return `New PR Review Request: #${pr.number} - ${pr.title} in ${pr.repo}. View: ${pr.url}`;
}

