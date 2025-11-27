import type { RuleConditions, RoutingContext, TimeWindow } from './types';

/**
 * Tests if a file path matches any of the given patterns
 */
export function matchesFilePatterns(
  filesChanged: string[],
  patterns: string[]
): boolean {
  if (patterns.length === 0) {
    return true; // No patterns means match all
  }

  for (const file of filesChanged) {
    for (const pattern of patterns) {
      try {
        const regex = new RegExp(pattern);
        if (regex.test(file)) {
          return true;
        }
      } catch (error) {
        // Invalid regex, skip
        console.warn(`Invalid file pattern regex: ${pattern}`, error);
      }
    }
  }

  return false;
}

/**
 * Tests if the author matches the rule conditions
 */
export function matchesAuthor(
  author: string,
  allowedAuthors?: string[],
  excludedAuthors?: string[]
): boolean {
  // If author is in excluded list, don't match
  if (excludedAuthors && excludedAuthors.length > 0) {
    const normalizedExcluded = excludedAuthors.map((a) => a.toLowerCase());
    if (normalizedExcluded.includes(author.toLowerCase())) {
      return false;
    }
  }

  // If allowed authors specified, check if author is in list
  if (allowedAuthors && allowedAuthors.length > 0) {
    const normalizedAllowed = allowedAuthors.map((a) => a.toLowerCase());
    return normalizedAllowed.includes(author.toLowerCase());
  }

  // No author restriction, match
  return true;
}

/**
 * Tests if the repository matches the rule conditions
 */
export function matchesRepository(
  repository: string,
  allowedRepos?: string[]
): boolean {
  if (!allowedRepos || allowedRepos.length === 0) {
    return true; // No restriction
  }

  const normalizedRepo = repository.toLowerCase();
  const normalizedAllowed = allowedRepos.map((r) => r.toLowerCase());

  return normalizedAllowed.includes(normalizedRepo);
}

/**
 * Tests if the current time falls within any of the time windows
 */
export function matchesTimeWindow(
  timeWindows?: TimeWindow[],
  now: Date = new Date()
): boolean {
  if (!timeWindows || timeWindows.length === 0) {
    return true; // No time restriction
  }

  for (const window of timeWindows) {
    if (isWithinTimeWindow(now, window)) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if a given time is within a specific time window
 */
function isWithinTimeWindow(now: Date, window: TimeWindow): boolean {
  try {
    // Convert to the specified timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: window.timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      weekday: 'short',
    });

    const parts = formatter.formatToParts(now);
    const hourPart = parts.find((p) => p.type === 'hour');
    const minutePart = parts.find((p) => p.type === 'minute');

    if (!hourPart || !minutePart) {
      return true; // Can't determine, allow
    }

    const currentTime = `${hourPart.value}:${minutePart.value}`;
    const currentDay = now.getDay(); // 0-6

    // Check day of week
    if (!window.days.includes(currentDay)) {
      return false;
    }

    // Compare times (simple string comparison works for HH:mm format)
    return currentTime >= window.start && currentTime <= window.end;
  } catch {
    // Invalid timezone or format, allow
    return true;
  }
}

/**
 * Tests if the title matches any of the given patterns
 */
export function matchesTitlePatterns(
  title: string,
  patterns?: string[]
): boolean {
  if (!patterns || patterns.length === 0) {
    return true; // No restriction
  }

  for (const pattern of patterns) {
    try {
      const regex = new RegExp(pattern, 'i'); // Case insensitive
      if (regex.test(title)) {
        return true;
      }
    } catch {
      // Invalid regex, skip
    }
  }

  return false;
}

/**
 * Tests if the file count is within the specified range
 */
export function matchesFileCount(
  fileCount: number,
  minFiles?: number,
  maxFiles?: number
): boolean {
  if (minFiles !== undefined && fileCount < minFiles) {
    return false;
  }
  if (maxFiles !== undefined && fileCount > maxFiles) {
    return false;
  }
  return true;
}

/**
 * Main condition matcher - evaluates all conditions for a rule
 * All specified conditions must match (AND logic)
 */
export function matchesConditions(
  context: RoutingContext,
  conditions: RuleConditions
): { matches: boolean; reason: string } {
  // Check file patterns
  if (conditions.file_patterns && conditions.file_patterns.length > 0) {
    if (!matchesFilePatterns(context.filesChanged, conditions.file_patterns)) {
      return { matches: false, reason: 'File patterns did not match' };
    }
  }

  // Check author
  if (!matchesAuthor(context.author, conditions.authors, conditions.exclude_authors)) {
    return { matches: false, reason: 'Author did not match' };
  }

  // Check repository
  if (!matchesRepository(context.repository, conditions.repositories)) {
    return { matches: false, reason: 'Repository did not match' };
  }

  // Check time window
  if (!matchesTimeWindow(conditions.time_windows)) {
    return { matches: false, reason: 'Outside time window' };
  }

  // Check title patterns
  if (!matchesTitlePatterns(context.title, conditions.title_patterns)) {
    return { matches: false, reason: 'Title did not match patterns' };
  }

  // Check file count
  if (!matchesFileCount(
    context.filesChanged.length,
    conditions.min_files_changed,
    conditions.max_files_changed
  )) {
    return { matches: false, reason: 'File count outside range' };
  }

  return { matches: true, reason: 'All conditions matched' };
}

