import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import type {
  TrendTimeRange,
  TrendKpiData,
  ReviewSpeedData,
  CycleTimeData,
  FirstResponseData,
  PrVolumeData,
  WorkloadBalanceData,
  PrSizeData,
  SlaComplianceData,
  ReworkRateData,
  ApprovalRateData,
  MergeTimeData,
  ReviewDepthData,
  TrendData,
} from '@/lib/schema/trend';

type TypedSupabaseClient = SupabaseClient<Database>;

// =============================================
// Helper Functions
// =============================================

function getDateRangeFromTimeRange(timeRange: TrendTimeRange): Date {
  const startDate = new Date();
  switch (timeRange) {
    case '6w':
      startDate.setDate(startDate.getDate() - 42);
      break;
    case '12w':
      startDate.setDate(startDate.getDate() - 84);
      break;
    case '6m':
      startDate.setMonth(startDate.getMonth() - 6);
      break;
  }
  return startDate;
}

function getWeeksFromTimeRange(timeRange: TrendTimeRange): number {
  switch (timeRange) {
    case '6w':
      return 6;
    case '12w':
      return 12;
    case '6m':
      return 26;
  }
}

function getWeekLabel(weekIndex: number): string {
  return `Week ${weekIndex + 1}`;
}

async function getOrgRepositoryIds(
  supabase: TypedSupabaseClient,
  organizationId: string
): Promise<string[]> {
  const { data: repos } = await supabase
    .from('repositories')
    .select('id')
    .eq('organization_id', organizationId);
  return repos?.map((r) => r.id) || [];
}

// =============================================
// Service Parameters
// =============================================

export interface TrendServiceParams {
  supabase: TypedSupabaseClient;
  organizationId: string;
  timeRange: TrendTimeRange;
}

// =============================================
// Fetch Functions
// =============================================

