'use client';

import { IconTrendingDown, IconTrendingUp } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { Line, LineChart, ResponsiveContainer } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Card, CardAction, CardFooter } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { PerformanceKpiSkeleton } from './performance-skeleton';
import {
  getDateRangeFromTimeRange,
  getOrgRepositoryIds,
  getPreviousPeriodRange,
  getTimeRangeInDays,
  type PerformanceChartProps,
  verifyOrgAccess,
} from './utils';

interface PerformanceKpi {
  label: string;
  value: string;
  delta: number;
  data: { value: number }[];
  color: string;
  lowerIsBetter?: boolean;
}

interface PerformanceKpiData {
  topReviewer: {
    name: string;
    avgTime: number;
    current: number;
    previous: number;
    sparkline: number[];
  };
  teamAvgTime: {
    current: number;
    previous: number;
    sparkline: number[];
  };
  slaCompliance: {
    current: number;
    previous: number;
    sparkline: number[];
  };
  totalReviews: {
    current: number;
    previous: number;
    sparkline: number[];
  };
}

async function fetchPerformanceKpis(
  timeRange: PerformanceChartProps['timeRange'],
  organizationId: string
): Promise<PerformanceKpiData> {
  await verifyOrgAccess(organizationId);

  const supabase = createClient();
  const startDate = getDateRangeFromTimeRange(timeRange);
  const previousPeriod = getPreviousPeriodRange(timeRange);
  const repoIds = await getOrgRepositoryIds(organizationId);

  if (repoIds.length === 0) {
    return {
      topReviewer: {
        name: 'N/A',
        avgTime: 0,
        current: 0,
        previous: 0,
        sparkline: Array(6).fill(0),
      },
      teamAvgTime: {
        current: 0,
        previous: 0,
        sparkline: Array(6).fill(0),
      },
      slaCompliance: {
        current: 0,
        previous: 0,
        sparkline: Array(6).fill(0),
      },
      totalReviews: {
        current: 0,
        previous: 0,
        sparkline: Array(6).fill(0),
      },
    };
  }

  // Get review assignments for current period
  const { data: currentAssignments } = await supabase
    .from('review_assignments')
    .select(
      `
      id,
      reviewer_id,
      assigned_at,
      reviewed_at,
      pull_request:pull_requests!inner (
        repository_id
      )
    `
    )
    .in('pull_request.repository_id', repoIds)
    .gte('assigned_at', startDate.toISOString())
    .not('reviewed_at', 'is', null);

  // Get review assignments for previous period
  const { data: previousAssignments } = await supabase
    .from('review_assignments')
    .select(
      `
      id,
      reviewer_id,
      assigned_at,
      reviewed_at,
      pull_request:pull_requests!inner (
        repository_id
      )
    `
    )
    .in('pull_request.repository_id', repoIds)
    .gte('assigned_at', previousPeriod.startDate.toISOString())
    .lt('assigned_at', previousPeriod.endDate.toISOString())
    .not('reviewed_at', 'is', null);

  const current = currentAssignments || [];
  const previous = previousAssignments || [];

  // Calculate sparkline data (last 6 periods)
  const daysInRange = getTimeRangeInDays(timeRange);
  const periodLength = daysInRange / 6; // 6 data points
  const sparklineData: number[][] = [[], [], [], []]; // 4 KPIs

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

    // Top reviewer (most reviews)
    const reviewerCounts: Record<string, number> = {};
    periodAssignments.forEach((a) => {
      reviewerCounts[a.reviewer_id] = (reviewerCounts[a.reviewer_id] || 0) + 1;
    });
    const topReviewerId = Object.entries(reviewerCounts).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0];
    sparklineData[0].push(reviewerCounts[topReviewerId || ''] || 0);

    // Team avg time
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

    // SLA compliance (4h target)
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

    // Total reviews
    sparklineData[3].push(periodAssignments.length);
  }

  // Calculate current period metrics
  // Top reviewer
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

  // Get reviewer name
  let topReviewerName = 'N/A';
  if (topReviewerEntry) {
    const { data: reviewer } = await supabase
      .from('reviewers')
      .select(
        `
        user:users (
          github_username,
          full_name
        )
      `
      )
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

  // Team avg time
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

  // SLA compliance
  const slaMet = current.filter((a) => {
    if (!a.reviewed_at) return false;
    const hours =
      (new Date(a.reviewed_at).getTime() - new Date(a.assigned_at).getTime()) /
      3600000;
    return hours <= 4;
  }).length;
  const slaCompliance =
    current.length > 0 ? (slaMet / current.length) * 100 : 0;

  // Previous period metrics
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

  // Previous top reviewer
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

function Sparkline({
  data,
  color,
}: {
  data: { value: number }[];
  color: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function formatKpiData(data: PerformanceKpiData): PerformanceKpi[] {
  const calcDelta = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  return [
    {
      label: 'Top Reviewer',
      value: data.topReviewer.name,
      delta: calcDelta(data.topReviewer.current, data.topReviewer.previous),
      data: data.topReviewer.sparkline.map((v) => ({ value: v })),
      color: '#3b82f6',
      lowerIsBetter: false,
    },
    {
      label: 'Team Avg Time',
      value: `${data.teamAvgTime.current.toFixed(1)}h`,
      delta: calcDelta(data.teamAvgTime.current, data.teamAvgTime.previous),
      data: data.teamAvgTime.sparkline.map((v) => ({ value: v })),
      color: '#10b981',
      lowerIsBetter: true,
    },
    {
      label: 'SLA Compliance',
      value: `${Math.round(data.slaCompliance.current)}%`,
      delta: calcDelta(data.slaCompliance.current, data.slaCompliance.previous),
      data: data.slaCompliance.sparkline.map((v) => ({ value: v })),
      color: '#16a34a',
    },
    {
      label: 'Total Reviews',
      value: `${data.totalReviews.current}`,
      delta: calcDelta(data.totalReviews.current, data.totalReviews.previous),
      data: data.totalReviews.sparkline.map((v) => ({ value: v })),
      color: '#f59e0b',
    },
  ];
}

export function PerformanceKpiRow({
  timeRange,
  organizationId,
}: PerformanceChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['performance-kpis', timeRange, organizationId],
    queryFn: () => fetchPerformanceKpis(timeRange, organizationId),
    enabled: !!organizationId,
  });

  if (isLoading || !data) {
    return <PerformanceKpiSkeleton />;
  }

  const performanceKpis = formatKpiData(data);

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {performanceKpis.map((kpi, index) => {
        const isPositive = kpi.lowerIsBetter ? kpi.delta < 0 : kpi.delta > 0;
        const displayDelta = Math.abs(kpi.delta);

        return (
          <Card
            key={kpi.label}
            className="fade-in-50 slide-in-from-bottom-2 flex animate-in flex-col justify-between gap-3 p-4 transition-all duration-200 hover:shadow-md"
            style={{
              animationDelay: `${index * 50}ms`,
              animationFillMode: 'backwards',
            }}
          >
            <div>
              <div className="flex w-full flex-row items-center justify-between">
                <div className="font-medium text-[11px] text-muted-foreground uppercase tracking-wide">
                  {kpi.label}
                </div>
                <CardAction>
                  <Badge
                    variant="outline"
                    className={
                      isPositive
                        ? 'border-green-200 bg-green-50 text-green-600 dark:border-green-800 dark:bg-green-950'
                        : 'border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950'
                    }
                  >
                    {isPositive ? (
                      <IconTrendingUp className="mr-1 size-3" />
                    ) : (
                      <IconTrendingDown className="mr-1 size-3" />
                    )}
                    {displayDelta}%
                  </Badge>
                </CardAction>
              </div>
              <div className="mt-1 font-bold text-3xl text-foreground">
                {kpi.value}
              </div>
            </div>

            <div className="h-10">
              <Sparkline data={kpi.data} color={kpi.color} />
            </div>

            <CardFooter className="flex-col items-start gap-1 p-0 text-sm">
              <div className="text-muted-foreground text-xs">
                {isPositive ? 'Improved' : 'Declined'} this period
              </div>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
