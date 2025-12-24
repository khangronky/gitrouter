import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import type {
  PerformanceTimeRange,
  PerformanceKpiData,
  ReviewerPerformance,
  BottleneckData,
  RepoComparisonData,
  MergeSuccessData,
  PrSizeByAuthorData,
  ReviewThroughputData,
  WorkloadDistributionData,
  TimeToFirstReviewData,
  PerformanceData,
} from '@/lib/schema/performance';

type TypedSupabaseClient = SupabaseClient<Database>;

// =============================================
// Helper Functions
// =============================================

function getDateRangeFromTimeRange(timeRange: PerformanceTimeRange): Date {
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

function getTimeRangeInDays(timeRange: PerformanceTimeRange): number {
  switch (timeRange) {
    case '7d':
      return 7;
    case '30d':
      return 30;
    case '3m':
      return 90;
  }
}

function getPreviousPeriodRange(timeRange: PerformanceTimeRange): {
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

function calculateBottleneckFrequency(
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

// =============================================
// Service Parameters
// =============================================

export interface PerformanceServiceParams {
  supabase: TypedSupabaseClient;
  organizationId: string;
  timeRange: PerformanceTimeRange;
}

// =============================================
// Fetch Functions
// =============================================

export async function fetchPerformanceKpis({
  supabase,
  organizationId,
  timeRange,
}: PerformanceServiceParams): Promise<PerformanceKpiData> {
  const startDate = getDateRangeFromTimeRange(timeRange);
  const previousPeriod = getPreviousPeriodRange(timeRange);
  const repoIds = await getOrgRepositoryIds(supabase, organizationId);

  const emptyKpis: PerformanceKpiData = {
    topReviewer: {
      name: 'N/A',
      avgTime: 0,
      current: 0,
      previous: 0,
      sparkline: Array(6).fill(0),
    },
    teamAvgTime: { current: 0, previous: 0, sparkline: Array(6).fill(0) },
    slaCompliance: { current: 0, previous: 0, sparkline: Array(6).fill(0) },
    totalReviews: { current: 0, previous: 0, sparkline: Array(6).fill(0) },
  };

  if (repoIds.length === 0) return emptyKpis;

  const { data: currentAssignments } = await supabase
    .from('review_assignments')
    .select(
      `id, reviewer_id, assigned_at, reviewed_at, pull_request:pull_requests!inner (repository_id)`
    )
    .in('pull_request.repository_id', repoIds)
    .gte('assigned_at', startDate.toISOString())
    .not('reviewed_at', 'is', null);

  const { data: previousAssignments } = await supabase
    .from('review_assignments')
    .select(
      `id, reviewer_id, assigned_at, reviewed_at, pull_request:pull_requests!inner (repository_id)`
    )
    .in('pull_request.repository_id', repoIds)
    .gte('assigned_at', previousPeriod.startDate.toISOString())
    .lt('assigned_at', previousPeriod.endDate.toISOString())
    .not('reviewed_at', 'is', null);

  const current = currentAssignments || [];
  const previous = previousAssignments || [];

  // Calculate sparkline data
  const daysInRange = getTimeRangeInDays(timeRange);
  const periodLength = daysInRange / 6;
  const sparklineData: number[][] = [[], [], [], []];

  for (let i = 0; i < 6; i++) {
    const periodStart = new Date(startDate);
    periodStart.setDate(periodStart.getDate() + i * periodLength);
    const periodEnd = new Date(periodStart);
    periodEnd.setDate(periodEnd.getDate() + periodLength);

    const periodAssignments = current.filter(
      (a) =>
        a.assigned_at >= periodStart.toISOString() &&
        a.assigned_at < periodEnd.toISOString()
    );

    const reviewerCounts: Record<string, number> = {};
    periodAssignments.forEach((a) => {
      reviewerCounts[a.reviewer_id] = (reviewerCounts[a.reviewer_id] || 0) + 1;
    });
    const topReviewerId = Object.entries(reviewerCounts).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0];
    sparklineData[0].push(reviewerCounts[topReviewerId || ''] || 0);

    const totalTime = periodAssignments.reduce((sum, a) => {
      if (a.reviewed_at) {
        return (
          sum +
          (new Date(a.reviewed_at).getTime() -
            new Date(a.assigned_at).getTime()) /
            3600000
        );
      }
      return sum;
    }, 0);
    sparklineData[1].push(
      periodAssignments.length > 0 ? totalTime / periodAssignments.length : 0
    );

    const slaMet = periodAssignments.filter((a) => {
      if (!a.reviewed_at) return false;
      const hours =
        (new Date(a.reviewed_at).getTime() -
          new Date(a.assigned_at).getTime()) /
        3600000;
      return hours <= 4;
    }).length;
    sparklineData[2].push(
      periodAssignments.length > 0
        ? (slaMet / periodAssignments.length) * 100
        : 0
    );
    sparklineData[3].push(periodAssignments.length);
  }

  // Calculate current period metrics
  const reviewerCounts: Record<string, { count: number; totalTime: number }> =
    {};
  current.forEach((a) => {
    if (!a.reviewed_at) return;
    if (!reviewerCounts[a.reviewer_id]) {
      reviewerCounts[a.reviewer_id] = { count: 0, totalTime: 0 };
    }
    reviewerCounts[a.reviewer_id].count++;
    reviewerCounts[a.reviewer_id].totalTime +=
      (new Date(a.reviewed_at!).getTime() - new Date(a.assigned_at).getTime()) /
      3600000;
  });

  const topReviewerEntry = Object.entries(reviewerCounts).sort(
    (a, b) => b[1].count - a[1].count
  )[0];

  let topReviewerName = 'N/A';
  if (topReviewerEntry) {
    const { data: reviewer } = await supabase
      .from('reviewers')
      .select(`user:users (github_username, full_name)`)
      .eq('id', topReviewerEntry[0])
      .single();
    if (reviewer?.user) {
      topReviewerName =
        (reviewer.user as any).github_username ||
        (reviewer.user as any).full_name ||
        'N/A';
    }
  }

  const topReviewerAvgTime =
    topReviewerEntry && topReviewerEntry[1].count > 0
      ? topReviewerEntry[1].totalTime / topReviewerEntry[1].count
      : 0;

  const teamTotalTime = current.reduce((sum, a) => {
    if (a.reviewed_at) {
      return (
        sum +
        (new Date(a.reviewed_at).getTime() -
          new Date(a.assigned_at).getTime()) /
          3600000
      );
    }
    return sum;
  }, 0);
  const teamAvgTime = current.length > 0 ? teamTotalTime / current.length : 0;

  const slaMet = current.filter((a) => {
    if (!a.reviewed_at) return false;
    const hours =
      (new Date(a.reviewed_at).getTime() - new Date(a.assigned_at).getTime()) /
      3600000;
    return hours <= 4;
  }).length;
  const slaCompliance =
    current.length > 0 ? (slaMet / current.length) * 100 : 0;

  const prevTeamTotalTime = previous.reduce((sum, a) => {
    if (a.reviewed_at) {
      return (
        sum +
        (new Date(a.reviewed_at).getTime() -
          new Date(a.assigned_at).getTime()) /
          3600000
      );
    }
    return sum;
  }, 0);
  const prevTeamAvgTime =
    previous.length > 0 ? prevTeamTotalTime / previous.length : 0;

  const prevSlaMet = previous.filter((a) => {
    if (!a.reviewed_at) return false;
    const hours =
      (new Date(a.reviewed_at).getTime() - new Date(a.assigned_at).getTime()) /
      3600000;
    return hours <= 4;
  }).length;
  const prevSlaCompliance =
    previous.length > 0 ? (prevSlaMet / previous.length) * 100 : 0;

  const prevReviewerCounts: Record<string, number> = {};
  previous.forEach((a) => {
    prevReviewerCounts[a.reviewer_id] =
      (prevReviewerCounts[a.reviewer_id] || 0) + 1;
  });
  const prevTopReviewerCount = Math.max(
    ...Object.values(prevReviewerCounts),
    0
  );

  return {
    topReviewer: {
      name: topReviewerName.startsWith('@')
        ? topReviewerName
        : `@${topReviewerName}`,
      avgTime: topReviewerAvgTime,
      current: topReviewerEntry?.[1].count || 0,
      previous: prevTopReviewerCount,
      sparkline: sparklineData[0],
    },
    teamAvgTime: {
      current: teamAvgTime,
      previous: prevTeamAvgTime,
      sparkline: sparklineData[1],
    },
    slaCompliance: {
      current: slaCompliance,
      previous: prevSlaCompliance,
      sparkline: sparklineData[2],
    },
    totalReviews: {
      current: current.length,
      previous: previous.length,
      sparkline: sparklineData[3],
    },
  };
}

export async function fetchReviewerPerformance({
  supabase,
  organizationId,
  timeRange,
}: PerformanceServiceParams): Promise<ReviewerPerformance[]> {
  const startDate = getDateRangeFromTimeRange(timeRange);
  const previousPeriod = getPreviousPeriodRange(timeRange);
  const repoIds = await getOrgRepositoryIds(supabase, organizationId);

  if (repoIds.length === 0) return [];

  const { data: currentAssignments } = await supabase
    .from('review_assignments')
    .select(
      `id, reviewer_id, assigned_at, reviewed_at, pull_request:pull_requests!inner (repository_id)`
    )
    .in('pull_request.repository_id', repoIds)
    .gte('assigned_at', startDate.toISOString())
    .not('reviewed_at', 'is', null);

  const { data: previousAssignments } = await supabase
    .from('review_assignments')
    .select(
      `id, reviewer_id, assigned_at, reviewed_at, pull_request:pull_requests!inner (repository_id)`
    )
    .in('pull_request.repository_id', repoIds)
    .gte('assigned_at', previousPeriod.startDate.toISOString())
    .lt('assigned_at', previousPeriod.endDate.toISOString())
    .not('reviewed_at', 'is', null);

  const current = currentAssignments || [];
  const previous = previousAssignments || [];

  const reviewerStats: Record<
    string,
    {
      reviewerId: string;
      reviews: Array<{ assigned_at: string; reviewed_at: string }>;
      prevReviews: Array<{ assigned_at: string; reviewed_at: string }>;
    }
  > = {};

  current.forEach((a) => {
    if (!a.reviewed_at) return;
    if (!reviewerStats[a.reviewer_id]) {
      reviewerStats[a.reviewer_id] = {
        reviewerId: a.reviewer_id,
        reviews: [],
        prevReviews: [],
      };
    }
    reviewerStats[a.reviewer_id].reviews.push({
      assigned_at: a.assigned_at,
      reviewed_at: a.reviewed_at,
    });
  });

  previous.forEach((a) => {
    if (!a.reviewed_at) return;
    if (!reviewerStats[a.reviewer_id]) {
      reviewerStats[a.reviewer_id] = {
        reviewerId: a.reviewer_id,
        reviews: [],
        prevReviews: [],
      };
    }
    reviewerStats[a.reviewer_id].prevReviews.push({
      assigned_at: a.assigned_at,
      reviewed_at: a.reviewed_at,
    });
  });

  const reviewerIds = Object.keys(reviewerStats);
  const { data: reviewers } = await supabase
    .from('reviewers')
    .select(`id, user:users (github_username, full_name)`)
    .in('id', reviewerIds);

  const reviewerMap = new Map<string, string>();
  reviewers?.forEach((r) => {
    const user = r.user as any;
    const name = user?.github_username || user?.full_name || 'Unknown';
    reviewerMap.set(r.id, name.startsWith('@') ? name : `@${name}`);
  });

  const performance: ReviewerPerformance[] = Object.values(reviewerStats)
    .map((stats) => {
      const reviewerName = reviewerMap.get(stats.reviewerId) || '@Unknown';
      const totalTime = stats.reviews.reduce((sum, r) => {
        return (
          sum +
          (new Date(r.reviewed_at).getTime() -
            new Date(r.assigned_at).getTime()) /
            3600000
        );
      }, 0);
      const avgTime =
        stats.reviews.length > 0 ? totalTime / stats.reviews.length : 0;

      const slaMet = stats.reviews.filter((r) => {
        const hours =
          (new Date(r.reviewed_at).getTime() -
            new Date(r.assigned_at).getTime()) /
          3600000;
        return hours <= 4;
      }).length;
      const sla =
        stats.reviews.length > 0 ? (slaMet / stats.reviews.length) * 100 : 0;

      const prevTotalTime = stats.prevReviews.reduce((sum, r) => {
        return (
          sum +
          (new Date(r.reviewed_at).getTime() -
            new Date(r.assigned_at).getTime()) /
            3600000
        );
      }, 0);
      const prevAvgTime =
        stats.prevReviews.length > 0
          ? prevTotalTime / stats.prevReviews.length
          : 0;
      const trend: 'up' | 'down' = avgTime < prevAvgTime ? 'up' : 'down';

      return {
        reviewer: reviewerName,
        avgTime: `${avgTime.toFixed(1)} hours`,
        prsReviewed: stats.reviews.length,
        sla: `${Math.round(sla)}%`,
        trend,
      };
    })
    .sort((a, b) => b.prsReviewed - a.prsReviewed)
    .slice(0, 10);

  return performance;
}

export async function fetchBottleneckData({
  supabase,
  organizationId,
  timeRange,
}: PerformanceServiceParams): Promise<BottleneckData[]> {
  const startDate = getDateRangeFromTimeRange(timeRange);
  const repoIds = await getOrgRepositoryIds(supabase, organizationId);

  if (repoIds.length === 0) return [];

  const { data: assignments } = await supabase
    .from('review_assignments')
    .select(
      `id, reviewer_id, assigned_at, reviewed_at, pull_request_id, pull_request:pull_requests!inner (repository_id)`
    )
    .in('pull_request.repository_id', repoIds)
    .gte('assigned_at', startDate.toISOString())
    .not('reviewed_at', 'is', null);

  if (!assignments || assignments.length === 0) return [];

  const frequencyMap = calculateBottleneckFrequency(
    assignments.map((a) => ({
      reviewer_id: a.reviewer_id,
      assigned_at: a.assigned_at,
      reviewed_at: a.reviewed_at,
      pull_request_id: a.pull_request_id,
    }))
  );

  const reviewerIds = Object.keys(frequencyMap);
  const { data: reviewers } = await supabase
    .from('reviewers')
    .select(`id, user:users (github_username, full_name)`)
    .in('id', reviewerIds);

  const reviewerMap = new Map<string, string>();
  reviewers?.forEach((r) => {
    const user = r.user as any;
    reviewerMap.set(
      r.id,
      user?.github_username || user?.full_name || 'Unknown'
    );
  });

  return Object.entries(frequencyMap)
    .map(([reviewerId, frequency]) => ({
      reviewer: reviewerMap.get(reviewerId) || 'Unknown',
      frequency,
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 8);
}

export async function fetchRepoComparisonData({
  supabase,
  organizationId,
  timeRange,
}: PerformanceServiceParams): Promise<RepoComparisonData[]> {
  const startDate = getDateRangeFromTimeRange(timeRange);
  const repoIds = await getOrgRepositoryIds(supabase, organizationId);

  if (repoIds.length === 0) return [];

  const { data: assignments } = await supabase
    .from('review_assignments')
    .select(
      `id, assigned_at, reviewed_at, pull_request:pull_requests!inner (repository_id, repositories (full_name))`
    )
    .in('pull_request.repository_id', repoIds)
    .gte('assigned_at', startDate.toISOString())
    .not('reviewed_at', 'is', null);

  if (!assignments || assignments.length === 0) return [];

  const repoStats: Record<
    string,
    { name: string; totalTime: number; count: number }
  > = {};

  assignments.forEach((a) => {
    if (!a.reviewed_at) return;
    const repo = a.pull_request as any;
    const repoId = repo.repository_id;
    const repoName = repo.repositories?.full_name || 'Unknown';

    if (!repoStats[repoId]) {
      repoStats[repoId] = { name: repoName, totalTime: 0, count: 0 };
    }
    const hours =
      (new Date(a.reviewed_at).getTime() - new Date(a.assigned_at).getTime()) /
      3600000;
    repoStats[repoId].totalTime += hours;
    repoStats[repoId].count++;
  });

  return Object.values(repoStats)
    .map((stats) => ({
      repo: stats.name.split('/').pop() || stats.name,
      hours: stats.count > 0 ? stats.totalTime / stats.count : 0,
    }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 6);
}

export async function fetchMergeSuccessData({
  supabase,
  organizationId,
  timeRange,
}: PerformanceServiceParams): Promise<MergeSuccessData[]> {
  const startDate = getDateRangeFromTimeRange(timeRange);
  const repoIds = await getOrgRepositoryIds(supabase, organizationId);

  if (repoIds.length === 0) return [];

  const { data: prs } = await supabase
    .from('pull_requests')
    .select(`id, repository_id, status, merged_at, repositories (full_name)`)
    .in('repository_id', repoIds)
    .gte('created_at', startDate.toISOString());

  if (!prs || prs.length === 0) return [];

  const repoStats: Record<
    string,
    { name: string; total: number; merged: number }
  > = {};

  prs.forEach((pr) => {
    const repoId = pr.repository_id;
    const repo = pr.repositories as any;
    const repoName = repo?.full_name || 'Unknown';

    if (!repoStats[repoId]) {
      repoStats[repoId] = { name: repoName, total: 0, merged: 0 };
    }
    repoStats[repoId].total++;
    if (pr.status === 'merged' || pr.merged_at) {
      repoStats[repoId].merged++;
    }
  });

  return Object.values(repoStats)
    .map((stats) => ({
      repo: stats.name.split('/').pop() || stats.name,
      successRate: stats.total > 0 ? (stats.merged / stats.total) * 100 : 0,
    }))
    .sort((a, b) => b.successRate - a.successRate)
    .slice(0, 6);
}

export async function fetchPrSizeByAuthorData({
  supabase,
  organizationId,
  timeRange,
}: PerformanceServiceParams): Promise<PrSizeByAuthorData[]> {
  const startDate = getDateRangeFromTimeRange(timeRange);
  const repoIds = await getOrgRepositoryIds(supabase, organizationId);

  if (repoIds.length === 0) return [];

  const { data: prs } = await supabase
    .from('pull_requests')
    .select('id, author_login, additions, deletions')
    .in('repository_id', repoIds)
    .gte('created_at', startDate.toISOString());

  if (!prs || prs.length === 0) return [];

  const authorStats: Record<
    string,
    { small: number; medium: number; large: number }
  > = {};

  prs.forEach((pr) => {
    const author = pr.author_login || 'Unknown';
    if (!authorStats[author]) {
      authorStats[author] = { small: 0, medium: 0, large: 0 };
    }
    const size = (pr.additions || 0) + (pr.deletions || 0);
    if (size < 100) {
      authorStats[author].small++;
    } else if (size <= 500) {
      authorStats[author].medium++;
    } else {
      authorStats[author].large++;
    }
  });

  return Object.entries(authorStats)
    .map(([author, stats]) => ({
      author: author.startsWith('@') ? author : `@${author}`,
      small: stats.small,
      medium: stats.medium,
      large: stats.large,
    }))
    .sort(
      (a, b) => b.small + b.medium + b.large - (a.small + a.medium + a.large)
    )
    .slice(0, 8);
}

export async function fetchReviewThroughputData({
  supabase,
  organizationId,
  timeRange,
}: PerformanceServiceParams): Promise<ReviewThroughputData[]> {
  const startDate = getDateRangeFromTimeRange(timeRange);
  const repoIds = await getOrgRepositoryIds(supabase, organizationId);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (repoIds.length === 0) return dayNames.map((day) => ({ day, reviews: 0 }));

  const { data: assignments } = await supabase
    .from('review_assignments')
    .select(`id, reviewed_at, pull_request:pull_requests!inner (repository_id)`)
    .in('pull_request.repository_id', repoIds)
    .gte('reviewed_at', startDate.toISOString())
    .not('reviewed_at', 'is', null);

  if (!assignments || assignments.length === 0) {
    return dayNames.map((day) => ({ day, reviews: 0 }));
  }

  const dayCounts: Record<number, number> = {};
  dayNames.forEach((_, i) => {
    dayCounts[i] = 0;
  });

  assignments.forEach((a) => {
    if (!a.reviewed_at) return;
    const dayOfWeek = new Date(a.reviewed_at).getDay();
    dayCounts[dayOfWeek] = (dayCounts[dayOfWeek] || 0) + 1;
  });

  const daysInRange =
    (Date.now() - startDate.getTime()) / (24 * 60 * 60 * 1000);
  const numWeeks = Math.ceil(daysInRange / 7);

  return dayNames.map((day, index) => ({
    day,
    reviews: numWeeks > 0 ? Math.round(dayCounts[index] / numWeeks) : 0,
  }));
}

export async function fetchWorkloadDistributionData({
  supabase,
  organizationId,
  timeRange,
}: PerformanceServiceParams): Promise<WorkloadDistributionData[]> {
  const startDate = getDateRangeFromTimeRange(timeRange);
  const repoIds = await getOrgRepositoryIds(supabase, organizationId);

  if (repoIds.length === 0) return [];

  const { data: assignments } = await supabase
    .from('review_assignments')
    .select(`id, reviewer_id, pull_request:pull_requests!inner (repository_id)`)
    .in('pull_request.repository_id', repoIds)
    .gte('assigned_at', startDate.toISOString())
    .not('reviewed_at', 'is', null);

  if (!assignments || assignments.length === 0) return [];

  // Count reviews per reviewer
  const reviewerCounts: Record<string, number> = {};
  assignments.forEach((a) => {
    reviewerCounts[a.reviewer_id] = (reviewerCounts[a.reviewer_id] || 0) + 1;
  });

  const totalReviews = assignments.length;

  // Get reviewer names
  const reviewerIds = Object.keys(reviewerCounts);
  const { data: reviewers } = await supabase
    .from('reviewers')
    .select(`id, user:users (github_username, full_name)`)
    .in('id', reviewerIds);

  const reviewerMap = new Map<string, string>();
  reviewers?.forEach((r) => {
    const user = r.user as any;
    const name = user?.github_username || user?.full_name || 'Unknown';
    reviewerMap.set(r.id, name);
  });

  return Object.entries(reviewerCounts)
    .map(([reviewerId, count]) => ({
      reviewer: reviewerMap.get(reviewerId) || 'Unknown',
      reviewCount: count,
      percentage: totalReviews > 0 ? (count / totalReviews) * 100 : 0,
    }))
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, 8);
}

export async function fetchTimeToFirstReviewData({
  supabase,
  organizationId,
  timeRange,
}: PerformanceServiceParams): Promise<TimeToFirstReviewData[]> {
  const startDate = getDateRangeFromTimeRange(timeRange);
  const repoIds = await getOrgRepositoryIds(supabase, organizationId);

  if (repoIds.length === 0) return [];

  // Get PRs with their first review assignment
  const { data: assignments } = await supabase
    .from('review_assignments')
    .select(
      `id, reviewer_id, assigned_at, reviewed_at, pull_request:pull_requests!inner (repository_id, created_at)`
    )
    .in('pull_request.repository_id', repoIds)
    .gte('assigned_at', startDate.toISOString())
    .not('reviewed_at', 'is', null);

  if (!assignments || assignments.length === 0) return [];

  // Calculate time from PR creation to first review per reviewer
  const reviewerStats: Record<string, { totalMinutes: number; count: number }> =
    {};

  assignments.forEach((a) => {
    if (!a.reviewed_at) return;
    const pr = a.pull_request as any;
    const prCreatedAt = new Date(pr.created_at);
    const reviewedAt = new Date(a.reviewed_at);
    const minutes = (reviewedAt.getTime() - prCreatedAt.getTime()) / 60000;

    if (!reviewerStats[a.reviewer_id]) {
      reviewerStats[a.reviewer_id] = { totalMinutes: 0, count: 0 };
    }
    reviewerStats[a.reviewer_id].totalMinutes += minutes;
    reviewerStats[a.reviewer_id].count++;
  });

  // Get reviewer names
  const reviewerIds = Object.keys(reviewerStats);
  const { data: reviewers } = await supabase
    .from('reviewers')
    .select(`id, user:users (github_username, full_name)`)
    .in('id', reviewerIds);

  const reviewerMap = new Map<string, string>();
  reviewers?.forEach((r) => {
    const user = r.user as any;
    const name = user?.github_username || user?.full_name || 'Unknown';
    reviewerMap.set(r.id, name);
  });

  return Object.entries(reviewerStats)
    .map(([reviewerId, stats]) => ({
      reviewer: reviewerMap.get(reviewerId) || 'Unknown',
      minutes:
        stats.count > 0 ? Math.round(stats.totalMinutes / stats.count) : 0,
    }))
    .sort((a, b) => a.minutes - b.minutes) // Sort by fastest first
    .slice(0, 8);
}

// =============================================
// Main Fetch Function
// =============================================

export async function fetchPerformanceData(
  params: PerformanceServiceParams
): Promise<PerformanceData> {
  const [
    kpis,
    reviewerPerformance,
    bottlenecks,
    repoComparison,
    mergeSuccess,
    prSizeByAuthor,
    reviewThroughput,
    workloadDistribution,
    timeToFirstReview,
  ] = await Promise.all([
    fetchPerformanceKpis(params),
    fetchReviewerPerformance(params),
    fetchBottleneckData(params),
    fetchRepoComparisonData(params),
    fetchMergeSuccessData(params),
    fetchPrSizeByAuthorData(params),
    fetchReviewThroughputData(params),
    fetchWorkloadDistributionData(params),
    fetchTimeToFirstReviewData(params),
  ]);

  return {
    kpis,
    reviewerPerformance,
    bottlenecks,
    repoComparison,
    mergeSuccess,
    prSizeByAuthor,
    reviewThroughput,
    workloadDistribution,
    timeToFirstReview,
  };
}
