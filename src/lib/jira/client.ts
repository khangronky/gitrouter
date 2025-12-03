import type { SupabaseClient } from '@supabase/supabase-js';

// biome-ignore lint: Using any for flexibility with typed/untyped clients
type AnySupabaseClient = SupabaseClient<any>;
import type {
  JiraIssueType,
  JiraProjectType,
  JiraTransitionType,
  JiraUserType,
} from '@/lib/schema/jira';

/**
 * Jira API client configuration (OAuth 2.0)
 */
export interface JiraConfig {
  cloudId: string;
  accessToken: string;
  refreshToken?: string | null;
  tokenExpiresAt?: Date | null;
  organizationId?: string;
}

/**
 * Token refresh callback type
 */
type TokenRefreshCallback = (
  organizationId: string,
  newAccessToken: string,
  newRefreshToken: string | null,
  expiresAt: Date
) => Promise<void>;

let tokenRefreshCallback: TokenRefreshCallback | null = null;

/**
 * Set the callback for token refresh
 */
export function setTokenRefreshCallback(callback: TokenRefreshCallback) {
  tokenRefreshCallback = callback;
}

/**
 * Refresh Jira OAuth token
 */
async function refreshJiraToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number;
} | null> {
  const clientId = process.env.JIRA_CLIENT_ID;
  const clientSecret = process.env.JIRA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('Jira OAuth credentials not configured');
    return null;
  }

  try {
    const response = await fetch('https://auth.atlassian.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      console.error('Failed to refresh Jira token:', await response.text());
      return null;
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || null,
      expiresIn: data.expires_in,
    };
  } catch (error) {
    console.error('Error refreshing Jira token:', error);
    return null;
  }
}

/**
 * Check if token needs refresh (within 5 minutes of expiry)
 */
function tokenNeedsRefresh(expiresAt: Date | null | undefined): boolean {
  if (!expiresAt) return false;
  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
  return expiresAt < fiveMinutesFromNow;
}

/**
 * Get a valid access token, refreshing if necessary
 */
async function getValidAccessToken(config: JiraConfig): Promise<string | null> {
  // Check if token needs refresh
  if (
    tokenNeedsRefresh(config.tokenExpiresAt) &&
    config.refreshToken &&
    config.organizationId
  ) {
    const refreshed = await refreshJiraToken(config.refreshToken);
    if (refreshed) {
      const newExpiresAt = new Date(Date.now() + refreshed.expiresIn * 1000);

      // Update config with new token
      config.accessToken = refreshed.accessToken;
      config.refreshToken = refreshed.refreshToken;
      config.tokenExpiresAt = newExpiresAt;

      // Persist the new token if callback is set
      if (tokenRefreshCallback) {
        await tokenRefreshCallback(
          config.organizationId,
          refreshed.accessToken,
          refreshed.refreshToken,
          newExpiresAt
        );
      }
    } else {
      console.error('Failed to refresh token');
      return null;
    }
  }

  return config.accessToken;
}

/**
 * Make a request to Jira API using OAuth 2.0
 */
