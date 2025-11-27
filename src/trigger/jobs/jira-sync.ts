import { task } from '@trigger.dev/sdk/v3';
import { createDynamicAdminClient } from '@/lib/supabase/server';
import { handlePRMerge, linkPRToJiraIssue, getJiraIssue } from '@/lib/jira/client';

interface JiraSyncPayload {
  type: 'pr_opened' | 'pr_merged' | 'pr_closed';
  organizationId: string;
  prId: string;
  jiraTicketId: string;
  pr: {
    title: string;
    url: string;
    repository: string;
    author: string;
    mergedAt?: string | null;
  };
}

/**
 * Background job to sync PR status with Jira
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

    const supabase = await createDynamicAdminClient();

    // Check if Jira is configured for this org
    const { data: integration } = await supabase
      .from('jira_integrations')
      .select('is_active')
      .eq('organization_id', organizationId)
      .single();

    if (!integration?.is_active) {
      console.log('Jira not active for org:', organizationId);
      return { success: false, reason: 'Jira not configured' };
    }

    // Verify the Jira issue exists
    const issue = await getJiraIssue(organizationId, jiraTicketId);
    
    if (!issue) {
      console.warn('Jira issue not found:', jiraTicketId);
      return { success: false, reason: 'Issue not found' };
    }

    switch (type) {
      case 'pr_opened': {
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
        if (!pr.mergedAt) {
          return { success: false, reason: 'Missing mergedAt' };
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

