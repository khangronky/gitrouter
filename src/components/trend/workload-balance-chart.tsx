'use client';

import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { createClient } from '@/lib/supabase/client';
import { TrendChartSkeleton } from './trend-skeleton';
import {
  getDateRangeFromTimeRange,
  getOrgRepositoryIds,
  getWeekLabel,
  getWeeksFromTimeRange,
  type TrendChartProps,
  verifyOrgAccess,
} from './utils';

interface WorkloadData {
  week: string;
  [reviewerName: string]: string | number;
}

// Color palette for reviewers
const REVIEWER_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
];

async function fetchWorkloadData(
  timeRange: TrendChartProps['timeRange'],
  organizationId: string
): Promise<{ data: WorkloadData[]; config: ChartConfig; reviewers: string[] }> {
  await verifyOrgAccess(organizationId);

  const supabase = createClient();
  const startDate = getDateRangeFromTimeRange(timeRange);
  const numWeeks = getWeeksFromTimeRange(timeRange);
  const repoIds = await getOrgRepositoryIds(organizationId);

  if (repoIds.length === 0) {
    return {
      data: Array(numWeeks)
        .fill(null)
        .map((_, i) => ({ week: getWeekLabel(i) })),
      config: {},
      reviewers: [],
    };
  }

  // Get review assignments with reviewer names
  const { data: assignments } = await supabase
    .from('review_assignments')
    .select(
      `
      id,
      assigned_at,
      reviewer:reviewers!inner (
        id,
        user:users (
          github_username,
          full_name
        )
      ),
      pull_request:pull_requests!inner (
        id,
        repository_id
      )
    `
    )
    .in('pull_request.repository_id', repoIds)
    .gte('assigned_at', startDate.toISOString());

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const startTime = startDate.getTime();

  // Track assignments per reviewer per week
  const weeklyReviewerCounts: Record<string, Record<string, number>> = {};
  const reviewerNames = new Set<string>();

  if (assignments) {
    for (const assignment of assignments) {
      const assignedAt = new Date(assignment.assigned_at);
      const weekIndex = Math.floor(
        (assignedAt.getTime() - startTime) / msPerWeek
      );

      if (weekIndex >= 0 && weekIndex < numWeeks) {
        const reviewer = assignment.reviewer as {
          user: {
            github_username: string | null;
            full_name: string | null;
          } | null;
        } | null;
        const reviewerName =
          reviewer?.user?.github_username ||
          reviewer?.user?.full_name ||
          'Unknown';

        reviewerNames.add(reviewerName);

        const weekKey = getWeekLabel(weekIndex);
        if (!weeklyReviewerCounts[weekKey]) {
          weeklyReviewerCounts[weekKey] = {};
        }
        weeklyReviewerCounts[weekKey][reviewerName] =
          (weeklyReviewerCounts[weekKey][reviewerName] || 0) + 1;
      }
    }
  }

  const reviewerList = Array.from(reviewerNames).slice(0, 8); // Limit to 8 reviewers

  // Build chart config
  const config: ChartConfig = {};
  reviewerList.forEach((name, index) => {
    config[name] = {
      label: name,
      color: REVIEWER_COLORS[index % REVIEWER_COLORS.length],
    };
  });

  // Build data array
  const data: WorkloadData[] = Array(numWeeks)
    .fill(null)
    .map((_, i) => {
      const weekKey = getWeekLabel(i);
      const weekData: WorkloadData = { week: weekKey };
      for (const reviewer of reviewerList) {
        weekData[reviewer] = weeklyReviewerCounts[weekKey]?.[reviewer] || 0;
      }
      return weekData;
    });

  return { data, config, reviewers: reviewerList };
}

export function WorkloadBalanceChart({
  timeRange,
  organizationId,
}: TrendChartProps) {
  const { data: result, isLoading } = useQuery({
    queryKey: ['workload-balance-chart', timeRange, organizationId],
    queryFn: () => fetchWorkloadData(timeRange, organizationId),
    enabled: !!organizationId,
  });

  if (isLoading || !result) {
    return <TrendChartSkeleton chartType="bar" />;
  }

  const { data, config, reviewers } = result;

  // Calculate variance
  const totalPerReviewer: Record<string, number> = {};
  for (const week of data) {
    for (const reviewer of reviewers) {
      totalPerReviewer[reviewer] =
        (totalPerReviewer[reviewer] || 0) + ((week[reviewer] as number) || 0);
    }
  }
  const values = Object.values(totalPerReviewer);
  const avg =
    values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  const variance =
    values.length > 0
      ? values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length
      : 0;
  const cv = avg > 0 ? Math.sqrt(variance) / avg : 0;
  const varianceLevel = cv < 0.3 ? 'Low' : cv < 0.6 ? 'Medium' : 'High';

  return (
    <Card className="flex flex-col p-4 transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Reviewer Workload Balance Trend
        </CardTitle>
        <CardDescription>
          Distribution of assigned PRs per reviewer over time
        </CardDescription>
      </div>
      <ChartContainer config={config} className="h-[200px] w-full flex-1">
        <BarChart
          data={data}
          margin={{ top: 20, right: 10, bottom: 0, left: -20 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="var(--border)"
          />
          <XAxis
            dataKey="week"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            className="text-muted-foreground text-xs"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            className="text-muted-foreground text-xs"
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          {reviewers.map((reviewer, index) => (
            <Bar
              key={reviewer}
              dataKey={reviewer}
              stackId="workload"
              fill={`var(--color-${reviewer})`}
              radius={
                index === reviewers.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]
              }
            />
          ))}
        </BarChart>
      </ChartContainer>
      <p className="mt-4 flex items-center gap-1 text-muted-foreground text-sm">
        Workload Variance:{' '}
        <span
          className={`font-medium ${varianceLevel === 'Low' ? 'text-green-600' : varianceLevel === 'Medium' ? 'text-yellow-600' : 'text-red-600'}`}
        >
          {varianceLevel}
        </span>
        <span className="text-foreground">
          {' '}
          ({reviewers.length} reviewers tracked)
        </span>
      </p>
    </Card>
  );
}
