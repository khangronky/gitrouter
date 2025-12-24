'use client';

import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
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
  calculateBottleneckFrequency,
  getDateRangeFromTimeRange,
  getOrgRepositoryIds,
  type PerformanceChartProps,
  verifyOrgAccess,
} from './utils';

interface BottleneckData {
  reviewer: string;
  frequency: number;
}

const bottleneckConfig = {
  frequency: {
    label: 'Bottleneck Count',
    color: '#ef4444',
  },
} satisfies ChartConfig;

async function fetchBottleneckData(
  timeRange: PerformanceChartProps['timeRange'],
  organizationId: string
): Promise<BottleneckData[]> {
  await verifyOrgAccess(organizationId);

  const supabase = createClient();
  const startDate = getDateRangeFromTimeRange(timeRange);
  const repoIds = await getOrgRepositoryIds(organizationId);

  if (repoIds.length === 0) {
    return [];
  }

  // Get all review assignments with PR info
  const { data: assignments } = await supabase
    .from('review_assignments')
    .select(
      `
      id,
      reviewer_id,
      assigned_at,
      reviewed_at,
      pull_request_id,
      pull_request:pull_requests!inner (
        repository_id
      )
    `
    )
    .in('pull_request.repository_id', repoIds)
    .gte('assigned_at', startDate.toISOString())
    .not('reviewed_at', 'is', null);

  if (!assignments || assignments.length === 0) {
    return [];
  }

  // Calculate bottleneck frequency
  const frequencyMap = calculateBottleneckFrequency(
    assignments.map((a) => ({
      reviewer_id: a.reviewer_id,
      assigned_at: a.assigned_at,
      reviewed_at: a.reviewed_at,
      pull_request_id: a.pull_request_id,
    }))
  );

  // Get reviewer names
  const reviewerIds = Object.keys(frequencyMap);
  const { data: reviewers } = await supabase
    .from('reviewers')
    .select(
      `
      id,
      user:users (
        github_username,
        full_name
      )
    `
    )
    .in('id', reviewerIds);

  const reviewerMap = new Map<string, string>();
  reviewers?.forEach((r) => {
    const user = r.user as any;
    const name = user?.github_username || user?.full_name || 'Unknown';
    reviewerMap.set(r.id, name);
  });

  // Format data
  const data: BottleneckData[] = Object.entries(frequencyMap)
    .map(([reviewerId, frequency]) => ({
      reviewer: reviewerMap.get(reviewerId) || 'Unknown',
      frequency,
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 8); // Top 8

  return data;
}

export function BottleneckChart({
  timeRange,
  organizationId,
}: PerformanceChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['bottleneck-chart', timeRange, organizationId],
    queryFn: () => fetchBottleneckData(timeRange, organizationId),
    enabled: !!organizationId,
  });

  if (isLoading || !data) {
    return <PerformanceChartSkeleton chartType="bar" />;
  }

  if (data.length === 0) {
    return (
      <Card className="flex flex-col p-4 transition-all duration-200">
        <div className="flex flex-col gap-1">
          <CardTitle>Bottleneck Frequency</CardTitle>
          <CardDescription>
            How often each reviewer becomes a bottleneck
          </CardDescription>
        </div>
        <p className="mt-4 text-muted-foreground text-sm">
          No bottleneck data available for this period.
        </p>
      </Card>
    );
  }

  const highest = data[0];
  const lowest = data[data.length - 1];

  return (
    <Card className="flex flex-col p-4 transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <CardTitle>Bottleneck Frequency</CardTitle>
        <CardDescription>
          How often each reviewer becomes a bottleneck
        </CardDescription>
      </div>
      <ChartContainer
        config={bottleneckConfig}
        className="h-[200px] w-full flex-1"
      >
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, bottom: 0, left: -20 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="var(--border)"
          />
          <XAxis
            dataKey="reviewer"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            className="text-xs"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            className="text-xs"
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar
            dataKey="frequency"
            fill="var(--color-frequency)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ChartContainer>
      <p className="mt-4 text-muted-foreground text-sm">
        Highest risk:{' '}
        <span className="font-medium text-red-600">
          {highest.reviewer} ({highest.frequency} times)
        </span>
        {' | '}
        Lowest:{' '}
        <span className="font-medium text-green-600">
          {lowest.reviewer} ({lowest.frequency} times)
        </span>
      </p>
    </Card>
  );
}
