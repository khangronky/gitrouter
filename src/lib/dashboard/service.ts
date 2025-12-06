import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import type {
  KpiRowData,
  LatencySeries,
  ReviewerWorkloadSeries,
  BottlenecksList,
  StalePullRequestsList,
  RecentActivityList,
  TimeRange,
} from '@/lib/schema/dashboard';

type TypedSupabaseClient = SupabaseClient<Database>;

// Default reviewer capacity (can be made configurable per org later)
const DEFAULT_REVIEWER_CAPACITY = 40;

// SLA threshold in hours (PRs reviewed within this time count as meeting SLA)
const SLA_THRESHOLD_HOURS = 24;

interface DashboardServiceParams {
  supabase: TypedSupabaseClient;
  organizationId: string;
  repositoryId?: string;
  timeRange: TimeRange;
}

/**
 * Get the date range based on timeRange parameter
 */
function getDateRange(timeRange: TimeRange): { startDate: Date; endDate: Date } {
  const endDate = new Date();
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

  return { startDate, endDate };
}

/**
 * Get the previous period date range for delta calculations
 */
function getPreviousPeriodRange(timeRange: TimeRange): { startDate: Date; endDate: Date } {
  const { startDate: currentStart, endDate: currentEnd } = getDateRange(timeRange);
  const periodLength = currentEnd.getTime() - currentStart.getTime();

  const endDate = new Date(currentStart);
  const startDate = new Date(currentStart.getTime() - periodLength);

  return { startDate, endDate };
}

/**
 * Fetch KPI data for the dashboard
 */
