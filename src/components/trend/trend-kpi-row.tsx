'use client';

import { IconTrendingDown, IconTrendingUp } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { Line, LineChart, ResponsiveContainer } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Card, CardAction, CardFooter } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { TrendKpiSkeleton } from './trend-skeleton';
import {
  getDateRangeFromTimeRange,
  getOrgRepositoryIds,
  getWeeksFromTimeRange,
  type TrendChartProps,
  verifyOrgAccess,
} from './utils';

interface TrendKpi {
  label: string;
  value: string;
  delta: number;
  data: { value: number }[];
  color: string;
  lowerIsBetter?: boolean;
}

interface KpiData {
  avgReviewSpeed: { current: number; previous: number; weekly: number[] };
  slaCompliance: { current: number; previous: number; weekly: number[] };
  cycleTime: { current: number; previous: number; weekly: number[] };
  approvalRate: { current: number; previous: number; weekly: number[] };
}

async function fetchTrendKpis(
  timeRange: TrendChartProps['timeRange'],
  organizationId: string
): Promise<KpiData> {
  await verifyOrgAccess(organizationId);

  const supabase = createClient();
  const startDate = getDateRangeFromTimeRange(timeRange);
  const numWeeks = getWeeksFromTimeRange(timeRange);
  const repoIds = await getOrgRepositoryIds(organizationId);

  if (repoIds.length === 0) {
    return {
      avgReviewSpeed: {
        current: 0,
        previous: 0,
        weekly: Array(numWeeks).fill(0),
      },
      slaCompliance: {
        current: 0,
        previous: 0,
        weekly: Array(numWeeks).fill(0),
      },
      cycleTime: { current: 0, previous: 0, weekly: Array(numWeeks).fill(0) },
      approvalRate: {
        current: 0,
        previous: 0,
        weekly: Array(numWeeks).fill(0),
      },
    };
  }

  // Get review assignments with PR data
  const { data: assignments } = await supabase
    .from('review_assignments')
    .select(
      `
      id,
      status,
      assigned_at,
      reviewed_at,
      pull_request:pull_requests!inner (
        id,
        repository_id,
        created_at,
        merged_at,
        status
      )
    `
    )
    .in('pull_request.repository_id', repoIds)
    .gte('assigned_at', startDate.toISOString());

  // Get merged PRs for cycle time
  const { data: mergedPRs } = await supabase
    .from('pull_requests')
    .select('id, created_at, merged_at')
    .in('repository_id', repoIds)
    .eq('status', 'merged')
    .not('merged_at', 'is', null)
    .gte('merged_at', startDate.toISOString());

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const startTime = startDate.getTime();

  // Initialize weekly data
  const weeklyReviewSpeed: number[] = Array(numWeeks).fill(0);
  const weeklyReviewCounts: number[] = Array(numWeeks).fill(0);
  const weeklySlaCount: number[] = Array(numWeeks).fill(0);
  const weeklyTotalReviews: number[] = Array(numWeeks).fill(0);
  const weeklyCycleTime: number[] = Array(numWeeks).fill(0);
  const weeklyCycleCounts: number[] = Array(numWeeks).fill(0);
  const weeklyApproved: number[] = Array(numWeeks).fill(0);
  const weeklyTotal: number[] = Array(numWeeks).fill(0);

  // Process assignments for review speed, SLA, and approval rate
  if (assignments) {
    for (const assignment of assignments) {
      const assignedAt = new Date(assignment.assigned_at);
      const weekIndex = Math.floor(
        (assignedAt.getTime() - startTime) / msPerWeek
      );

      if (weekIndex >= 0 && weekIndex < numWeeks) {
        weeklyTotal[weekIndex]++;

        if (assignment.status === 'approved') {
          weeklyApproved[weekIndex]++;
        }

        if (assignment.reviewed_at) {
          const reviewedAt = new Date(assignment.reviewed_at);
          const hoursToReview =
            (reviewedAt.getTime() - assignedAt.getTime()) / (1000 * 60 * 60);

          weeklyReviewSpeed[weekIndex] += hoursToReview;
          weeklyReviewCounts[weekIndex]++;
          weeklyTotalReviews[weekIndex]++;

          // SLA: within 4 hours
          if (hoursToReview <= 4) {
            weeklySlaCount[weekIndex]++;
          }
        }
      }
    }
  }

  // Process merged PRs for cycle time
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

  // Calculate weekly averages
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

  // Calculate current and previous values (last week vs first week with data)
  const getValues = (weekly: number[]) => {
    const nonZeroIndices = weekly
      .map((v, i) => (v > 0 ? i : -1))
      .filter((i) => i >= 0);
    if (nonZeroIndices.length === 0) return { current: 0, previous: 0 };
    const current = weekly[nonZeroIndices[nonZeroIndices.length - 1]];
    const previous =
      nonZeroIndices.length > 1 ? weekly[nonZeroIndices[0]] : current;
    return { current, previous };
  };

  return {
    avgReviewSpeed: {
      ...getValues(avgReviewSpeedWeekly),
      weekly: avgReviewSpeedWeekly,
    },
    slaCompliance: {
      ...getValues(slaComplianceWeekly),
      weekly: slaComplianceWeekly,
    },
    cycleTime: { ...getValues(cycleTimeWeekly), weekly: cycleTimeWeekly },
    approvalRate: {
      ...getValues(approvalRateWeekly),
      weekly: approvalRateWeekly,
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

function formatKpiData(data: KpiData): TrendKpi[] {
  const calcDelta = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  return [
    {
      label: 'Avg Review Speed',
      value: `${data.avgReviewSpeed.current}h`,
      delta: calcDelta(
        data.avgReviewSpeed.current,
        data.avgReviewSpeed.previous
      ),
      data: data.avgReviewSpeed.weekly.map((v) => ({ value: v })),
      color: '#2563eb',
      lowerIsBetter: true,
    },
    {
      label: 'SLA Compliance',
      value: `${data.slaCompliance.current}%`,
      delta: calcDelta(data.slaCompliance.current, data.slaCompliance.previous),
      data: data.slaCompliance.weekly.map((v) => ({ value: v })),
      color: '#16a34a',
    },
    {
      label: 'Cycle Time',
      value: `${data.cycleTime.current}h`,
      delta: calcDelta(data.cycleTime.current, data.cycleTime.previous),
      data: data.cycleTime.weekly.map((v) => ({ value: v })),
      color: '#0ea5e9',
      lowerIsBetter: true,
    },
    {
      label: 'Approval Rate',
      value: `${data.approvalRate.current}%`,
      delta: calcDelta(data.approvalRate.current, data.approvalRate.previous),
      data: data.approvalRate.weekly.map((v) => ({ value: v })),
      color: '#22c55e',
    },
  ];
}

export function TrendKpiRow({ timeRange, organizationId }: TrendChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['trend-kpis', timeRange, organizationId],
    queryFn: () => fetchTrendKpis(timeRange, organizationId),
    enabled: !!organizationId,
  });

  if (isLoading || !data) {
    return <TrendKpiSkeleton />;
  }

  const trendKpis = formatKpiData(data);
  const timeRangeLabel =
    timeRange === '6w'
      ? '6 weeks'
      : timeRange === '12w'
        ? '12 weeks'
        : '6 months';

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {trendKpis.map((kpi, index) => {
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
                {isPositive ? 'Improved' : 'Declined'} over {timeRangeLabel}
              </div>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
