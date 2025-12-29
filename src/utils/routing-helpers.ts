/**
 * Routing rule helper utilities
 * Pure functions for parsing and displaying routing rule data
 */

import type { ReviewerType } from '@/lib/schema/reviewer';
import type { RoutingCondition } from '@/lib/schema/routing-rule';

export type MatchType =
  | 'file_pattern'
  | 'author'
  | 'time_window'
  | 'branch'
  | 'label';

/**
 * Parse routing conditions to get match type and display value
 */
export function parseConditions(conditions: RoutingCondition[]): {
  matchType: MatchType;
  matchValue: string;
} {
  if (!conditions || conditions.length === 0) {
    return { matchType: 'file_pattern', matchValue: '' };
  }

  const condition = conditions[0];
  switch (condition.type) {
    case 'file_pattern':
      return {
        matchType: 'file_pattern',
        matchValue: condition.patterns?.[0] || '',
      };
    case 'author':
      return {
        matchType: 'author',
        matchValue: condition.usernames?.[0] || '',
      };
    case 'branch':
      return {
        matchType: 'branch',
        matchValue: condition.patterns?.[0] || '',
      };
    case 'time_window':
      return { matchType: 'time_window', matchValue: 'Custom Schedule' };
    case 'label':
      return {
        matchType: 'label',
        matchValue: condition.labels?.[0] || '',
      };
    default:
      return { matchType: 'file_pattern', matchValue: '' };
  }
}

/**
 * Get human-readable label for match type
 */
export function getMatchTypeLabel(type: MatchType): string {
  switch (type) {
    case 'file_pattern':
      return 'Files';
    case 'author':
      return 'Author';
    case 'time_window':
      return 'Time';
    case 'branch':
      return 'Branch';
    case 'label':
      return 'Label';
    default:
      return type;
  }
}

/**
 * Get reviewer names from reviewer IDs
 */
export function getReviewerNames(
  reviewerIds: string[],
  allReviewers: ReviewerType[]
): string {
  return reviewerIds
    .map((id) => {
      const reviewer = allReviewers.find((r) => r.id === id);
      return reviewer
        ? `@${reviewer.user?.github_username || reviewer.user?.full_name || 'Unknown'}`
        : null;
    })
    .filter(Boolean)
    .join(', ');
}
