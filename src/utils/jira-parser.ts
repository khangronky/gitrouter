/**
 * Jira ticket ID parsing utilities
 * Pure functions for extracting and validating Jira ticket IDs
 */

import { jiraTicketIdPattern } from '@/lib/schema/jira';

/**
 * Extract Jira ticket ID from PR title
 */
export function extractFromTitle(title: string): string | null {
  const match = title.match(jiraTicketIdPattern);
  return match ? match[1] : null;
}

/**
 * Extract Jira ticket ID from PR body
 */
export function extractFromBody(body: string | null): string | null {
  if (!body) return null;
  const match = body.match(jiraTicketIdPattern);
  return match ? match[1] : null;
}

/**
 * Extract Jira ticket ID from branch name
 * Common patterns:
 * - feature/ABC-123-description
 * - ABC-123-feature
 * - ABC-123
 */
export function extractFromBranch(branch: string): string | null {
  const match = branch.match(jiraTicketIdPattern);
  return match ? match[1] : null;
}

/**
 * Extract Jira ticket ID from multiple sources
 * Priority: title > branch > body
 */
export function extractTicketId(pr: {
  title: string;
  body?: string | null;
  head_branch?: string;
}): string | null {
  // Try title first (most common)
  const fromTitle = extractFromTitle(pr.title);
  if (fromTitle) return fromTitle;

  // Try branch name
  if (pr.head_branch) {
    const fromBranch = extractFromBranch(pr.head_branch);
    if (fromBranch) return fromBranch;
  }

  // Try body
  const fromBody = extractFromBody(pr.body || null);
  if (fromBody) return fromBody;

  return null;
}

/**
 * Extract all ticket IDs mentioned in a PR
 * Useful for PRs that reference multiple tickets
 */
export function extractAllTicketIds(pr: {
  title: string;
  body?: string | null;
  head_branch?: string;
}): string[] {
  const tickets = new Set<string>();

  // Global regex to find all matches
  const globalPattern = new RegExp(jiraTicketIdPattern.source, 'g');

  // Check title
  for (const match of pr.title.matchAll(globalPattern)) {
    tickets.add(match[1]);
  }

  // Check branch
  if (pr.head_branch) {
    for (const match of pr.head_branch.matchAll(globalPattern)) {
      tickets.add(match[1]);
    }
  }

  // Check body
  if (pr.body) {
    for (const match of pr.body.matchAll(globalPattern)) {
      tickets.add(match[1]);
    }
  }

  return Array.from(tickets);
}

/**
 * Validate that a string is a valid Jira ticket ID format
 */
export function isValidTicketId(ticketId: string): boolean {
  return jiraTicketIdPattern.test(ticketId);
}

/**
 * Build Jira issue URL
 */
export function buildJiraUrl(domain: string, ticketId: string): string {
  return `https://${domain}/browse/${ticketId}`;
}
