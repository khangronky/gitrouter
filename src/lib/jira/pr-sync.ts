import type { SupabaseClient } from '@supabase/supabase-js';
import {
  getOrgJiraConfig,
  getJiraIssue,
  transitionIssueToStatus,
  addIssueComment,
  createRemoteLink,
} from './client';

/**
 * Link a PR to a Jira issue when PR is opened
 */
export async function linkPrToJiraIssue(
  supabase: SupabaseClient,
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
 * Update Jira issue when PR is merged
 */
export async function updateJiraOnMerge(
  supabase: SupabaseClient,
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

  // Get the configured status to transition to
  const { data: integration } = await supabase
    .from('jira_integrations')
    .select('status_on_merge')
    .eq('organization_id', organizationId)
    .single();

  let transitioned = false;
  let commented = false;

  // Transition to configured status if set
  if (integration?.status_on_merge) {
    transitioned = await transitionIssueToStatus(
      config,
      ticketId,
      integration.status_on_merge
    );
  }

  // Add merge comment
  const comment = `✅ PR #${pr.number} merged!\n\n` +
    `*${pr.title}*\n` +
    `Repository: ${pr.repository_full_name}\n` +
    (pr.merged_by ? `Merged by: ${pr.merged_by}\n` : '') +
    `View: ${pr.html_url}`;

  commented = await addIssueComment(config, ticketId, comment);

  return { transitioned, commented };
}

/**
 * Add comment to Jira when PR is closed without merge
 */
export async function updateJiraOnClose(
  supabase: SupabaseClient,
  organizationId: string,
  ticketId: string,
  pr: {
    title: string;
    number: number;
    html_url: string;
  }
): Promise<boolean> {
  const config = await getOrgJiraConfig(supabase, organizationId);
  if (!config) {
    return false;
  }

  const comment = `❌ PR #${pr.number} closed without merge.\n\n` +
    `*${pr.title}*\n` +
    `View: ${pr.html_url}`;

  return addIssueComment(config, ticketId, comment);
}

/**
 * Sync PR with Jira based on PR status
 */
export async function syncPrWithJira(
  supabase: SupabaseClient,
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
): Promise<void> {
  if (!pr.jira_ticket_id) {
    return;
  }

  switch (pr.status) {
    case 'open':
      await linkPrToJiraIssue(supabase, organizationId, pr.jira_ticket_id, pr);
      break;

    case 'merged':
      await updateJiraOnMerge(supabase, organizationId, pr.jira_ticket_id, pr);
      break;

    case 'closed':
      await updateJiraOnClose(supabase, organizationId, pr.jira_ticket_id, pr);
      break;
  }
}

