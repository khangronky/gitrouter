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

interface RepoComparisonData {
  repo: string;
  hours: number;
}

const repoComparisonConfig = {
  hours: {
    label: 'Hours',
    color: '#6366f1',
  },
} satisfies ChartConfig;

async function fetchRepoComparisonData(
  timeRange: PerformanceChartProps['timeRange'],
  organizationId: string
): Promise<RepoComparisonData[]> {
  await verifyOrgAccess(organizationId);

  const supabase = createClient();
  const startDate = getDateRangeFromTimeRange(timeRange);
  const repoIds = await getOrgRepositoryIds(organizationId);

  if (repoIds.length === 0) {
    return [];
  }

  // Get review assignments with repository info
  const { data: assignments } = await supabase
    .from('review_assignments')
    .select(
      `
      id,
      assigned_at,
      reviewed_at,
      pull_request:pull_requests!inner (
        repository_id,
        repositories (
          full_name
        )
      )
    `
    )
    .in('pull_request.repository_id', repoIds)
    .gte('assigned_at', startDate.toISOString())
    .not('reviewed_at', 'is', null);

  if (!assignments || assignments.length === 0) {
    return [];
  }

  // Group by repository
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

  // Calculate averages and format
  const data: RepoComparisonData[] = Object.values(repoStats)
    .map((stats) => ({
      repo: stats.name.split('/').pop() || stats.name, // Just repo name, not org/repo
      hours: stats.count > 0 ? stats.totalTime / stats.count : 0,
    }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 6); // Top 6

  return data;
}

export function RepoComparisonChart({
  timeRange,
  organizationId,
}: PerformanceChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['repo-comparison-chart', timeRange, organizationId],
    queryFn: () => fetchRepoComparisonData(timeRange, organizationId),
    enabled: !!organizationId,
  });

  if (isLoading || !data) {
    return <PerformanceChartSkeleton chartType="bar" />;
  }

  if (data.length === 0) {
    return (
      <Card className="flex flex-col p-4 transition-all duration-200">
        <div className="flex flex-col gap-1">
          <CardTitle>Repository Comparison (Avg Review Time)</CardTitle>
          <CardDescription>Average review time by repository</CardDescription>
        </div>
        <p className="mt-4 text-muted-foreground text-sm">
          No review data available for this period.
        </p>
      </Card>
    );
  }

  const slowest = data[0];
  const fastest = data[data.length - 1];

  return (
    <Card className="flex flex-col p-4 transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <CardTitle>Repository Comparison (Avg Review Time)</CardTitle>
        <CardDescription>Average review time by repository</CardDescription>
      </div>
      <ChartContainer
        config={repoComparisonConfig}
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
                    <span>Avg Review Time</span>
                    <span className="font-medium font-mono">{value}h</span>
                  </div>
                )}
              />
            }
          />
          <Bar dataKey="hours" fill="var(--color-hours)" radius={4}>
            <LabelList
              dataKey="repo"
              position="insideLeft"
              offset={8}
              className="fill-white"
              fontSize={12}
            />
            <LabelList
              dataKey="hours"
              position="right"
              offset={8}
              className="fill-foreground"
              fontSize={12}
              formatter={(value: number) => `${value.toFixed(1)}h`}
            />
          </Bar>
        </BarChart>
      </ChartContainer>
      <p className="mt-4 text-muted-foreground text-sm">
        Slowest:{' '}
        <span className="font-medium text-foreground">
          {slowest.repo} ({slowest.hours.toFixed(1)}h avg)
        </span>
        {' | '}
        Fastest:{' '}
        <span className="font-medium text-foreground">
          {fastest.repo} ({fastest.hours.toFixed(1)}h avg)
        </span>
      </p>
    </Card>
  );
}
