/**
 * Analytics calculation utilities
 * Pure functions for calculating metrics
 */

/**
 * Calculate bottleneck frequency from review assignments
 * Identifies which reviewers are most often the last to review a PR
 */
export function calculateBottleneckFrequency(
  assignments: Array<{
    reviewer_id: string;
    assigned_at: string;
    reviewed_at: string | null;
    pull_request_id: string;
  }>
): Record<string, number> {
  const prAssignments = new Map<
    string,
    Array<{
      reviewer_id: string;
      assigned_at: string;
      reviewed_at: string | null;
    }>
  >();

  for (const assignment of assignments) {
    if (!assignment.reviewed_at) continue;
    const prId = assignment.pull_request_id;
    if (!prAssignments.has(prId)) {
      prAssignments.set(prId, []);
    }
    prAssignments.get(prId)!.push({
      reviewer_id: assignment.reviewer_id,
      assigned_at: assignment.assigned_at,
      reviewed_at: assignment.reviewed_at,
    });
  }

  const bottleneckCounts: Record<string, number> = {};
  for (const [_, reviews] of prAssignments.entries()) {
    if (reviews.length === 0) continue;
    let maxTime = 0;
    let bottleneckReviewer: string | null = null;
    for (const review of reviews) {
      const reviewTime =
        new Date(review.reviewed_at!).getTime() -
        new Date(review.assigned_at).getTime();
      if (reviewTime > maxTime) {
        maxTime = reviewTime;
        bottleneckReviewer = review.reviewer_id;
      }
    }
    if (bottleneckReviewer) {
      bottleneckCounts[bottleneckReviewer] =
        (bottleneckCounts[bottleneckReviewer] || 0) + 1;
    }
  }
  return bottleneckCounts;
}
