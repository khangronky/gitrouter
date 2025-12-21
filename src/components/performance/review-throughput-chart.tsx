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
  getDateRangeFromTimeRange,
  getOrgRepositoryIds,
  type PerformanceChartProps,
  verifyOrgAccess,
} from './utils';

interface ReviewThroughputData {
  day: string;
  reviews: number;
}

const reviewThroughputConfig = {
  reviews: {
    label: 'Reviews',
    color: '#f59e0b',
  },
} satisfies ChartConfig;

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

async function fetchReviewThroughputData(
  timeRange: PerformanceChartProps['timeRange'],
  organizationId: string
): Promise<ReviewThroughputData[]> {
  await verifyOrgAccess(organizationId);

  const supabase = createClient();
  const startDate = getDateRangeFromTimeRange(timeRange);
  const repoIds = await getOrgRepositoryIds(organizationId);

  if (repoIds.length === 0) {
    return dayNames.map((day) => ({ day, reviews: 0 }));
  }

  // Get review assignments
  const { data: assignments } = await supabase
    .from('review_assignments')
    .select(
      `
      id,
      reviewed_at,
      pull_request:pull_requests!inner (
        repository_id
      )
    `
    )
    .in('pull_request.repository_id', repoIds)
    .gte('reviewed_at', startDate.toISOString())
    .not('reviewed_at', 'is', null);

  if (!assignments || assignments.length === 0) {
    return dayNames.map((day) => ({ day, reviews: 0 }));
  }

  // Group by day of week
  const dayCounts: Record<number, number> = {};
  dayNames.forEach((_, i) => {
    dayCounts[i] = 0;
  });

  assignments.forEach((a) => {
    if (!a.reviewed_at) return;
    const dayOfWeek = new Date(a.reviewed_at).getDay();
    dayCounts[dayOfWeek] = (dayCounts[dayOfWeek] || 0) + 1;
  });

  // Calculate average across weeks in time range
  const daysInRange =
    (Date.now() - startDate.getTime()) / (24 * 60 * 60 * 1000);
  const numWeeks = Math.ceil(daysInRange / 7);

  const data: ReviewThroughputData[] = dayNames.map((day, index) => ({
    day,
    reviews: numWeeks > 0 ? Math.round(dayCounts[index] / numWeeks) : 0,
  }));

  return data;
}

export function ReviewThroughputChart({
  timeRange,
  organizationId,
}: PerformanceChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['review-throughput-chart', timeRange, organizationId],
    queryFn: () => fetchReviewThroughputData(timeRange, organizationId),
    enabled: !!organizationId,
  });

  if (isLoading || !data) {
    return <PerformanceChartSkeleton chartType="bar" />;
  }

  if (!data || data.length === 0) {
    return (
      <Card className="flex flex-col p-4 transition-all duration-200">
        <div className="flex flex-col gap-1">
          <CardTitle>Daily Review Throughput</CardTitle>
          <CardDescription>Number of reviews completed per day</CardDescription>
        </div>
        <p className="mt-4 text-muted-foreground text-sm">
          No review data available for this period.
        </p>
      </Card>
    );
  }

  const peakDay = data.reduce((max, d) => (d.reviews > max.reviews ? d : max));
  const weeklyAvg = Math.round(
    data.reduce((sum, d) => sum + d.reviews, 0) / data.length
  );

  return (
    <Card className="flex flex-col p-4 transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <CardTitle>Daily Review Throughput</CardTitle>
        <CardDescription>Number of reviews completed per day</CardDescription>
      </div>
      <ChartContainer
        config={reviewThroughputConfig}
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
            dataKey="day"
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
          <Bar
            dataKey="reviews"
            fill="var(--color-reviews)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ChartContainer>
      <p className="mt-4 text-muted-foreground text-sm">
        Peak day:{' '}
        <span className="font-medium text-foreground">
          {peakDay.day} ({peakDay.reviews} reviews)
        </span>
        {' | '}
        Weekly avg:{' '}
        <span className="font-medium text-foreground">
          {weeklyAvg} reviews/day
        </span>
      </p>
    </Card>
  );
}
