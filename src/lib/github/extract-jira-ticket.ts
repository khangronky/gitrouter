/**
 * Extracts Jira ticket ID from PR title or body
 * Looks for patterns like: ABC-123, PROJ-456, etc.
 */
export function extractJiraTicketId(title: string, body: string | null): string | null {
  // Jira ticket pattern: PROJECT-NUMBER
  // Project key is 2-10 uppercase letters, followed by a hyphen, followed by digits
  const jiraPattern = /\b([A-Z]{2,10}-\d+)\b/;

  // First check the title (most common location)
  const titleMatch = title.match(jiraPattern);
  if (titleMatch) {
    return titleMatch[1];
  }

  // Then check the body
  if (body) {
    const bodyMatch = body.match(jiraPattern);
    if (bodyMatch) {
      return bodyMatch[1];
    }
  }

  return null;
}

/**
 * Extracts all Jira ticket IDs from text (for cases where multiple tickets are referenced)
 */
export function extractAllJiraTicketIds(text: string): string[] {
  const jiraPattern = /\b([A-Z]{2,10}-\d+)\b/g;
  const matches = text.match(jiraPattern);
  return matches ? [...new Set(matches)] : [];
}

