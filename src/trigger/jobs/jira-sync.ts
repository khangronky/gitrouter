import { task } from '@trigger.dev/sdk/v3';
import { createAdminClient } from '@/lib/supabase/server';
import { 
  handlePRMerge, 
  linkPRToJiraIssue, 
  getJiraIssue, 
  createJiraIssue,
  getDefaultProjectKey,
} from '@/lib/jira/client';

interface JiraSyncPayload {
  type: 'pr_opened' | 'pr_merged' | 'pr_closed' | 'create_ticket';
  organizationId: string;
  prId: string;
  jiraTicketId?: string; // Optional for create_ticket
  pr: {
    title: string;
    body?: string | null;
    url: string;
    repository: string;
    author: string;
    mergedAt?: string | null;
  };
}

/**
 * Background job to sync PR status with Jira
 * - Creates new Jira ticket when PR is opened (if enabled)
 * - Links PR to Jira issue when opened
 * - Updates status and adds comment when merged
 */
export const jiraSyncTask = task({
  id: 'jira-sync',
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 30000,
  },
  run: async (payload: JiraSyncPayload) => {
    const { type, organizationId, prId, jiraTicketId, pr } = payload;

    console.log('Syncing Jira:', { type, prId, jiraTicketId });

    const supabase = await createAdminClient();

    // Check if Jira is configured for this org
    const { data: integration } = await supabase
      .from('jira_integrations')
      .select('is_active, project_keys, auto_create_tickets')
      .eq('organization_id', organizationId)
      .single();

    if (!integration?.is_active) {
      console.log('Jira not active for org:', organizationId);
      return { success: false, reason: 'Jira not configured' };
    }

    switch (type) {
      case 'create_ticket': {
        // Create a new Jira ticket for this PR
        const projectKey = await getDefaultProjectKey(organizationId);
        
        if (!projectKey) {
          console.warn('No default project key configured for Jira');
          return { success: false, reason: 'No project key configured' };
        }

        // Create the ticket
        const result = await createJiraIssue(organizationId, {
          projectKey,
          summary: pr.title,
          description: pr.body || undefined,
          issueType: 'Task',
          labels: ['from-pr', 'auto-created'],
          prUrl: pr.url,
          repository: pr.repository,
          author: pr.author,
        });

        if (!result.success || !result.issueKey) {
          console.error('Failed to create Jira ticket:', result.error);
          return { success: false, reason: result.error };
        }

        // Update the PR with the new Jira ticket ID
        await supabase
          .from('pull_requests')
          .update({ jira_ticket_id: result.issueKey })
          .eq('id', prId);

        // Link the PR to the newly created ticket
        await linkPRToJiraIssue(organizationId, result.issueKey, {
          title: pr.title,
          url: pr.url,
          repository: pr.repository,
          status: 'open',
        });

        return { 
          success: true, 
          action: 'created',
          issueKey: result.issueKey,
          issueUrl: result.issueUrl,
        };
      }

      case 'pr_opened': {
        if (!jiraTicketId) {
          return { success: false, reason: 'No Jira ticket ID provided' };
        }

        // Verify the Jira issue exists
        const issue = await getJiraIssue(organizationId, jiraTicketId);
        
        if (!issue) {
          console.warn('Jira issue not found:', jiraTicketId);
          return { success: false, reason: 'Issue not found' };
        }

        // Link PR to Jira issue
        const linked = await linkPRToJiraIssue(organizationId, jiraTicketId, {
          title: pr.title,
          url: pr.url,
          repository: pr.repository,
          status: 'open',
        });

        return { success: linked, action: 'linked' };
      }

      case 'pr_merged': {
        if (!jiraTicketId) {
          return { success: false, reason: 'No Jira ticket ID provided' };
        }

        if (!pr.mergedAt) {
          return { success: false, reason: 'Missing mergedAt' };
        }

        // Verify the Jira issue exists
        const issue = await getJiraIssue(organizationId, jiraTicketId);
        
        if (!issue) {
          console.warn('Jira issue not found:', jiraTicketId);
          return { success: false, reason: 'Issue not found' };
        }

        const result = await handlePRMerge(organizationId, jiraTicketId, {
          title: pr.title,
          url: pr.url,
          repository: pr.repository,
          author: pr.author,
          mergedAt: pr.mergedAt,
        });

        return {
          success: result.success,
          action: 'merged',
          transitioned: result.transitioned,
          commented: result.commented,
        };
      }

      case 'pr_closed': {
        if (!jiraTicketId) {
          return { success: false, reason: 'No Jira ticket ID provided' };
        }

        // Verify the Jira issue exists
        const issue = await getJiraIssue(organizationId, jiraTicketId);
        
        if (!issue) {
          console.warn('Jira issue not found:', jiraTicketId);
          return { success: false, reason: 'Issue not found' };
        }

        // Update remote link to show closed status
        const linked = await linkPRToJiraIssue(organizationId, jiraTicketId, {
          title: pr.title,
          url: pr.url,
          repository: pr.repository,
          status: 'closed',
        });

        return { success: linked, action: 'closed' };
      }

      default:
        return { success: false, reason: 'Unknown action type' };
    }
  },
});
