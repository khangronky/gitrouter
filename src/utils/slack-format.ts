/**
 * Slack formatting utilities
 * Pure functions for formatting Slack messages
 */

/**
 * Escape special Slack mrkdwn characters
 */
export function escapeMarkdown(text: string): string {
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
