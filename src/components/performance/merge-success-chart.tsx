'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { createClient } from '@/lib/supabase/client';
import { PerformanceChartSkeleton } from './performance-skeleton';
import {
  getDateRangeFromTimeRange,
  getOrgRepositoryIds,
  type PerformanceChartProps,
  verifyOrgAccess,
} from './utils';

interface MergeSuccessData {
  repo: string;
  successRate: number;
}

const mergeSuccessConfig = {
  successRate: {
    label: 'Success Rate',
    color: '#22c55e',
  },
} satisfies ChartConfig;

async function fetchMergeSuccessData(
  timeRange: PerformanceChartProps['timeRange'],
  organizationId: string
): Promise<MergeSuccessData[]> {
  await verifyOrgAccess(organizationId);

  const supabase = createClient();
  const startDate = getDateRangeFromTimeRange(timeRange);
  const repoIds = await getOrgRepositoryIds(organizationId);

  if (repoIds.length === 0) {
    return [];
  }

  // Get all PRs in time range
  const { data: prs } = await supabase
    .from('pull_requests')
    .select(
      `
      id,
      repository_id,
      status,
      merged_at,
      repositories (
        full_name
      )
    `
    )
    .in('repository_id', repoIds)
    .gte('created_at', startDate.toISOString());

  if (!prs || prs.length === 0) {
    return [];
  }

  // Group by repository
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

  // Calculate success rates
  const data: MergeSuccessData[] = Object.values(repoStats)
    .map((stats) => ({
      repo: stats.name.split('/').pop() || stats.name,
      successRate: stats.total > 0 ? (stats.merged / stats.total) * 100 : 0,
    }))
    .sort((a, b) => b.successRate - a.successRate)
    .slice(0, 6); // Top 6

  return data;
}

export function MergeSuccessChart({
  timeRange,
  organizationId,
}: PerformanceChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['merge-success-chart', timeRange, organizationId],
    queryFn: () => fetchMergeSuccessData(timeRange, organizationId),
    enabled: !!organizationId,
  });

  if (isLoading || !data) {
    return <PerformanceChartSkeleton chartType="bar" />;
  }

  if (data.length === 0) {
    return (
      <Card className="flex flex-col p-4 transition-all duration-200">
        <div className="flex flex-col gap-1">
          <CardTitle>Merge Success Rate</CardTitle>
          <CardDescription>
            Percentage of PRs successfully merged by repository
          </CardDescription>
        </div>
        <p className="mt-4 text-muted-foreground text-sm">
          No PR data available for this period.
        </p>
      </Card>
    );
  }

  const highest = data[0];
  const lowest = data[data.length - 1];

  return (
    <Card className="flex flex-col p-4 transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <CardTitle>Merge Success Rate</CardTitle>
        <CardDescription>
          Percentage of PRs successfully merged by repository
        </CardDescription>
      </div>
      <ChartContainer
        config={mergeSuccessConfig}
        className="mt-4 h-[220px] w-full flex-1"
      >
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 30, bottom: 0, left: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={true}
            horizontal={false}
            stroke="var(--border)"
          />
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="repo"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width={50}
            className="text-xs"
            hide
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) => (
                  <div className="flex items-center gap-2">
                    <span>Success Rate</span>
                    <span className="font-medium font-mono">{value}%</span>
                  </div>
                )}
              />
            }
          />
          <Bar dataKey="successRate" fill="var(--color-successRate)" radius={4}>
            <LabelList
              dataKey="repo"
              position="insideLeft"
              offset={8}
              className="fill-white"
              fontSize={12}
            />
            <LabelList
              dataKey="successRate"
              position="right"
              offset={8}
              className="fill-foreground"
              fontSize={12}
              formatter={(value: number) => `${Math.round(value)}%`}
            />
          </Bar>
        </BarChart>
      </ChartContainer>
      <p className="mt-4 text-muted-foreground text-sm">
        Highest:{' '}
        <span className="font-medium text-foreground">
          {highest.repo} ({Math.round(highest.successRate)}%)
        </span>
        {' | '}
        Lowest:{' '}
        <span className="font-medium text-foreground">
          {lowest.repo} ({Math.round(lowest.successRate)}%)
        </span>
      </p>
    </Card>
  );
}
