import { createAdminClient } from '@/lib/supabase/server';

interface JiraCredentials {
  email: string;
  apiToken: string;
  siteUrl: string;
}

/**
 * Gets Jira credentials for an organization
 */
async function getJiraCredentials(organizationId: string): Promise<JiraCredentials | null> {
  const supabase = await createAdminClient();

  const { data: integration } = await supabase
    .from('jira_integrations')
    .select('email, access_token_encrypted, site_url')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .single();

  if (!integration || !integration.email || !integration.access_token_encrypted) {
    return null;
  }

  return {
    email: integration.email,
    apiToken: integration.access_token_encrypted, // TODO: Decrypt
    siteUrl: integration.site_url,
  };
}

/**
 * Creates Basic auth header for Jira API token authentication
 */
function createAuthHeader(email: string, apiToken: string): string {
  const credentials = Buffer.from(`${email}:${apiToken}`).toString('base64');
  return `Basic ${credentials}`;
}

/**
 * Makes an authenticated request to Jira API using API token
 */
async function jiraRequest(
  organizationId: string,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const credentials = await getJiraCredentials(organizationId);
  
  if (!credentials) {
    throw new Error('Jira not connected for this organization');
  }

  // Normalize site URL (remove protocol if present, ensure no trailing slash)
  let baseUrl = credentials.siteUrl
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');
  
  const url = `https://${baseUrl}/rest/api/3${path}`;

  return fetch(url, {
    ...options,
    headers: {
      Authorization: createAuthHeader(credentials.email, credentials.apiToken),
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    },
  });
}

/**
 * Gets a Jira issue by key
 */
export async function getJiraIssue(
  organizationId: string,
  issueKey: string
): Promise<{
  id: string;
  key: string;
  summary: string;
  status: string;
  statusId: string;
} | null> {
  try {
    const response = await jiraRequest(
      organizationId,
      `/issue/${issueKey}?fields=summary,status`
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Issue not found
      }
      throw new Error(`Failed to get Jira issue: ${response.status}`);
    }

    const data = await response.json();

    return {
      id: data.id,
      key: data.key,
      summary: data.fields.summary,
      status: data.fields.status.name,
      statusId: data.fields.status.id,
    };
  } catch (error) {
    console.error('Error fetching Jira issue:', error);
    return null;
  }
}

/**
 * Adds a comment to a Jira issue
 */
export async function addJiraComment(
  organizationId: string,
  issueKey: string,
  comment: string
): Promise<boolean> {
  try {
    const response = await jiraRequest(
      organizationId,
      `/issue/${issueKey}/comment`,
      {
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
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Error adding Jira comment:', error);
    return false;
  }
}

/**
 * Transitions a Jira issue to a new status
 */
export async function transitionJiraIssue(
  organizationId: string,
  issueKey: string,
  transitionId: string
): Promise<boolean> {
  try {
    const response = await jiraRequest(
      organizationId,
      `/issue/${issueKey}/transitions`,
      {
        method: 'POST',
        body: JSON.stringify({
          transition: {
            id: transitionId,
          },
        }),
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Error transitioning Jira issue:', error);
    return false;
  }
}

/**
 * Gets available transitions for a Jira issue
 */
export async function getJiraTransitions(
  organizationId: string,
  issueKey: string
): Promise<Array<{ id: string; name: string }>> {
  try {
    const response = await jiraRequest(
      organizationId,
      `/issue/${issueKey}/transitions`
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.transitions.map((t: { id: string; name: string }) => ({
      id: t.id,
      name: t.name,
    }));
  } catch (error) {
    console.error('Error getting Jira transitions:', error);
    return [];
  }
}

/**
 * Links a PR to a Jira issue using remote link
 */
export async function linkPRToJiraIssue(
  organizationId: string,
  issueKey: string,
  pr: {
    title: string;
    url: string;
    repository: string;
    status: 'open' | 'merged' | 'closed';
  }
): Promise<boolean> {
  try {
    const statusIcon = pr.status === 'merged' 
      ? '✅' 
      : pr.status === 'closed' 
      ? '❌' 
      : '🔄';

    const response = await jiraRequest(
      organizationId,
      `/issue/${issueKey}/remotelink`,
      {
        method: 'POST',
        body: JSON.stringify({
          globalId: `github-pr-${pr.url}`,
          application: {
            type: 'com.github',
            name: 'GitHub',
          },
          relationship: 'Pull Request',
          object: {
            url: pr.url,
            title: `${statusIcon} ${pr.title}`,
            summary: `PR from ${pr.repository}`,
            icon: {
              url16x16: 'https://github.githubassets.com/favicons/favicon.png',
              title: 'GitHub',
            },
            status: {
              resolved: pr.status === 'merged',
              icon: {
                url16x16: pr.status === 'merged'
                  ? 'https://github.githubassets.com/images/icons/emoji/unicode/2705.png'
                  : 'https://github.githubassets.com/images/icons/emoji/unicode/1f504.png',
                title: pr.status,
              },
            },
          },
        }),
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Error linking PR to Jira:', error);
    return false;
  }
}

/**
 * Handles PR merge: updates Jira issue status and adds comment
 */
export async function handlePRMerge(
  organizationId: string,
  issueKey: string,
  pr: {
    title: string;
    url: string;
    repository: string;
    author: string;
    mergedAt: string;
  }
): Promise<{ success: boolean; transitioned: boolean; commented: boolean }> {
  const result = { success: false, transitioned: false, commented: false };

  // Get integration settings
  const supabase = await createAdminClient();
  const { data: integration } = await supabase
    .from('jira_integrations')
    .select('auto_transition_enabled, merge_transition_id')
    .eq('organization_id', organizationId)
    .single();

  if (!integration) {
    return result;
  }

  // Add merge comment
  const comment = `Pull request merged:\n\n` +
    `**${pr.title}**\n` +
    `Repository: ${pr.repository}\n` +
    `Author: ${pr.author}\n` +
    `Merged at: ${new Date(pr.mergedAt).toLocaleString()}\n` +
    `[View PR](${pr.url})`;

  result.commented = await addJiraComment(organizationId, issueKey, comment);

  // Update remote link status
  await linkPRToJiraIssue(organizationId, issueKey, {
    title: pr.title,
    url: pr.url,
    repository: pr.repository,
    status: 'merged',
  });

  // Transition issue if enabled
  if (integration.auto_transition_enabled && integration.merge_transition_id) {
    result.transitioned = await transitionJiraIssue(
      organizationId,
      issueKey,
      integration.merge_transition_id
    );
  }

  result.success = result.commented;
  return result;
}

/**
 * Test Jira connection with provided credentials
 */
export async function testJiraConnection(
  email: string,
  apiToken: string,
  siteUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Normalize site URL
    const baseUrl = siteUrl
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '');
    
    const url = `https://${baseUrl}/rest/api/3/myself`;
    
    const response = await fetch(url, {
      headers: {
        Authorization: createAuthHeader(email, apiToken),
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return { success: false, error: 'Invalid email or API token' };
      }
      if (response.status === 404) {
        return { success: false, error: 'Invalid Jira site URL' };
      }
      return { success: false, error: `Connection failed: ${response.status}` };
    }

    return { success: true };
  } catch (error) {
    console.error('Jira connection test error:', error);
    return { success: false, error: 'Failed to connect to Jira' };
  }
}
