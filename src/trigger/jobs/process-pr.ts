import { task } from '@trigger.dev/sdk/v3';
import { createAdminClient } from '@/lib/supabase/server';
import { findReviewers, type RoutingContext } from '@/lib/routing';
import { requestReviewers } from '@/lib/github/client';

interface ProcessPRPayload {
  organizationId: string;
  prId: string;
  installationId: number;
  context: RoutingContext & {
    githubPrNumber: number;
    htmlUrl: string;
    authorAvatarUrl: string;
  };
}

/**
 * Background job to process a new PR
 * - Finds matching reviewers using routing engine
 * - Creates review assignments
 * - Requests reviewers on GitHub
 * - Queues Slack notifications
 */
export const processPRTask = task({
  id: 'process-pr',
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 30000,
  },
  run: async (payload: ProcessPRPayload) => {
    const { organizationId, prId, installationId, context } = payload;

    console.log('Processing PR:', { prId, repository: context.repository });

    // Find reviewers using routing engine
    const result = await findReviewers(organizationId, context);

    if (result.reviewers.length === 0) {
      console.warn('No reviewers found for PR:', { prId });
      return { success: false, reason: 'No reviewers found' };
    }

    const supabase = await createAdminClient();

    // Create review assignments
    const assignments = result.reviewers.map((reviewer) => ({
      pull_request_id: prId,
      reviewer_id: reviewer.id,
      routing_rule_id: result.rule?.id || null,
      status: 'pending' as const,
      escalation_level: 'none' as const,
      assigned_at: new Date().toISOString(),
    }));

    const { data: savedAssignments, error: assignError } = await supabase
      .from('review_assignments')
      .insert(assignments)
      .select('id, reviewer_id');

    if (assignError) {
      console.error('Failed to create assignments:', assignError);
      throw assignError;
    }

    // Request reviewers on GitHub
    try {
      const [owner, repo] = context.repository.split('/');
      const githubUsernames = result.reviewers.map((r) => r.github_username);

      await requestReviewers(
        installationId,
        owner,
        repo,
        context.githubPrNumber,
        githubUsernames
      );
    } catch (error) {
      console.error('Failed to request GitHub reviewers:', error);
      // Don't fail the job - assignments are created
    }

    // Queue notifications for each reviewer
    const { sendNotificationTask } = await import('./send-notification');

    for (const assignment of savedAssignments || []) {
      const reviewer = result.reviewers.find((r) => r.id === assignment.reviewer_id);
      if (!reviewer) continue;

      await sendNotificationTask.trigger({
        type: 'new_pr',
        assignmentId: assignment.id,
        reviewerId: reviewer.id,
        organizationId,
        prDetails: {
          id: prId,
          title: context.title,
          author: context.author,
          authorAvatarUrl: context.authorAvatarUrl,
          repository: context.repository,
          filesChanged: context.filesChanged.length,
          additions: context.additions || 0,
          deletions: context.deletions || 0,
          htmlUrl: context.htmlUrl,
        },
        reviewer: {
          githubUsername: reviewer.github_username,
          slackUserId: reviewer.slack_user_id,
          email: reviewer.email,
        },
      });
    }

    return {
      success: true,
      rule: result.rule?.name || 'default',
      reviewerCount: result.reviewers.length,
      assignmentIds: savedAssignments?.map((a) => a.id) || [],
    };
  },
});