export async function fetchDashboardKpis({
  supabase,
  organizationId,
  repositoryId,
  timeRange,
}: DashboardServiceParams): Promise<KpiRowData> {
  const { startDate, endDate } = getDateRange(timeRange);
  const previousPeriod = getPreviousPeriodRange(timeRange);

  // Build repository filter
  let repoIds: string[] = [];
  if (repositoryId) {
    repoIds = [repositoryId];
  } else {
    // Get all repositories for the organization
    const { data: repos } = await supabase
      .from('repositories')
      .select('id')
      .eq('organization_id', organizationId);
    repoIds = repos?.map((r) => r.id) || [];
  }

  if (repoIds.length === 0) {
    return {
      totalPRs: { value: 0, delta: 0, note: 'from last period' },
      pending: { value: 0, delta: 0, note: 'from last period' },
      sla: { value: 0, delta: 0, note: 'from last period' },
      approved: { value: 0, delta: 0, note: 'from last period' },
    };
  }

  // Current period stats
  const { data: currentPRs } = await supabase
    .from('pull_requests')
    .select('id, status, created_at, merged_at')
    .in('repository_id', repoIds)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  // Previous period stats
  const { data: previousPRs } = await supabase
    .from('pull_requests')
    .select('id, status, created_at')
    .in('repository_id', repoIds)
    .gte('created_at', previousPeriod.startDate.toISOString())
    .lte('created_at', previousPeriod.endDate.toISOString());

  // Current pending PRs (open status with pending review assignments)
  const { data: pendingAssignments } = await supabase
    .from('review_assignments')
    .select(`
      id,
      status,
      assigned_at,
      reviewed_at,
      pull_request:pull_requests!inner (
        id,
        repository_id,
        status
      )
    `)
    .eq('status', 'pending')
    .in('pull_request.repository_id', repoIds);

  // Get previous period pending count
  const { data: previousPendingAssignments } = await supabase
    .from('review_assignments')
    .select(`
      id,
      pull_request:pull_requests!inner (
        id,
        repository_id,
        created_at
      )
    `)
    .eq('status', 'pending')
    .in('pull_request.repository_id', repoIds)
    .lte('pull_request.created_at', previousPeriod.endDate.toISOString());

  // Calculate SLA compliance - PRs where first review happened within SLA_THRESHOLD_HOURS
  const { data: slaAssignments } = await supabase
    .from('review_assignments')
    .select(`
      id,
      assigned_at,
      reviewed_at,
      pull_request:pull_requests!inner (
        id,
        repository_id,
        created_at
      )
    `)
    .in('pull_request.repository_id', repoIds)
    .gte('pull_request.created_at', startDate.toISOString())
    .lte('pull_request.created_at', endDate.toISOString())
    .not('reviewed_at', 'is', null);

  // Calculate SLA compliance rate
  let slaMetCount = 0;
  let totalReviewed = 0;
  if (slaAssignments) {
    for (const assignment of slaAssignments) {
      if (assignment.reviewed_at && assignment.assigned_at) {
        totalReviewed++;
        const assignedTime = new Date(assignment.assigned_at).getTime();
        const reviewedTime = new Date(assignment.reviewed_at).getTime();
        const hoursToReview = (reviewedTime - assignedTime) / (1000 * 60 * 60);
        if (hoursToReview <= SLA_THRESHOLD_HOURS) {
          slaMetCount++;
        }
      }
    }
  }

  const currentSlaRate = totalReviewed > 0 ? slaMetCount / totalReviewed : 0;

  // Previous period SLA
  const { data: previousSlaAssignments } = await supabase
    .from('review_assignments')
    .select(`
      id,
      assigned_at,
      reviewed_at,
      pull_request:pull_requests!inner (
        id,
        repository_id,
        created_at
      )
    `)
    .in('pull_request.repository_id', repoIds)
    .gte('pull_request.created_at', previousPeriod.startDate.toISOString())
    .lte('pull_request.created_at', previousPeriod.endDate.toISOString())
    .not('reviewed_at', 'is', null);

  let prevSlaMetCount = 0;
  let prevTotalReviewed = 0;
  if (previousSlaAssignments) {
    for (const assignment of previousSlaAssignments) {
      if (assignment.reviewed_at && assignment.assigned_at) {
        prevTotalReviewed++;
        const assignedTime = new Date(assignment.assigned_at).getTime();
        const reviewedTime = new Date(assignment.reviewed_at).getTime();
        const hoursToReview = (reviewedTime - assignedTime) / (1000 * 60 * 60);
        if (hoursToReview <= SLA_THRESHOLD_HOURS) {
          prevSlaMetCount++;
        }
      }
    }
  }

  const previousSlaRate = prevTotalReviewed > 0 ? prevSlaMetCount / prevTotalReviewed : 0;

  // Count approved/merged PRs in current period
  const approvedCount = currentPRs?.filter((pr) => pr.status === 'merged').length || 0;
  const previousApprovedCount = previousPRs?.filter((pr) => pr.status === 'merged').length || 0;

  const totalCurrent = currentPRs?.length || 0;
  const totalPrevious = previousPRs?.length || 0;
  const pendingCurrent = pendingAssignments?.length || 0;
  const pendingPrevious = previousPendingAssignments?.length || 0;

  const noteText = timeRange === '7d' ? 'from last week' : timeRange === '30d' ? 'from last month' : 'from last period';

  return {
    totalPRs: {
      value: totalCurrent,
      delta: totalCurrent - totalPrevious,
      note: noteText,
    },
    pending: {
      value: pendingCurrent,
      delta: pendingCurrent - pendingPrevious,
      note: noteText,
    },
    sla: {
      value: Math.round(currentSlaRate * 100) / 100,
      delta: Math.round((currentSlaRate - previousSlaRate) * 100),
      note: noteText,
    },
    approved: {
      value: approvedCount,
      delta: approvedCount - previousApprovedCount,
      note: noteText,
    },
  };
}

/**
 * Fetch latency series data for the dashboard chart
 */
export async function fetchLatencySeries({
  supabase,
  organizationId,
  repositoryId,
  timeRange,
}: DashboardServiceParams): Promise<LatencySeries> {
  const { startDate, endDate } = getDateRange(timeRange);

  // Build repository filter
  let repoIds: string[] = [];
  if (repositoryId) {
    repoIds = [repositoryId];
  } else {
    const { data: repos } = await supabase
      .from('repositories')
      .select('id')
      .eq('organization_id', organizationId);
    repoIds = repos?.map((r) => r.id) || [];
  }

  if (repoIds.length === 0) {
    return [];
  }

  // Get review assignments with timestamps
  const { data: assignments } = await supabase
    .from('review_assignments')
    .select(`
      id,
      assigned_at,
      reviewed_at,
      pull_request:pull_requests!inner (
        id,
        repository_id,
        created_at
      )
    `)
    .in('pull_request.repository_id', repoIds)
    .gte('assigned_at', startDate.toISOString())
    .lte('assigned_at', endDate.toISOString())
    .not('reviewed_at', 'is', null);

  // Group by day and calculate average latency
  const dailyLatency: Record<string, { totalHours: number; count: number }> = {};

  if (assignments) {
    for (const assignment of assignments) {
      if (assignment.reviewed_at && assignment.assigned_at) {
        const assignedDate = new Date(assignment.assigned_at);
        const dayKey = assignedDate.toLocaleDateString('en-US', { weekday: 'short' });
        const dateKey = assignedDate.toISOString().split('T')[0];
        const key = `${dateKey}-${dayKey}`;

        const assignedTime = assignedDate.getTime();
        const reviewedTime = new Date(assignment.reviewed_at).getTime();
        const hoursToReview = (reviewedTime - assignedTime) / (1000 * 60 * 60);

        if (!dailyLatency[key]) {
          dailyLatency[key] = { totalHours: 0, count: 0 };
        }
        dailyLatency[key].totalHours += hoursToReview;
        dailyLatency[key].count++;
      }
    }
  }

  // Convert to series format sorted by date
  const series: LatencySeries = Object.entries(dailyLatency)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, data]) => ({
      day: key.split('-')[1] || key,
      hours: Math.round((data.totalHours / data.count) * 10) / 10,
    }));

  // If we don't have enough data, pad with defaults
  if (series.length === 0) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day) => ({ day, hours: 0 }));
  }

  return series;
}

