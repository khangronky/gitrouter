import { createClient } from '@/lib/supabase/client';

export type PerformanceTimeRange = '7d' | '30d' | '3m';

export interface PerformanceChartProps {
  timeRange: PerformanceTimeRange;
  organizationId: string;
}

/**
 * Convert time range to start date
 */
export function getDateRangeFromTimeRange(
  timeRange: PerformanceTimeRange
): Date {
  const startDate = new Date();

  switch (timeRange) {
    case '7d':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(startDate.getDate() - 30);
      break;
    case '3m':
      startDate.setMonth(startDate.getMonth() - 3);
      break;
  }

  return startDate;
}

/**
 * Get number of days based on time range
 */
export function getTimeRangeInDays(timeRange: PerformanceTimeRange): number {
  switch (timeRange) {
    case '7d':
      return 7;
    case '30d':
      return 30;
    case '3m':
      return 90; // ~3 months
  }
}

/**
 * Get previous period date range for delta calculations
 */
export function getPreviousPeriodRange(timeRange: PerformanceTimeRange): {
  startDate: Date;
  endDate: Date;
} {
  const currentStart = getDateRangeFromTimeRange(timeRange);
  const currentEnd = new Date();
  const periodLength = currentEnd.getTime() - currentStart.getTime();

  const endDate = new Date(currentStart);
  const startDate = new Date(currentStart.getTime() - periodLength);

  return { startDate, endDate };
}

/**
 * Verify user has access to organization
 */
export async function verifyOrgAccess(organizationId: string): Promise<string> {
  const supabase = createClient();

  // Auth check
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Unauthorized');

  // Verify org membership
  const { data: membership, error: membershipError } = await supabase
    .from('organization_members')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .single();

  if (membershipError || !membership) {
    throw new Error('No access to organization');
  }

  return user.id;
}

/**
 * Get repository IDs for an organization
 */
export async function getOrgRepositoryIds(
  organizationId: string
): Promise<string[]> {
  const supabase = createClient();

  const { data: repos } = await supabase
    .from('repositories')
    .select('id')
    .eq('organization_id', organizationId);

  return repos?.map((r) => r.id) || [];
}

/**
 * Helper to calculate bottleneck frequency
 * Returns a map of reviewer_id -> count of times they were the bottleneck
 */
export function calculateBottleneckFrequency(
  assignments: Array<{
    reviewer_id: string;
    assigned_at: string;
    reviewed_at: string | null;
    pull_request_id: string;
  }>
): Record<string, number> {
  // Group assignments by PR
  const prAssignments = new Map<
    string,
    Array<{
      reviewer_id: string;
      assigned_at: string;
      reviewed_at: string | null;
    }>
  >();

  for (const assignment of assignments) {
    if (!assignment.reviewed_at) continue; // Skip pending reviews

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

  // For each PR, find the reviewer with longest review time
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