async function jiraFetch<T>(
  config: JiraConfig,
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
  const accessToken = await getValidAccessToken(config);
  if (!accessToken) {
    return { data: null, error: 'Failed to get valid access token' };
  }

  // OAuth 2.0 uses the Atlassian API gateway with cloud ID
  const url = `https://api.atlassian.com/ex/jira/${config.cloudId}/rest/api/3${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Jira API error: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage =
          errorJson.errorMessages?.[0] || errorJson.message || errorMessage;
      } catch {
        // Use default error message
      }
      return { data: null, error: errorMessage };
    }

    // Handle empty responses
    const text = await response.text();
    if (!text) {
      return { data: null, error: null };
    }

    const data = JSON.parse(text) as T;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: `Network error: ${String(error)}` };
  }
}

/**
 * Get Jira config for an organization (OAuth 2.0)
 */
export async function getOrgJiraConfig(
  supabase: AnySupabaseClient,
  organizationId: string
): Promise<JiraConfig | null> {
  const { data, error } = await supabase
    .from('jira_integrations')
    .select('cloud_id, access_token, refresh_token, token_expires_at')
    .eq('organization_id', organizationId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    cloudId: data.cloud_id,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    tokenExpiresAt: data.token_expires_at
      ? new Date(data.token_expires_at)
      : null,
    organizationId,
  };
}

/**
 * Test Jira connection
 */
export async function testJiraConnection(
  config: JiraConfig
): Promise<{ success: boolean; message: string; user?: JiraUserType }> {
  const { data, error } = await jiraFetch<JiraUserType>(config, '/myself');

  if (error) {
    return { success: false, message: error };
  }

  if (!data) {
    return { success: false, message: 'No response from Jira' };
  }

  return {
    success: true,
    message: `Connected as ${data.displayName}`,
    user: data,
  };
}

/**
 * Get a Jira issue by key
 */
export async function getJiraIssue(
  config: JiraConfig,
  issueKey: string
): Promise<JiraIssueType | null> {
  const { data, error } = await jiraFetch<JiraIssueType>(
    config,
    `/issue/${issueKey}?fields=summary,description,status,assignee,reporter,project,issuetype,created,updated`
  );

  if (error) {
    console.error(`Failed to get Jira issue ${issueKey}:`, error);
    return null;
  }

  return data;
}

/**
 * Get available transitions for an issue
 */
export async function getIssueTransitions(
  config: JiraConfig,
  issueKey: string
): Promise<JiraTransitionType[]> {
  const { data, error } = await jiraFetch<{
    transitions: JiraTransitionType[];
  }>(config, `/issue/${issueKey}/transitions`);

  if (error || !data) {
    console.error(`Failed to get transitions for ${issueKey}:`, error);
    return [];
  }

  return data.transitions;
}

/**
 * Transition an issue to a new status
 */
export async function transitionIssue(
  config: JiraConfig,
  issueKey: string,
  transitionId: string
): Promise<boolean> {
  const { error } = await jiraFetch(config, `/issue/${issueKey}/transitions`, {
    method: 'POST',
    body: JSON.stringify({
      transition: { id: transitionId },
    }),
  });

  if (error) {
    console.error(`Failed to transition issue ${issueKey}:`, error);
    return false;
  }

  return true;
}

/**
 * Transition issue to a status by name
 */
export async function transitionIssueToStatus(
  config: JiraConfig,
  issueKey: string,
  statusName: string
): Promise<boolean> {
  const transitions = await getIssueTransitions(config, issueKey);

  // Find transition that leads to the desired status
  const transition = transitions.find(
    (t) =>
      t.to.name.toLowerCase() === statusName.toLowerCase() ||
      t.name.toLowerCase() === statusName.toLowerCase()
  );

  if (!transition) {
    console.warn(
      `No transition to "${statusName}" found for ${issueKey}. Available: ${transitions.map((t) => t.name).join(', ')}`
    );
    return false;
  }

  return transitionIssue(config, issueKey, transition.id);
}

/**
 * Add a comment to a Jira issue
 */
export async function addIssueComment(
  config: JiraConfig,
  issueKey: string,
  comment: string
): Promise<boolean> {
  const { error } = await jiraFetch(config, `/issue/${issueKey}/comment`, {
    method: 'POST',
    body: JSON.stringify({
      body: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: comment,
              },
            ],
          },
        ],
      },
    }),
  });

  if (error) {
    console.error(`Failed to add comment to ${issueKey}:`, error);
    return false;
  }

  return true;
}

/**
 * Create a remote link (link PR to Jira issue)
 */
export async function createRemoteLink(
  config: JiraConfig,
  issueKey: string,
  link: {
    url: string;
    title: string;
    summary?: string;
  }
): Promise<boolean> {
  const { error } = await jiraFetch(config, `/issue/${issueKey}/remotelink`, {
    method: 'POST',
    body: JSON.stringify({
      object: {
        url: link.url,
        title: link.title,
        summary: link.summary,
        icon: {
          url16x16: 'https://github.githubassets.com/favicon.ico',
          title: 'GitHub',
        },
      },
    }),
  });

  if (error) {
    console.error(`Failed to create remote link for ${issueKey}:`, error);
    return false;
  }

  return true;
}

/**
 * Delete a Jira issue
 */
export async function deleteJiraIssue(
  config: JiraConfig,
  issueKey: string
): Promise<boolean> {
  const { error } = await jiraFetch(config, `/issue/${issueKey}`, {
    method: 'DELETE',
  });

  if (error) {
    console.error(`Failed to delete Jira issue ${issueKey}:`, error);
    return false;
  }

  console.log(`Deleted Jira issue: ${issueKey}`);
  return true;
}

/**
 * List projects accessible to the user
 */
export async function listProjects(
  config: JiraConfig
): Promise<JiraProjectType[]> {
  const { data, error } = await jiraFetch<JiraProjectType[]>(
    config,
    '/project?maxResults=50'
  );

  if (error || !data) {
    console.error('Failed to list Jira projects:', error);
    return [];
  }

  return data;
}

/**
 * Get available statuses for a project
 */
export async function getProjectStatuses(
  config: JiraConfig,
  projectKey: string
): Promise<Array<{ id: string; name: string }>> {
  const { data, error } = await jiraFetch<
    Array<{ statuses: Array<{ id: string; name: string }> }>
  >(config, `/project/${projectKey}/statuses`);

  if (error || !data) {
    console.error('Failed to get project statuses:', error);
    return [];
  }

  // Flatten statuses from all issue types
  const allStatuses = data.flatMap((issueType) => issueType.statuses);

  // Deduplicate by name
  const uniqueStatuses = Array.from(
    new Map(allStatuses.map((s) => [s.name, s])).values()
  );

  return uniqueStatuses;
}

/**
 * Get issue types for a project
 */
export async function getProjectIssueTypes(
  config: JiraConfig,
  projectKey: string
): Promise<Array<{ id: string; name: string }>> {
  const { data, error } = await jiraFetch<{
    issueTypes: Array<{ id: string; name: string; subtask: boolean }>;
  }>(config, `/project/${projectKey}`);

  if (error || !data) {
    console.error('Failed to get project issue types:', error);
    return [];
  }

  // Filter out subtask types
  return data.issueTypes?.filter((t) => !t.subtask) || [];
}

/**
 * Search for a Jira user by email or display name
 * Tries to match GitHub username to a Jira user
 */
export async function searchJiraUser(
  config: JiraConfig,
  query: string
): Promise<JiraUserType | null> {
  // Try searching by query (matches email, displayName, etc.)
  const { data, error } = await jiraFetch<JiraUserType[]>(
    config,
    `/user/search?query=${encodeURIComponent(query)}&maxResults=10`
  );

  if (error || !data || data.length === 0) {
    return null;
  }

  // Look for exact matches first (case-insensitive)
  const queryLower = query.toLowerCase();

  // Try to find by email prefix or displayName containing the query
  const match = data.find((user) => {
    const emailPrefix = user.emailAddress?.split('@')[0]?.toLowerCase();
    const displayNameLower = user.displayName?.toLowerCase();
    return (
      emailPrefix === queryLower ||
      displayNameLower?.includes(queryLower) ||
      displayNameLower === queryLower
    );
  });

  return match || data[0]; // Return best match or first result
}

/**
 * Create a new Jira issue
 */
export async function createJiraIssue(
  config: JiraConfig,
  projectKey: string,
  issue: {
    summary: string;
    description?: string;
    issueTypeName?: string; // defaults to "Task"
    assigneeAccountId?: string; // Jira account ID to assign to
  }
): Promise<{ key: string; id: string } | null> {
  // Get issue types to find the correct ID
  const issueTypes = await getProjectIssueTypes(config, projectKey);
  const targetTypeName = issue.issueTypeName || 'Task';

  // Find the issue type (try exact match first, then case-insensitive)
  let issueType = issueTypes.find((t) => t.name === targetTypeName);
  if (!issueType) {
    issueType = issueTypes.find(
      (t) => t.name.toLowerCase() === targetTypeName.toLowerCase()
    );
  }

  if (!issueType) {
    console.error(
      `Issue type "${targetTypeName}" not found in project ${projectKey}. Available types: ${issueTypes.map((t) => t.name).join(', ')}`
    );
    return null;
  }

  // Build description in Atlassian Document Format (ADF)
  const descriptionContent = issue.description
    ? {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: issue.description,
              },
            ],
          },
        ],
      }
    : undefined;

  const { data, error } = await jiraFetch<{
    id: string;
    key: string;
    self: string;
  }>(config, '/issue', {
    method: 'POST',
    body: JSON.stringify({
      fields: {
        project: { key: projectKey },
        summary: issue.summary,
        issuetype: { id: issueType.id },
        ...(descriptionContent && { description: descriptionContent }),
        ...(issue.assigneeAccountId && {
          assignee: { accountId: issue.assigneeAccountId },
        }),
      },
    }),
  });

  if (error) {
    console.error(`Failed to create Jira issue in ${projectKey}:`, error);
    return null;
  }

  if (!data) {
    console.error('No data returned from Jira issue creation');
    return null;
  }

  console.log(`Created Jira issue: ${data.key}`);
  return { key: data.key, id: data.id };
}