export async function fetchTrendKpis({
  supabase,
  organizationId,
  timeRange,
}: TrendServiceParams): Promise<TrendKpiData> {
  const startDate = getDateRangeFromTimeRange(timeRange);
  const numWeeks = getWeeksFromTimeRange(timeRange);
  const repoIds = await getOrgRepositoryIds(supabase, organizationId);

  const emptyKpis: TrendKpiData = {
    avgReviewSpeed: {
      current: 0,
      previous: 0,
      weekly: Array(numWeeks).fill(0),
    },
    slaCompliance: { current: 0, previous: 0, weekly: Array(numWeeks).fill(0) },
    cycleTime: { current: 0, previous: 0, weekly: Array(numWeeks).fill(0) },
    approvalRate: { current: 0, previous: 0, weekly: Array(numWeeks).fill(0) },
  };

  if (repoIds.length === 0) return emptyKpis;

  const { data: assignments } = await supabase
    .from('review_assignments')
    .select(
      `id, status, assigned_at, reviewed_at, pull_request:pull_requests!inner (id, repository_id, created_at, merged_at, status)`
    )
    .in('pull_request.repository_id', repoIds)
    .gte('assigned_at', startDate.toISOString());

  const { data: mergedPRs } = await supabase
    .from('pull_requests')
    .select('id, created_at, merged_at')
    .in('repository_id', repoIds)
    .eq('status', 'merged')
    .not('merged_at', 'is', null)
    .gte('merged_at', startDate.toISOString());

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const startTime = startDate.getTime();

  const weeklyReviewSpeed: number[] = Array(numWeeks).fill(0);
  const weeklyReviewCounts: number[] = Array(numWeeks).fill(0);
  const weeklySlaCount: number[] = Array(numWeeks).fill(0);
  const weeklyTotalReviews: number[] = Array(numWeeks).fill(0);
  const weeklyCycleTime: number[] = Array(numWeeks).fill(0);
  const weeklyCycleCounts: number[] = Array(numWeeks).fill(0);
  const weeklyApproved: number[] = Array(numWeeks).fill(0);
  const weeklyTotal: number[] = Array(numWeeks).fill(0);

  if (assignments) {
    for (const assignment of assignments) {
      const assignedAt = new Date(assignment.assigned_at);
      const weekIndex = Math.floor(
        (assignedAt.getTime() - startTime) / msPerWeek
      );

      if (weekIndex >= 0 && weekIndex < numWeeks) {
        weeklyTotal[weekIndex]++;
        if (assignment.status === 'approved') weeklyApproved[weekIndex]++;

        if (assignment.reviewed_at) {
          const reviewedAt = new Date(assignment.reviewed_at);
          const hoursToReview =
            (reviewedAt.getTime() - assignedAt.getTime()) / (1000 * 60 * 60);
          weeklyReviewSpeed[weekIndex] += hoursToReview;
          weeklyReviewCounts[weekIndex]++;
          weeklyTotalReviews[weekIndex]++;
          if (hoursToReview <= 4) weeklySlaCount[weekIndex]++;
        }
      }
    }
  }

  if (mergedPRs) {
    for (const pr of mergedPRs) {
      if (pr.merged_at && pr.created_at) {
        const mergedAt = new Date(pr.merged_at);
        const weekIndex = Math.floor(
          (mergedAt.getTime() - startTime) / msPerWeek
        );
        if (weekIndex >= 0 && weekIndex < numWeeks) {
          const createdAt = new Date(pr.created_at);
          const cycleHours =
            (mergedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
          weeklyCycleTime[weekIndex] += cycleHours;
          weeklyCycleCounts[weekIndex]++;
        }
      }
    }
  }

  const avgReviewSpeedWeekly = weeklyReviewSpeed.map((total, i) =>
    weeklyReviewCounts[i] > 0
      ? Math.round((total / weeklyReviewCounts[i]) * 10) / 10
      : 0
  );
  const slaComplianceWeekly = weeklySlaCount.map((count, i) =>
    weeklyTotalReviews[i] > 0
      ? Math.round((count / weeklyTotalReviews[i]) * 100)
      : 0
  );
  const cycleTimeWeekly = weeklyCycleTime.map((total, i) =>
    weeklyCycleCounts[i] > 0
      ? Math.round((total / weeklyCycleCounts[i]) * 10) / 10
      : 0
  );
  const approvalRateWeekly = weeklyApproved.map((approved, i) =>
    weeklyTotal[i] > 0 ? Math.round((approved / weeklyTotal[i]) * 100) : 0
  );

  const getAverage = (arr: number[]) => {
    const nonZero = arr.filter((v) => v > 0);
    return nonZero.length > 0
      ? nonZero.reduce((a, b) => a + b, 0) / nonZero.length
      : 0;
  };

  const halfPoint = Math.floor(numWeeks / 2);
  const currentHalf = (arr: number[]) => getAverage(arr.slice(halfPoint));
  const previousHalf = (arr: number[]) => getAverage(arr.slice(0, halfPoint));

  return {
    avgReviewSpeed: {
      current: Math.round(currentHalf(avgReviewSpeedWeekly) * 10) / 10,
      previous: Math.round(previousHalf(avgReviewSpeedWeekly) * 10) / 10,
      weekly: avgReviewSpeedWeekly,
    },
    slaCompliance: {
      current: Math.round(currentHalf(slaComplianceWeekly)),
      previous: Math.round(previousHalf(slaComplianceWeekly)),
      weekly: slaComplianceWeekly,
    },
    cycleTime: {
      current: Math.round(currentHalf(cycleTimeWeekly) * 10) / 10,
      previous: Math.round(previousHalf(cycleTimeWeekly) * 10) / 10,
      weekly: cycleTimeWeekly,
    },
    approvalRate: {
      current: Math.round(currentHalf(approvalRateWeekly)),
      previous: Math.round(previousHalf(approvalRateWeekly)),
      weekly: approvalRateWeekly,
    },
  };
}

export async function fetchReviewSpeedData({
  supabase,
  organizationId,
  timeRange,
}: TrendServiceParams): Promise<ReviewSpeedData[]> {
  const startDate = getDateRangeFromTimeRange(timeRange);
  const numWeeks = getWeeksFromTimeRange(timeRange);
  const repoIds = await getOrgRepositoryIds(supabase, organizationId);

  if (repoIds.length === 0) {
    return Array(numWeeks)
      .fill(null)
      .map((_, i) => ({ date: getWeekLabel(i), hours: 0 }));
  }

  const { data: assignments } = await supabase
    .from('review_assignments')
    .select(
      `id, assigned_at, reviewed_at, pull_request:pull_requests!inner (id, repository_id)`
    )
    .in('pull_request.repository_id', repoIds)
    .not('reviewed_at', 'is', null)
    .gte('assigned_at', startDate.toISOString());

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const startTime = startDate.getTime();
  const weeklyTotalHours: number[] = Array(numWeeks).fill(0);
  const weeklyCounts: number[] = Array(numWeeks).fill(0);

  if (assignments) {
    for (const assignment of assignments) {
      if (assignment.reviewed_at && assignment.assigned_at) {
        const assignedAt = new Date(assignment.assigned_at);
        const reviewedAt = new Date(assignment.reviewed_at);
        const weekIndex = Math.floor(
          (assignedAt.getTime() - startTime) / msPerWeek
        );
        if (weekIndex >= 0 && weekIndex < numWeeks) {
          const hoursToReview =
            (reviewedAt.getTime() - assignedAt.getTime()) / (1000 * 60 * 60);
          weeklyTotalHours[weekIndex] += hoursToReview;
          weeklyCounts[weekIndex]++;
        }
      }
    }
  }

  return Array(numWeeks)
    .fill(null)
    .map((_, i) => ({
      date: getWeekLabel(i),
      hours:
        weeklyCounts[i] > 0
          ? Math.round((weeklyTotalHours[i] / weeklyCounts[i]) * 10) / 10
          : 0,
    }));
}

export async function fetchCycleTimeData({
  supabase,
  organizationId,
  timeRange,
}: TrendServiceParams): Promise<CycleTimeData[]> {
  const startDate = getDateRangeFromTimeRange(timeRange);
  const numWeeks = getWeeksFromTimeRange(timeRange);
  const repoIds = await getOrgRepositoryIds(supabase, organizationId);

  if (repoIds.length === 0) {
    return Array(numWeeks)
      .fill(null)
      .map((_, i) => ({ week: getWeekLabel(i), hours: 0 }));
  }

  const { data: mergedPRs } = await supabase
    .from('pull_requests')
    .select('id, created_at, merged_at')
    .in('repository_id', repoIds)
    .eq('status', 'merged')
    .not('merged_at', 'is', null)
    .gte('merged_at', startDate.toISOString());

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const startTime = startDate.getTime();
  const weeklyTotalHours: number[] = Array(numWeeks).fill(0);
  const weeklyCounts: number[] = Array(numWeeks).fill(0);

  if (mergedPRs) {
    for (const pr of mergedPRs) {
      if (pr.merged_at && pr.created_at) {
        const mergedAt = new Date(pr.merged_at);
        const createdAt = new Date(pr.created_at);
        const weekIndex = Math.floor(
          (mergedAt.getTime() - startTime) / msPerWeek
        );
        if (weekIndex >= 0 && weekIndex < numWeeks) {
          const cycleHours =
            (mergedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
          weeklyTotalHours[weekIndex] += cycleHours;
          weeklyCounts[weekIndex]++;
        }
      }
    }
  }

  return Array(numWeeks)
    .fill(null)
    .map((_, i) => ({
      week: getWeekLabel(i),
      hours:
        weeklyCounts[i] > 0
          ? Math.round((weeklyTotalHours[i] / weeklyCounts[i]) * 10) / 10
          : 0,
    }));
}

export async function fetchFirstResponseData({
  supabase,
  organizationId,
  timeRange,
}: TrendServiceParams): Promise<FirstResponseData[]> {
  const startDate = getDateRangeFromTimeRange(timeRange);
  const numWeeks = getWeeksFromTimeRange(timeRange);
  const repoIds = await getOrgRepositoryIds(supabase, organizationId);

  if (repoIds.length === 0) {
    return Array(numWeeks)
      .fill(null)
      .map((_, i) => ({ week: getWeekLabel(i), minutes: 0 }));
  }

  const { data: assignments } = await supabase
    .from('review_assignments')
    .select(
      `id, assigned_at, reviewed_at, pull_request:pull_requests!inner (id, repository_id, created_at)`
    )
    .in('pull_request.repository_id', repoIds)
    .not('reviewed_at', 'is', null)
    .gte('assigned_at', startDate.toISOString());

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const startTime = startDate.getTime();
  const weeklyTotalMinutes: number[] = Array(numWeeks).fill(0);
  const weeklyCounts: number[] = Array(numWeeks).fill(0);

  if (assignments) {
    for (const assignment of assignments) {
      const pr = assignment.pull_request as any;
      if (pr?.created_at && assignment.reviewed_at) {
        const createdAt = new Date(pr.created_at);
        const reviewedAt = new Date(assignment.reviewed_at);
        const weekIndex = Math.floor(
          (createdAt.getTime() - startTime) / msPerWeek
        );
        if (weekIndex >= 0 && weekIndex < numWeeks) {
          const minutesToResponse =
            (reviewedAt.getTime() - createdAt.getTime()) / (1000 * 60);
          weeklyTotalMinutes[weekIndex] += minutesToResponse;
          weeklyCounts[weekIndex]++;
        }
      }
    }
  }

  return Array(numWeeks)
    .fill(null)
    .map((_, i) => ({
      week: getWeekLabel(i),
      minutes:
        weeklyCounts[i] > 0
          ? Math.round(weeklyTotalMinutes[i] / weeklyCounts[i])
          : 0,
    }));
}

export async function fetchPrVolumeData({
  supabase,
  organizationId,
  timeRange,
}: TrendServiceParams): Promise<PrVolumeData[]> {
  const startDate = getDateRangeFromTimeRange(timeRange);
  const numWeeks = getWeeksFromTimeRange(timeRange);
  const repoIds = await getOrgRepositoryIds(supabase, organizationId);

  if (repoIds.length === 0) {
    return Array(numWeeks)
      .fill(null)
      .map((_, i) => ({ date: getWeekLabel(i), count: 0 }));
  }

  const { data: prs } = await supabase
    .from('pull_requests')
    .select('id, created_at')
    .in('repository_id', repoIds)
    .gte('created_at', startDate.toISOString());

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const startTime = startDate.getTime();
  const weeklyCounts: number[] = Array(numWeeks).fill(0);

  if (prs) {
    for (const pr of prs) {
      const createdAt = new Date(pr.created_at);
      const weekIndex = Math.floor(
        (createdAt.getTime() - startTime) / msPerWeek
      );
      if (weekIndex >= 0 && weekIndex < numWeeks) {
        weeklyCounts[weekIndex]++;
      }
    }
  }

  return Array(numWeeks)
    .fill(null)
    .map((_, i) => ({ date: getWeekLabel(i), count: weeklyCounts[i] }));
}

export async function fetchWorkloadBalanceData({
  supabase,
  organizationId,
  timeRange,
}: TrendServiceParams): Promise<WorkloadBalanceData[]> {
  const startDate = getDateRangeFromTimeRange(timeRange);
  const numWeeks = getWeeksFromTimeRange(timeRange);
  const repoIds = await getOrgRepositoryIds(supabase, organizationId);

  if (repoIds.length === 0) {
    return Array(numWeeks)
      .fill(null)
      .map((_, i) => ({ week: getWeekLabel(i) }));
  }

  const { data: assignments } = await supabase
    .from('review_assignments')
    .select(
      `id, reviewer_id, assigned_at, reviewer:reviewers (user:users (github_username, full_name)), pull_request:pull_requests!inner (repository_id)`
    )
    .in('pull_request.repository_id', repoIds)
    .gte('assigned_at', startDate.toISOString());

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const startTime = startDate.getTime();
  const weeklyReviewerCounts: Map<number, Map<string, number>> = new Map();

  for (let i = 0; i < numWeeks; i++) {
    weeklyReviewerCounts.set(i, new Map());
  }

  if (assignments) {
    for (const assignment of assignments) {
      const assignedAt = new Date(assignment.assigned_at);
      const weekIndex = Math.floor(
        (assignedAt.getTime() - startTime) / msPerWeek
      );
      if (weekIndex >= 0 && weekIndex < numWeeks) {
        const reviewer = assignment.reviewer as any;
        const reviewerName =
          reviewer?.user?.github_username ||
          reviewer?.user?.full_name ||
          'Unknown';
        const weekMap = weeklyReviewerCounts.get(weekIndex)!;
        weekMap.set(reviewerName, (weekMap.get(reviewerName) || 0) + 1);
      }
    }
  }

  return Array(numWeeks)
    .fill(null)
    .map((_, i) => {
      const weekMap = weeklyReviewerCounts.get(i)!;
      const result: WorkloadBalanceData = { week: getWeekLabel(i) };
      weekMap.forEach((count, reviewer) => {
        result[reviewer] = count;
      });
      return result;
    });
}

export async function fetchPrSizeData({
  supabase,
  organizationId,
  timeRange,
}: TrendServiceParams): Promise<PrSizeData[]> {
  const startDate = getDateRangeFromTimeRange(timeRange);
  const numWeeks = getWeeksFromTimeRange(timeRange);
  const repoIds = await getOrgRepositoryIds(supabase, organizationId);

  if (repoIds.length === 0) {
    return Array(numWeeks)
      .fill(null)
      .map((_, i) => ({
        week: getWeekLabel(i),
        small: 0,
        medium: 0,
        large: 0,
      }));
  }

  const { data: prs } = await supabase
    .from('pull_requests')
    .select('id, created_at, additions, deletions')
    .in('repository_id', repoIds)
    .gte('created_at', startDate.toISOString());

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const startTime = startDate.getTime();
  const weeklySmall: number[] = Array(numWeeks).fill(0);
  const weeklyMedium: number[] = Array(numWeeks).fill(0);
  const weeklyLarge: number[] = Array(numWeeks).fill(0);

  if (prs) {
    for (const pr of prs) {
      const createdAt = new Date(pr.created_at);
      const weekIndex = Math.floor(
        (createdAt.getTime() - startTime) / msPerWeek
      );
      if (weekIndex >= 0 && weekIndex < numWeeks) {
        const size = (pr.additions || 0) + (pr.deletions || 0);
        if (size < 100) weeklySmall[weekIndex]++;
        else if (size <= 500) weeklyMedium[weekIndex]++;
        else weeklyLarge[weekIndex]++;
      }
    }
  }

  return Array(numWeeks)
    .fill(null)
    .map((_, i) => ({
      week: getWeekLabel(i),
      small: weeklySmall[i],
      medium: weeklyMedium[i],
      large: weeklyLarge[i],
    }));
}

export async function fetchSlaComplianceData({
  supabase,
  organizationId,
  timeRange,
}: TrendServiceParams): Promise<SlaComplianceData[]> {
  const startDate = getDateRangeFromTimeRange(timeRange);
  const numWeeks = getWeeksFromTimeRange(timeRange);
  const repoIds = await getOrgRepositoryIds(supabase, organizationId);

  if (repoIds.length === 0) {
    return Array(numWeeks)
      .fill(null)
      .map((_, i) => ({ date: getWeekLabel(i), percentage: 0 }));
  }

  const { data: assignments } = await supabase
    .from('review_assignments')
    .select(
      `id, assigned_at, reviewed_at, pull_request:pull_requests!inner (repository_id)`
    )
    .in('pull_request.repository_id', repoIds)
    .not('reviewed_at', 'is', null)
    .gte('assigned_at', startDate.toISOString());

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const startTime = startDate.getTime();
  const weeklySlaMet: number[] = Array(numWeeks).fill(0);
  const weeklyTotal: number[] = Array(numWeeks).fill(0);

  if (assignments) {
    for (const assignment of assignments) {
      if (assignment.reviewed_at && assignment.assigned_at) {
        const assignedAt = new Date(assignment.assigned_at);
        const reviewedAt = new Date(assignment.reviewed_at);
        const weekIndex = Math.floor(
          (assignedAt.getTime() - startTime) / msPerWeek
        );
        if (weekIndex >= 0 && weekIndex < numWeeks) {
          weeklyTotal[weekIndex]++;
          const hoursToReview =
            (reviewedAt.getTime() - assignedAt.getTime()) / (1000 * 60 * 60);
          if (hoursToReview <= 4) weeklySlaMet[weekIndex]++;
        }
      }
    }
  }

  return Array(numWeeks)
    .fill(null)
    .map((_, i) => ({
      date: getWeekLabel(i),
      percentage:
        weeklyTotal[i] > 0
          ? Math.round((weeklySlaMet[i] / weeklyTotal[i]) * 100)
          : 0,
    }));
}

export async function fetchReworkRateData({
  supabase,
  organizationId,
  timeRange,
}: TrendServiceParams): Promise<ReworkRateData[]> {
  const startDate = getDateRangeFromTimeRange(timeRange);
  const numWeeks = getWeeksFromTimeRange(timeRange);
  const repoIds = await getOrgRepositoryIds(supabase, organizationId);

  if (repoIds.length === 0) {
    return Array(numWeeks)
      .fill(null)
      .map((_, i) => ({ week: getWeekLabel(i), percentage: 0 }));
  }

  const { data: assignments } = await supabase
    .from('review_assignments')
    .select(
      `id, status, assigned_at, pull_request:pull_requests!inner (repository_id)`
    )
    .in('pull_request.repository_id', repoIds)
    .gte('assigned_at', startDate.toISOString());

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const startTime = startDate.getTime();
  const weeklyRework: number[] = Array(numWeeks).fill(0);
  const weeklyTotal: number[] = Array(numWeeks).fill(0);

  if (assignments) {
    for (const assignment of assignments) {
      const assignedAt = new Date(assignment.assigned_at);
      const weekIndex = Math.floor(
        (assignedAt.getTime() - startTime) / msPerWeek
      );
      if (weekIndex >= 0 && weekIndex < numWeeks) {
        weeklyTotal[weekIndex]++;
        if (assignment.status === 'changes_requested')
          weeklyRework[weekIndex]++;
      }
    }
  }

  return Array(numWeeks)
    .fill(null)
    .map((_, i) => ({
      week: getWeekLabel(i),
      percentage:
        weeklyTotal[i] > 0
          ? Math.round((weeklyRework[i] / weeklyTotal[i]) * 100)
          : 0,
    }));
}

export async function fetchApprovalRateData({
  supabase,
  organizationId,
  timeRange,
}: TrendServiceParams): Promise<ApprovalRateData[]> {
  const startDate = getDateRangeFromTimeRange(timeRange);
  const numWeeks = getWeeksFromTimeRange(timeRange);
  const repoIds = await getOrgRepositoryIds(supabase, organizationId);

  if (repoIds.length === 0) {
    return Array(numWeeks)
      .fill(null)
      .map((_, i) => ({ week: getWeekLabel(i), approved: 0, rejected: 0 }));
  }

  const { data: assignments } = await supabase
    .from('review_assignments')
    .select(
      `id, status, assigned_at, pull_request:pull_requests!inner (repository_id)`
    )
    .in('pull_request.repository_id', repoIds)
    .gte('assigned_at', startDate.toISOString());

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const startTime = startDate.getTime();
  const weeklyApproved: number[] = Array(numWeeks).fill(0);
  const weeklyRejected: number[] = Array(numWeeks).fill(0);

  if (assignments) {
    for (const assignment of assignments) {
      const assignedAt = new Date(assignment.assigned_at);
      const weekIndex = Math.floor(
        (assignedAt.getTime() - startTime) / msPerWeek
      );
      if (weekIndex >= 0 && weekIndex < numWeeks) {
        if (assignment.status === 'approved') weeklyApproved[weekIndex]++;
        else if (assignment.status === 'changes_requested')
          weeklyRejected[weekIndex]++;
      }
    }
  }

  return Array(numWeeks)
    .fill(null)
    .map((_, i) => ({
      week: getWeekLabel(i),
      approved: weeklyApproved[i],
      rejected: weeklyRejected[i],
    }));
}

export async function fetchMergeTimeData({
  supabase,
  organizationId,
  timeRange,
}: TrendServiceParams): Promise<MergeTimeData[]> {
  const startDate = getDateRangeFromTimeRange(timeRange);
  const numWeeks = getWeeksFromTimeRange(timeRange);
  const repoIds = await getOrgRepositoryIds(supabase, organizationId);

  if (repoIds.length === 0) {
    return Array(numWeeks)
      .fill(null)
      .map((_, i) => ({ week: getWeekLabel(i), hours: 0 }));
  }

  // Get merged PRs with their last approval time
  const { data: mergedPRs } = await supabase
    .from('pull_requests')
    .select('id, merged_at')
    .in('repository_id', repoIds)
    .eq('status', 'merged')
    .not('merged_at', 'is', null)
    .gte('merged_at', startDate.toISOString());

  if (!mergedPRs || mergedPRs.length === 0) {
    return Array(numWeeks)
      .fill(null)
      .map((_, i) => ({ week: getWeekLabel(i), hours: 0 }));
  }

  // Get approved assignments for these PRs
  const prIds = mergedPRs.map((pr) => pr.id);
  const { data: approvals } = await supabase
    .from('review_assignments')
    .select('pull_request_id, reviewed_at')
    .in('pull_request_id', prIds)
    .eq('status', 'approved')
    .not('reviewed_at', 'is', null);

  // Build a map of PR to last approval time
  const prLastApproval = new Map<string, Date>();
  if (approvals) {
    for (const approval of approvals) {
      const reviewedAt = new Date(approval.reviewed_at!);
      const existing = prLastApproval.get(approval.pull_request_id);
      if (!existing || reviewedAt > existing) {
        prLastApproval.set(approval.pull_request_id, reviewedAt);
      }
    }
  }

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const startTime = startDate.getTime();
  const weeklyTotalHours: number[] = Array(numWeeks).fill(0);
  const weeklyCounts: number[] = Array(numWeeks).fill(0);

  for (const pr of mergedPRs) {
    const lastApproval = prLastApproval.get(pr.id);
    if (lastApproval && pr.merged_at) {
      const mergedAt = new Date(pr.merged_at);
      const weekIndex = Math.floor(
        (mergedAt.getTime() - startTime) / msPerWeek
      );
      if (weekIndex >= 0 && weekIndex < numWeeks) {
        const hoursToMerge =
          (mergedAt.getTime() - lastApproval.getTime()) / (1000 * 60 * 60);
        if (hoursToMerge >= 0) {
          weeklyTotalHours[weekIndex] += hoursToMerge;
          weeklyCounts[weekIndex]++;
        }
      }
    }
  }

  return Array(numWeeks)
    .fill(null)
    .map((_, i) => ({
      week: getWeekLabel(i),
      hours:
        weeklyCounts[i] > 0
          ? Math.round((weeklyTotalHours[i] / weeklyCounts[i]) * 10) / 10
          : 0,
    }));
}

export async function fetchReviewDepthData({
  supabase,
  organizationId,
  timeRange,
}: TrendServiceParams): Promise<ReviewDepthData[]> {
  const startDate = getDateRangeFromTimeRange(timeRange);
  const numWeeks = getWeeksFromTimeRange(timeRange);
  const repoIds = await getOrgRepositoryIds(supabase, organizationId);

  if (repoIds.length === 0) {
    return Array(numWeeks)
      .fill(null)
      .map((_, i) => ({ week: getWeekLabel(i), linesPerPr: 0 }));
  }

  // Get PRs that have been reviewed
  const { data: assignments } = await supabase
    .from('review_assignments')
    .select(
      `id, reviewed_at, pull_request:pull_requests!inner (id, repository_id, additions, deletions)`
    )
    .in('pull_request.repository_id', repoIds)
    .not('reviewed_at', 'is', null)
    .gte('reviewed_at', startDate.toISOString());

  if (!assignments || assignments.length === 0) {
    return Array(numWeeks)
      .fill(null)
      .map((_, i) => ({ week: getWeekLabel(i), linesPerPr: 0 }));
  }

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const startTime = startDate.getTime();
  const weeklyTotalLines: number[] = Array(numWeeks).fill(0);
  const weeklyCounts: number[] = Array(numWeeks).fill(0);
  const seenPRs = new Map<number, Set<string>>(); // Track unique PRs per week

  for (let i = 0; i < numWeeks; i++) {
    seenPRs.set(i, new Set());
  }

  for (const assignment of assignments) {
    if (assignment.reviewed_at) {
      const reviewedAt = new Date(assignment.reviewed_at);
      const weekIndex = Math.floor(
        (reviewedAt.getTime() - startTime) / msPerWeek
      );
      if (weekIndex >= 0 && weekIndex < numWeeks) {
        const pr = assignment.pull_request as any;
        const prId = pr.id;
        const weekSet = seenPRs.get(weekIndex)!;

        // Only count each PR once per week
        if (!weekSet.has(prId)) {
          weekSet.add(prId);
          const lines = (pr.additions || 0) + (pr.deletions || 0);
          weeklyTotalLines[weekIndex] += lines;
          weeklyCounts[weekIndex]++;
        }
      }
    }
  }

  return Array(numWeeks)
    .fill(null)
    .map((_, i) => ({
      week: getWeekLabel(i),
      linesPerPr:
        weeklyCounts[i] > 0
          ? Math.round(weeklyTotalLines[i] / weeklyCounts[i])
          : 0,
    }));
}

// =============================================
// Main Fetch Function
// =============================================

export async function fetchTrendData(
  params: TrendServiceParams
): Promise<TrendData> {
  const [
    kpis,
    reviewSpeed,
    cycleTime,
    firstResponse,
    prVolume,
    workloadBalance,
    prSize,
    slaCompliance,
    reworkRate,
    approvalRate,
    mergeTime,
    reviewDepth,
  ] = await Promise.all([
    fetchTrendKpis(params),
    fetchReviewSpeedData(params),
    fetchCycleTimeData(params),
    fetchFirstResponseData(params),
    fetchPrVolumeData(params),
    fetchWorkloadBalanceData(params),
    fetchPrSizeData(params),
    fetchSlaComplianceData(params),
    fetchReworkRateData(params),
    fetchApprovalRateData(params),
    fetchMergeTimeData(params),
    fetchReviewDepthData(params),
  ]);

  return {
    kpis,
    reviewSpeed,
    cycleTime,
    firstResponse,
    prVolume,
    workloadBalance,
    prSize,
    slaCompliance,
    reworkRate,
    approvalRate,
    mergeTime,
    reviewDepth,
  };
}
