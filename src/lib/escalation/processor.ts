import type { SupabaseClient } from '@supabase/supabase-js';

// biome-ignore lint: Using any for flexibility with typed/untyped clients
type AnySupabaseClient = SupabaseClient<any>;
import { sendReviewReminder, sendEscalationAlert } from '@/lib/slack';

/**
 * Escalation thresholds in hours
 */
export const ESCALATION_THRESHOLDS = {
  REMINDER_24H: 24,
  ALERT_48H: 48,
};

/**
 * Review assignment with PR and reviewer details
 */
interface PendingAssignment {
  id: string;
  reviewer_id: string;
  assigned_at: string;
  reminder_sent_at: string | null;
  pull_request: {
    id: string;
    title: string;
    github_pr_number: number;
    html_url: string;
    status: string;
    repository: {
      id: string;
      full_name: string;
      organization_id: string;
    };
  };
}

/**
 * Process escalations for all pending review assignments
 */
export async function processEscalations(
  supabase: AnySupabaseClient
): Promise<{
  processed: number;
  reminders_sent: number;
  escalations_sent: number;
  errors: number;
}> {
  const stats = {
    processed: 0,
    reminders_sent: 0,
    escalations_sent: 0,
    errors: 0,
  };

  try {
    // Fetch all pending assignments for open PRs
    const { data: assignments, error } = await supabase
      .from('review_assignments')
      .select(
        `
        id,
        reviewer_id,
        assigned_at,
        reminder_sent_at,
        pull_request:pull_requests!inner (
          id,
          title,
          github_pr_number,
          html_url,
          status,
          repository:repositories!inner (
            id,
            full_name,
            organization_id
          )
        )
      `
      )
      .eq('status', 'pending')
      .eq('pull_requests.status', 'open');

    if (error) {
      console.error('Failed to fetch pending assignments:', error);
      return stats;
    }

    if (!assignments || assignments.length === 0) {
      console.log('No pending assignments to process');
      return stats;
    }

    const now = new Date();

    for (const assignment of assignments) {
      stats.processed++;

      try {
        // Type assertion for the nested structure
        const typedAssignment = assignment as unknown as PendingAssignment;
        const pr = typedAssignment.pull_request;
        const repo = pr.repository;

        const assignedAt = new Date(typedAssignment.assigned_at);
        const hoursPending = (now.getTime() - assignedAt.getTime()) / (1000 * 60 * 60);

        // Check if needs 48h escalation
        if (hoursPending >= ESCALATION_THRESHOLDS.ALERT_48H) {
          // Check if already escalated at 48h level
          const { data: existingEscalation } = await supabase
            .from('escalations')
            .select('id')
            .eq('review_assignment_id', typedAssignment.id)
            .eq('level', 'alert_48h')
            .single();

          if (!existingEscalation) {
            const sent = await sendEscalationAlert(
              supabase,
              repo.organization_id,
              {
                id: typedAssignment.id,
                reviewer_id: typedAssignment.reviewer_id,
                pull_request: {
                  id: pr.id,
                  title: pr.title,
                  github_pr_number: pr.github_pr_number,
                  html_url: pr.html_url,
                  repository: {
                    full_name: repo.full_name,
                  },
                },
              },
              hoursPending
            );

            if (sent) {
              stats.escalations_sent++;
            }
          }
        }
        // Check if needs 24h reminder
        else if (
          hoursPending >= ESCALATION_THRESHOLDS.REMINDER_24H &&
          !typedAssignment.reminder_sent_at
        ) {
          const sent = await sendReviewReminder(
            supabase,
            repo.organization_id,
            {
              id: typedAssignment.id,
              reviewer_id: typedAssignment.reviewer_id,
              pull_request: {
                title: pr.title,
                github_pr_number: pr.github_pr_number,
                html_url: pr.html_url,
                repository: {
                  full_name: repo.full_name,
                },
              },
            },
            hoursPending
          );

          if (sent) {
            stats.reminders_sent++;

            // Record the reminder escalation
            await supabase.from('escalations').insert({
              review_assignment_id: typedAssignment.id,
              level: 'reminder_24h',
            });
          }
        }
      } catch (err) {
        console.error(`Error processing assignment ${assignment.id}:`, err);
        stats.errors++;
      }
    }

    return stats;
  } catch (error) {
    console.error('Escalation processing error:', error);
    stats.errors++;
    return stats;
  }
}

/**
 * Get summary of pending escalations
 */
export async function getEscalationSummary(
  supabase: AnySupabaseClient,
  organizationId: string
): Promise<{
  pending_reviews: number;
  overdue_24h: number;
  overdue_48h: number;
  assignments: Array<{
    id: string;
    hours_pending: number;
    reviewer_name: string;
    pr_title: string;
    pr_number: number;
    repo_name: string;
  }>;
}> {
  const now = new Date();

  const { data: assignments, error } = await supabase
    .from('review_assignments')
    .select(
      `
      id,
      assigned_at,
      reviewer:reviewers!inner (
        name,
        organization_id
      ),
      pull_request:pull_requests!inner (
        title,
        github_pr_number,
        status,
        repository:repositories!inner (
          full_name,
          organization_id
        )
      )
    `
    )
    .eq('status', 'pending')
    .eq('pull_requests.status', 'open')
    .eq('reviewers.organization_id', organizationId);

  if (error || !assignments) {
    console.error('Failed to get escalation summary:', error);
    return {
      pending_reviews: 0,
      overdue_24h: 0,
      overdue_48h: 0,
      assignments: [],
    };
  }

  let overdue24h = 0;
  let overdue48h = 0;

  const mappedAssignments = assignments.map((a: any) => {
    const assignedAt = new Date(a.assigned_at);
    const hoursPending = (now.getTime() - assignedAt.getTime()) / (1000 * 60 * 60);

    if (hoursPending >= ESCALATION_THRESHOLDS.ALERT_48H) {
      overdue48h++;
    } else if (hoursPending >= ESCALATION_THRESHOLDS.REMINDER_24H) {
      overdue24h++;
    }

    return {
      id: a.id,
      hours_pending: Math.round(hoursPending),
      reviewer_name: a.reviewer.name,
      pr_title: a.pull_request.title,
      pr_number: a.pull_request.github_pr_number,
      repo_name: a.pull_request.repository.full_name,
    };
  });

  return {
    pending_reviews: assignments.length,
    overdue_24h: overdue24h,
    overdue_48h: overdue48h,
    assignments: mappedAssignments.sort(
      (a, b) => b.hours_pending - a.hours_pending
    ),
  };
}

