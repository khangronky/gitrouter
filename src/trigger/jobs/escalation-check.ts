import { schedules } from '@trigger.dev/sdk/v3';
import { createDynamicAdminClient } from '@/lib/supabase/server';

const REMINDER_THRESHOLD_HOURS = 24;
const ESCALATION_THRESHOLD_HOURS = 48;

/**
 * Scheduled job to check for stale PR reviews and send escalations
 * Runs every hour to find:
 * - PRs waiting 24+ hours: Send reminder to reviewer
 * - PRs waiting 48+ hours: Alert team lead
 */
export const escalationCheckTask = schedules.task({
  id: 'escalation-check',
  // Run every hour
  cron: '0 * * * *',
  run: async () => {
    console.log('Running escalation check...');

    const supabase = await createDynamicAdminClient();
    const now = new Date();

    // Find assignments needing reminder (24h+, not yet reminded)
    const reminderThreshold = new Date(now.getTime() - REMINDER_THRESHOLD_HOURS * 60 * 60 * 1000);
    
    const { data: needsReminder, error: reminderError } = await supabase
      .from('review_assignments')
      .select(`
        id,
        reviewer_id,
        pull_request_id,
        assigned_at,
        pull_requests!inner (
          id,
          organization_id,
          title,
          author,
          author_avatar_url,
          repository,
          files_changed,
          additions,
          deletions,
          html_url,
          status
        ),
        reviewers!inner (
          id,
          github_username,
          slack_user_id,
          email,
          is_team_lead
        )
      `)
      .eq('status', 'pending')
      .eq('escalation_level', 'none')
      .is('reminded_at', null)
      .lt('assigned_at', reminderThreshold.toISOString());

    if (reminderError) {
      console.error('Error fetching assignments for reminder:', reminderError);
    } else if (needsReminder && needsReminder.length > 0) {
      console.log(`Found ${needsReminder.length} assignments needing reminder`);

      const { sendNotificationTask } = await import('./send-notification');

      for (const assignment of needsReminder) {
        const pr = assignment.pull_requests as any;
        const reviewer = assignment.reviewers as any;

        // Skip if PR is no longer open
        if (pr.status !== 'open') continue;

        // Update escalation level
        await supabase
          .from('review_assignments')
          .update({ escalation_level: 'reminded' })
          .eq('id', assignment.id);

        // Send reminder notification
        await sendNotificationTask.trigger({
          type: 'reminder',
          assignmentId: assignment.id,
          reviewerId: reviewer.id,
          organizationId: pr.organization_id,
          prDetails: {
            id: pr.id,
            title: pr.title,
            author: pr.author,
            authorAvatarUrl: pr.author_avatar_url,
            repository: pr.repository,
            filesChanged: Array.isArray(pr.files_changed) ? pr.files_changed.length : 0,
            additions: pr.additions,
            deletions: pr.deletions,
            htmlUrl: pr.html_url,
          },
          reviewer: {
            githubUsername: reviewer.github_username,
            slackUserId: reviewer.slack_user_id,
            email: reviewer.email,
          },
        });
      }
    }

    // Find assignments needing escalation (48h+, only reminded level)
    const escalationThreshold = new Date(now.getTime() - ESCALATION_THRESHOLD_HOURS * 60 * 60 * 1000);
    
    const { data: needsEscalation, error: escalationError } = await supabase
      .from('review_assignments')
      .select(`
        id,
        reviewer_id,
        pull_request_id,
        assigned_at,
        pull_requests!inner (
          id,
          organization_id,
          title,
          author,
          author_avatar_url,
          repository,
          files_changed,
          additions,
          deletions,
          html_url,
          status
        ),
        reviewers!inner (
          id,
          github_username,
          slack_user_id,
          email
        )
      `)
      .eq('status', 'pending')
      .eq('escalation_level', 'reminded')
      .is('escalated_at', null)
      .lt('assigned_at', escalationThreshold.toISOString());

    if (escalationError) {
      console.error('Error fetching assignments for escalation:', escalationError);
    } else if (needsEscalation && needsEscalation.length > 0) {
      console.log(`Found ${needsEscalation.length} assignments needing escalation`);

      for (const assignment of needsEscalation) {
        const pr = assignment.pull_requests as any;
        const reviewer = assignment.reviewers as any;

        // Skip if PR is no longer open
        if (pr.status !== 'open') continue;

        // Find team lead for this org
        const { data: teamLead } = await supabase
          .from('reviewers')
          .select('id, github_username, slack_user_id, email')
          .eq('organization_id', pr.organization_id)
          .eq('is_team_lead', true)
          .eq('is_active', true)
          .limit(1)
          .single();

        // Update escalation level
        await supabase
          .from('review_assignments')
          .update({ escalation_level: 'escalated' })
          .eq('id', assignment.id);

        // Send escalation to team lead
        if (teamLead) {
          const { sendNotificationTask } = await import('./send-notification');

          await sendNotificationTask.trigger({
            type: 'escalation',
            assignmentId: assignment.id,
            reviewerId: teamLead.id,
            organizationId: pr.organization_id,
            prDetails: {
              id: pr.id,
              title: pr.title,
              author: pr.author,
              authorAvatarUrl: pr.author_avatar_url,
              repository: pr.repository,
              filesChanged: Array.isArray(pr.files_changed) ? pr.files_changed.length : 0,
              additions: pr.additions,
              deletions: pr.deletions,
              htmlUrl: pr.html_url,
            },
            reviewer: {
              githubUsername: reviewer.github_username,
              slackUserId: teamLead.slack_user_id,
              email: teamLead.email,
            },
          });
        } else {
          console.warn('No team lead configured for escalation:', { orgId: pr.organization_id });
        }
      }
    }

    const totalProcessed = (needsReminder?.length || 0) + (needsEscalation?.length || 0);
    console.log(`Escalation check complete. Processed ${totalProcessed} assignments.`);

    return {
      reminders: needsReminder?.length || 0,
      escalations: needsEscalation?.length || 0,
    };
  },
});