/**
 * Fetch reviewer workload data
 */
export async function fetchReviewerWorkload({
  supabase,
  organizationId,
}: DashboardServiceParams): Promise<ReviewerWorkloadSeries> {
  // Get active reviewers for the organization
  const { data: reviewers } = await supabase
    .from('reviewers')
    .select('id, name, github_username')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .limit(10);

  if (!reviewers || reviewers.length === 0) {
    return [];
  }

  // Get pending assignments count per reviewer
  const { data: assignments } = await supabase
    .from('review_assignments')
    .select('reviewer_id')
    .eq('status', 'pending')
    .in('reviewer_id', reviewers.map((r) => r.id));

  // Count assignments per reviewer
  const assignmentCounts: Record<string, number> = {};
  if (assignments) {
    for (const assignment of assignments) {
      assignmentCounts[assignment.reviewer_id] = (assignmentCounts[assignment.reviewer_id] || 0) + 1;
    }
  }

  return reviewers.map((reviewer) => ({
    name: reviewer.github_username ? `@${reviewer.github_username}` : reviewer.name,
    assigned: assignmentCounts[reviewer.id] || 0,
    capacity: DEFAULT_REVIEWER_CAPACITY,
  }));
}

/**
 * Fetch repository bottlenecks data
 */
export async function fetchBottlenecks({
  supabase,
  organizationId,
}: DashboardServiceParams): Promise<BottlenecksList> {
  // Get repositories for the organization
  const { data: repos } = await supabase
    .from('repositories')
    .select('id, full_name')
    .eq('organization_id', organizationId)
    .eq('is_active', true);

  if (!repos || repos.length === 0) {
    return [];
  }

  const bottlenecks: BottlenecksList = [];

  for (const repo of repos) {
    // Get pending PRs and their assignments
    const { data: prData } = await supabase
      .from('pull_requests')
      .select(`
        id,
        created_at,
        review_assignments (
          id,
          status,
          assigned_at,
          reviewed_at
        )
      `)
      .eq('repository_id', repo.id)
      .eq('status', 'open');

    if (!prData || prData.length === 0) continue;

    // Calculate metrics
    let totalWaitHours = 0;
    let waitCount = 0;
    let slaMetCount = 0;
    let pendingCount = 0;

    for (const pr of prData) {
      const assignments = pr.review_assignments || [];
      for (const assignment of assignments) {
        if (assignment.status === 'pending') {
          pendingCount++;
          // Calculate current wait time
          const assignedTime = new Date(assignment.assigned_at).getTime();
          const now = Date.now();
          const waitHours = (now - assignedTime) / (1000 * 60 * 60);
          totalWaitHours += waitHours;
          waitCount++;
        } else if (assignment.reviewed_at) {
          const assignedTime = new Date(assignment.assigned_at).getTime();
          const reviewedTime = new Date(assignment.reviewed_at).getTime();
          const hoursToReview = (reviewedTime - assignedTime) / (1000 * 60 * 60);
          if (hoursToReview <= SLA_THRESHOLD_HOURS) {
            slaMetCount++;
          }
          totalWaitHours += hoursToReview;
          waitCount++;
        }
      }
    }

    const avgHours = waitCount > 0 ? totalWaitHours / waitCount : 0;
    const totalAssignments = pendingCount + slaMetCount;
    const slaRate = totalAssignments > 0 ? (slaMetCount / totalAssignments) * 100 : 100;

    // Extract repo name (last part of full_name)
    const repoName = repo.full_name.split('/').pop() || repo.full_name;

    bottlenecks.push({
      repo: repoName,
      avg: `${avgHours.toFixed(1)} hours`,
      pending: pendingCount,
      sla: `${Math.round(slaRate)}%`,
    });
  }

  // Sort by pending count descending
  return bottlenecks.sort((a, b) => b.pending - a.pending).slice(0, 10);
}

