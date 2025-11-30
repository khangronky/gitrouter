import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  JiraIssueType,
  JiraProjectType,
  JiraTransitionType,
  JiraUserType,
} from '@/lib/schema/jira';

/**
 * Jira API client configuration
 */
export interface JiraConfig {
  domain: string; // e.g., "company.atlassian.net"
  email: string;
  apiToken: string;
}

/**
 * Create Basic Auth header for Jira API
 */
function createAuthHeader(email: string, apiToken: string): string {
  const credentials = Buffer.from(`${email}:${apiToken}`).toString('base64');
  return `Basic ${credentials}`;
}

/**
 * Make a request to Jira API
 */
async function jiraFetch<T>(
  config: JiraConfig,
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
  const url = `https://${config.domain}/rest/api/3${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: createAuthHeader(config.email, config.apiToken),
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
        errorMessage = errorJson.errorMessages?.[0] || errorJson.message || errorMessage;
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
 * Get Jira config for an organization
 */
export async function getOrgJiraConfig(
  supabase: SupabaseClient,
  organizationId: string
): Promise<JiraConfig | null> {
  const { data, error } = await supabase
    .from('jira_integrations')
    .select('domain, email, api_token')
    .eq('organization_id', organizationId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    domain: data.domain,
    email: data.email,
    apiToken: data.api_token,
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
  const { data, error } = await jiraFetch<{ transitions: JiraTransitionType[] }>(
    config,
    `/issue/${issueKey}/transitions`
  );

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
    (t) => t.to.name.toLowerCase() === statusName.toLowerCase() ||
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
  const { data, error } = await jiraFetch<Array<{ statuses: Array<{ id: string; name: string }> }>>(
    config,
    `/project/${projectKey}/statuses`
  );

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

