import type { RoutingCondition } from '@/lib/schema/routing-rule';
import type { PullRequestContext, ConditionResult } from './types';

/**
 * Evaluate a file pattern condition
 * Matches if any/all files match any of the regex patterns
 */
export function matchFilePattern(
  condition: Extract<RoutingCondition, { type: 'file_pattern' }>,
  context: PullRequestContext
): ConditionResult {
  const { patterns, match_mode } = condition;

  if (context.files_changed.length === 0) {
    return {
      type: 'file_pattern',
      matched: false,
      details: 'No files changed',
    };
  }

  // Compile regex patterns
  const regexPatterns = patterns
    .map((p) => {
      try {
        return new RegExp(p);
      } catch {
        console.warn(`Invalid regex pattern: ${p}`);
        return null;
      }
    })
    .filter(Boolean) as RegExp[];

  if (regexPatterns.length === 0) {
    return {
      type: 'file_pattern',
      matched: false,
      details: 'No valid patterns',
    };
  }

  // Check if any file matches any pattern
  const fileMatches = context.files_changed.filter((file) =>
    regexPatterns.some((regex) => regex.test(file))
  );

  const matched =
    match_mode === 'all'
      ? fileMatches.length === context.files_changed.length
      : fileMatches.length > 0;

  return {
    type: 'file_pattern',
    matched,
    details: `${fileMatches.length}/${context.files_changed.length} files matched`,
  };
}

/**
 * Evaluate an author condition
 * Matches if author is in/not in the username list
 */
export function matchAuthor(
  condition: Extract<RoutingCondition, { type: 'author' }>,
  context: PullRequestContext
): ConditionResult {
  const { usernames, mode } = condition;

  const authorLower = context.author_login.toLowerCase();
  const usernamesLower = usernames.map((u) => u.toLowerCase());

  const authorInList = usernamesLower.includes(authorLower);

  // 'include' = match if author IS in list
  // 'exclude' = match if author is NOT in list
  const matched = mode === 'include' ? authorInList : !authorInList;

  return {
    type: 'author',
    matched,
    details: `Author ${context.author_login} ${authorInList ? 'in' : 'not in'} list, mode=${mode}`,
  };
}

/**
 * Evaluate a time window condition
 * Matches if current time is within the specified window
 */
export function matchTimeWindow(
  condition: Extract<RoutingCondition, { type: 'time_window' }>,
  context: PullRequestContext
): ConditionResult {
  const { timezone, days, start_hour, end_hour } = condition;

  // Get current time in specified timezone
  const now = new Date();
  let formatter: Intl.DateTimeFormat;

  try {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'short',
      hour: 'numeric',
      hour12: false,
    });
  } catch {
    // Invalid timezone, default to UTC
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC',
      weekday: 'short',
      hour: 'numeric',
      hour12: false,
    });
  }

  const parts = formatter.formatToParts(now);
  const weekdayPart = parts.find((p) => p.type === 'weekday');
  const hourPart = parts.find((p) => p.type === 'hour');

  const weekday = weekdayPart?.value.toLowerCase().slice(0, 3) as
    | 'mon'
    | 'tue'
    | 'wed'
    | 'thu'
    | 'fri'
    | 'sat'
    | 'sun';
  const hour = parseInt(hourPart?.value || '0', 10);

  // Check if day matches
  const dayMatches = days.includes(weekday);

  // Check if hour is in range (handles wrap-around, e.g., 22-06)
  let hourMatches: boolean;
  if (start_hour <= end_hour) {
    hourMatches = hour >= start_hour && hour < end_hour;
  } else {
    // Wrap around (e.g., 22:00 to 06:00)
    hourMatches = hour >= start_hour || hour < end_hour;
  }

  const matched = dayMatches && hourMatches;

  return {
    type: 'time_window',
    matched,
    details: `${weekday} ${hour}:00 in ${timezone}, day=${dayMatches}, hour=${hourMatches}`,
  };
}

/**
 * Evaluate a branch condition
 * Matches if head/base branch matches any pattern
 */
export function matchBranch(
  condition: Extract<RoutingCondition, { type: 'branch' }>,
  context: PullRequestContext
): ConditionResult {
  const { patterns, branch_type } = condition;

  const branchToCheck =
    branch_type === 'head' ? context.head_branch : context.base_branch;

  // Compile regex patterns
  const regexPatterns = patterns
    .map((p) => {
      try {
        return new RegExp(p);
      } catch {
        console.warn(`Invalid branch regex pattern: ${p}`);
        return null;
      }
    })
    .filter(Boolean) as RegExp[];

  if (regexPatterns.length === 0) {
    return {
      type: 'branch',
      matched: false,
      details: 'No valid patterns',
    };
  }

  const matched = regexPatterns.some((regex) => regex.test(branchToCheck));

  return {
    type: 'branch',
    matched,
    details: `${branch_type} branch "${branchToCheck}" ${matched ? 'matched' : 'did not match'}`,
  };
}

/**
 * Evaluate a label condition
 * Matches if PR has any/all of the specified labels
 */
export function matchLabel(
  condition: Extract<RoutingCondition, { type: 'label' }>,
  context: PullRequestContext
): ConditionResult {
  const { labels, match_mode } = condition;

  if (context.labels.length === 0) {
    return {
      type: 'label',
      matched: false,
      details: 'PR has no labels',
    };
  }

  const prLabelsLower = context.labels.map((l) => l.toLowerCase());
  const requiredLabelsLower = labels.map((l) => l.toLowerCase());

  const matchedLabels = requiredLabelsLower.filter((label) =>
    prLabelsLower.includes(label)
  );

  const matched =
    match_mode === 'all'
      ? matchedLabels.length === requiredLabelsLower.length
      : matchedLabels.length > 0;

  return {
    type: 'label',
    matched,
    details: `${matchedLabels.length}/${requiredLabelsLower.length} labels matched`,
  };
}

/**
 * Evaluate a single condition
 */
export function evaluateCondition(
  condition: RoutingCondition,
  context: PullRequestContext
): ConditionResult {
  switch (condition.type) {
    case 'file_pattern':
      return matchFilePattern(condition, context);
    case 'author':
      return matchAuthor(condition, context);
    case 'time_window':
      return matchTimeWindow(condition, context);
    case 'branch':
      return matchBranch(condition, context);
    case 'label':
      return matchLabel(condition, context);
    default:
      return {
        type: 'unknown',
        matched: false,
        details: 'Unknown condition type',
      };
  }
}

/**
 * Evaluate all conditions for a rule
 * All conditions must match for the rule to match (AND logic)
 */
export function evaluateAllConditions(
  conditions: RoutingCondition[],
  context: PullRequestContext
): { matched: boolean; results: ConditionResult[] } {
  const results: ConditionResult[] = [];

  for (const condition of conditions) {
    const result = evaluateCondition(condition, context);
    results.push(result);

    // Short-circuit on first non-match
    if (!result.matched) {
      return { matched: false, results };
    }
  }

  return { matched: true, results };
}