/**
 * Fetch stale pull requests (waiting for review beyond threshold)
 */
export async function fetchStalePullRequests({
  supabase,
  organizationId,
  repositoryId,
}: DashboardServiceParams): Promise<StalePullRequestsList> {
  // Build repository filter
  let repoIds: string[] = [];
  if (repositoryId) {
    repoIds = [repositoryId];
  } else {
    const { data: repos } = await supabase
      .from('repositories')
      .select('id')
      .eq('organization_id', organizationId);
    repoIds = repos?.map((r) => r.id) || [];
  }

  if (repoIds.length === 0) {
    return [];
  }

  // Get open PRs with pending review assignments
  const { data: stalePRs } = await supabase
    .from('pull_requests')
    .select(`
      id,
      github_pr_number,
      title,
      created_at,
      review_assignments!inner (
        id,
        status,
        assigned_at
      )
    `)
    .in('repository_id', repoIds)
    .eq('status', 'open')
    .eq('review_assignments.status', 'pending')
    .order('created_at', { ascending: true })
    .limit(20);

  if (!stalePRs) {
    return [];
  }

  const now = Date.now();
  return stalePRs.map((pr) => {
    const createdTime = new Date(pr.created_at).getTime();
    const ageMs = now - createdTime;

    // Format age as human-readable string
    const hours = Math.floor(ageMs / (1000 * 60 * 60));
    const minutes = Math.floor((ageMs % (1000 * 60 * 60)) / (1000 * 60));

    let ageStr: string;
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      ageStr = `${days}d ${remainingHours}h`;
    } else {
      ageStr = `${hours}h ${minutes}m`;
    }

    return {
      id: pr.github_pr_number,
      title: pr.title,
      age: ageStr,
    };
  });
}

/**
 * Fetch recent activity (recently created/assigned PRs)
 */
export async function fetchRecentActivity({
  supabase,
  organizationId,
  repositoryId,
}: DashboardServiceParams): Promise<RecentActivityList> {
  // Build repository filter
  let repoIds: string[] = [];
  if (repositoryId) {
    repoIds = [repositoryId];
  } else {
    const { data: repos } = await supabase
      .from('repositories')
      .select('id')
      .eq('organization_id', organizationId);
    repoIds = repos?.map((r) => r.id) || [];
  }

  if (repoIds.length === 0) {
    return [];
  }

  // Get recently created PRs with their assignments
  const { data: recentPRs } = await supabase
    .from('pull_requests')
    .select(`
      id,
      github_pr_number,
      title,
      author_login,
      created_at,
      review_assignments (
        id,
        reviewer:reviewers (
          id,
          name,
          github_username
        )
      )
    `)
    .in('repository_id', repoIds)
    .order('created_at', { ascending: false })
    .limit(15);

  if (!recentPRs) {
    return [];
  }

  return recentPRs.map((pr) => {
    const createdDate = new Date(pr.created_at);
    const timeStr = createdDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).toUpperCase();

    // Get assigned reviewer names
    const assigned = (pr.review_assignments || [])
      .map((a) => {
        const reviewer = a.reviewer;
        if (reviewer?.github_username) {
          return `@${reviewer.github_username}`;
        }
        return reviewer?.name || 'Unknown';
      })
      .filter((name, index, arr) => arr.indexOf(name) === index); // unique values

    return {
      time: timeStr,
      id: pr.github_pr_number,
      author: `@${pr.author_login}`,
      snippet: pr.title.length > 50 ? `${pr.title.substring(0, 47)}...` : pr.title,
      assigned,
    };
  });
}

/**
 * Fetch all dashboard data in parallel
 */
export async function fetchDashboardData(params: DashboardServiceParams) {
  const [kpis, latencySeries, reviewerWorkload, bottlenecks, stalePRs, recentActivity] = await Promise.all([
    fetchDashboardKpis(params),
    fetchLatencySeries(params),
    fetchReviewerWorkload(params),
    fetchBottlenecks(params),
    fetchStalePullRequests(params),
    fetchRecentActivity(params),
  ]);

  return {
    kpis,
    latencySeries,
    reviewerWorkload,
    bottlenecks,
    stalePRs,
    recentActivity,
    timeRange: params.timeRange,
  };
}

