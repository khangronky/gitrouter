import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

type TypedSupabaseClient = SupabaseClient<Database>;

import {
  addIssueComment,
  createJiraIssue,
  createRemoteLink,
  deleteJiraIssue,
  getJiraIssue,
  getOrgJiraConfig,
  searchJiraUser,
  transitionIssueToStatus,
} from './client';

/**
 * Link a PR to a Jira issue when PR is opened
 */
export async function linkPrToJiraIssue(
  supabase: TypedSupabaseClient,
  organizationId: string,
  ticketId: string,
  pr: {
    title: string;
    number: number;
    html_url: string;
    author_login: string;
    repository_full_name: string;
  }
): Promise<boolean> {
  const config = await getOrgJiraConfig(supabase, organizationId);
  if (!config) {
    console.log('No Jira integration for org:', organizationId);
    return false;
  }

  // Verify ticket exists
  const issue = await getJiraIssue(config, ticketId);
  if (!issue) {
    console.warn(`Jira issue ${ticketId} not found`);
    return false;
  }

  // Create remote link
  const linked = await createRemoteLink(config, ticketId, {
    url: pr.html_url,
    title: `PR #${pr.number}: ${pr.title}`,
    summary: `Pull request by ${pr.author_login} in ${pr.repository_full_name}`,
  });

  return linked;
}

/**
 * Update Jira issue when PR is merged (transition to Done)
 */
export async function updateJiraOnMerge(
  supabase: TypedSupabaseClient,
  organizationId: string,
  ticketId: string,
  pr: {
    title: string;
    number: number;
    html_url: string;
    merged_by?: string;
    repository_full_name: string;
  }
): Promise<{ transitioned: boolean; commented: boolean }> {
  const config = await getOrgJiraConfig(supabase, organizationId);
  if (!config) {
    console.log('No Jira integration for org:', organizationId);
    return { transitioned: false, commented: false };
  }

  // Get the configured status to transition to (default to Done)
  const { data: integration } = await supabase
    .from('jira_integrations')
    .select('status_on_merge')
    .eq('organization_id', organizationId)
    .single();

  const targetStatus = integration?.status_on_merge || 'Done';

  // Transition to target status
  const transitioned = await transitionIssueToStatus(
    config,
    ticketId,
    targetStatus
  );
  if (transitioned) {
    console.log(
      `Transitioned Jira ticket ${ticketId} to ${targetStatus} - PR #${pr.number} merged`
    );
  }

  // Add merge comment
  const comment =
    `✅ PR #${pr.number} merged!\n\n` +
    `*${pr.title}*\n` +
    `Repository: ${pr.repository_full_name}\n` +
    (pr.merged_by ? `Merged by: ${pr.merged_by}\n` : '') +
    `View: ${pr.html_url}`;

  const commented = await addIssueComment(config, ticketId, comment);

  return { transitioned, commented };
}

/**
 * Delete Jira ticket when PR is closed without merge
 */
export async function updateJiraOnClose(
  supabase: TypedSupabaseClient,
  organizationId: string,
  ticketId: string,
  pr: {
    title: string;
    number: number;
    html_url: string;
  }
): Promise<{ deleted: boolean }> {
  const config = await getOrgJiraConfig(supabase, organizationId);
  if (!config) {
    return { deleted: false };
  }

  // Delete the Jira ticket since PR was closed without merge
  const deleted = await deleteJiraIssue(config, ticketId);
  if (deleted) {
    console.log(
      `Deleted Jira ticket ${ticketId} - PR #${pr.number} was closed without merge`
    );
  }

  return { deleted };
}

/**
 * Create a Jira ticket for a PR
 */
export async function createJiraTicketForPr(
  supabase: TypedSupabaseClient,
  organizationId: string,
  pr: {
    title: string;
    number: number;
    html_url: string;
    author_login: string;
    repository_full_name: string;
  }
): Promise<string | null> {
  // Get Jira integration config
  const { data: integration } = await supabase
    .from('jira_integrations')
    .select('default_project_key')
    .eq('organization_id', organizationId)
    .single();

  if (!integration?.default_project_key) {
    console.log('No default Jira project configured for org:', organizationId);
    return null;
  }

  const config = await getOrgJiraConfig(supabase, organizationId);
  if (!config) {
    console.log('No Jira integration for org:', organizationId);
    return null;
  }

  // Try to find the PR author in Jira to assign the ticket
  let assigneeAccountId: string | undefined;
  let authorNote = '';
  const jiraUser = await searchJiraUser(config, pr.author_login);
  if (jiraUser) {
    assigneeAccountId = jiraUser.accountId;
    console.log(
      `Found Jira user for ${pr.author_login}: ${jiraUser.displayName}`
    );
  } else {
    console.log(`No Jira user found for GitHub user: ${pr.author_login}`);
    authorNote = `\n\n⚠️ GitHub user @${pr.author_login} could not be matched to a Jira user. Please assign manually.`;
  }

  // Create the issue
  const description =
    `Pull Request: ${pr.html_url}\n` +
    `Author: ${pr.author_login}\n` +
    `Repository: ${pr.repository_full_name}` +
    authorNote;

  const result = await createJiraIssue(
    config,
    integration.default_project_key,
    {
      summary: `[PR#${pr.number}] <${pr.repository_full_name}> ${pr.title}`,
      description,
      issueTypeName: 'Task',
      assigneeAccountId,
    }
  );

  if (!result) {
    console.error('Failed to create Jira ticket for PR:', pr.number);
    return null;
  }

  // Link the PR to the newly created issue
  await createRemoteLink(config, result.key, {
    url: pr.html_url,
    title: `PR #${pr.number}: ${pr.title}`,
    summary: `Pull request by ${pr.author_login} in ${pr.repository_full_name}`,
  });

  console.log(
    `Created and linked Jira ticket ${result.key} for PR #${pr.number}${assigneeAccountId ? ' (assigned)' : ''}`
  );
  return result.key;
}

/**
 * Sync PR with Jira based on PR status
 * Returns the Jira ticket ID and status flags
 */
export async function syncPrWithJira(
  supabase: TypedSupabaseClient,
  organizationId: string,
  pr: {
    id: string;
    title: string;
    number: number;
    html_url: string;
    author_login: string;
    repository_full_name: string;
    jira_ticket_id: string | null;
    status: 'open' | 'merged' | 'closed';
    merged_by?: string;
  }
): Promise<{
  jira_ticket_id: string | null;
  deleted?: boolean;
  merged?: boolean;
}> {
  let ticketId = pr.jira_ticket_id;

  // For open PRs without a ticket, create one
  if (pr.status === 'open' && !ticketId) {
    ticketId = await createJiraTicketForPr(supabase, organizationId, pr);
    if (ticketId) {
      return { jira_ticket_id: ticketId };
    }
    return { jira_ticket_id: null };
  }

  // If no ticket ID at this point, nothing to sync
  if (!ticketId) {
    return { jira_ticket_id: null };
  }

  switch (pr.status) {
    case 'open':
      await linkPrToJiraIssue(supabase, organizationId, ticketId, pr);
      break;

    case 'merged':
      await updateJiraOnMerge(supabase, organizationId, ticketId, pr);
      return { jira_ticket_id: ticketId, merged: true };

    case 'closed': {
      const result = await updateJiraOnClose(
        supabase,
        organizationId,
        ticketId,
        pr
      );
      if (result.deleted) {
        return { jira_ticket_id: null, deleted: true };
      }
      break;
    }
  }

  return { jira_ticket_id: ticketId };
}
