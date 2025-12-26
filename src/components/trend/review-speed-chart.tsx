'use client';

import { useQuery } from '@tanstack/react-query';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
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

interface ReviewSpeedData {
  date: string;
  hours: number;
}

const reviewSpeedConfig = {
  hours: {
    label: 'Hours',
    color: '#2563eb',
  },
} satisfies ChartConfig;

async function fetchReviewSpeedData(
  timeRange: TrendChartProps['timeRange'],
  organizationId: string
): Promise<ReviewSpeedData[]> {
  await verifyOrgAccess(organizationId);

  const supabase = createClient();
  const startDate = getDateRangeFromTimeRange(timeRange);
  const numWeeks = getWeeksFromTimeRange(timeRange);
  const repoIds = await getOrgRepositoryIds(organizationId);

  if (repoIds.length === 0) {
    return Array(numWeeks)
      .fill(null)
      .map((_, i) => ({ date: getWeekLabel(i), hours: 0 }));
  }

  // Get review assignments with PR data
  const { data: assignments } = await supabase
    .from('review_assignments')
    .select(
      `
      id,
      assigned_at,
      reviewed_at,
      pull_request:pull_requests!inner (
        id,
        repository_id
      )
    `
    )
    .in('pull_request.repository_id', repoIds)
    .not('reviewed_at', 'is', null)
    .gte('assigned_at', startDate.toISOString());

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const startTime = startDate.getTime();

  // Initialize weekly data
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

export function ReviewSpeedChart({
  timeRange,
  organizationId,
}: TrendChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['review-speed-chart', timeRange, organizationId],
    queryFn: () => fetchReviewSpeedData(timeRange, organizationId),
    enabled: !!organizationId,
  });

  const timeRangeLabel =
    timeRange === '6w'
      ? '6 weeks'
      : timeRange === '12w'
        ? '12 weeks'
        : '6 months';

  if (isLoading || !data) {
    return <TrendChartSkeleton chartType="line" />;
  }

  // Calculate trend
  const nonZeroValues = data.filter((d) => d.hours > 0);
  const firstValue = nonZeroValues.length > 0 ? nonZeroValues[0].hours : 0;
  const lastValue =
    nonZeroValues.length > 0
      ? nonZeroValues[nonZeroValues.length - 1].hours
      : 0;
  const isImproving = lastValue < firstValue;
  const maxHours = Math.max(...data.map((d) => d.hours), 1);

  return (
    <Card className="flex flex-col p-4 transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <CardTitle>PR Review Speed Trend</CardTitle>
        <CardDescription>
          Average review speed over the past {timeRangeLabel}
        </CardDescription>
      </div>
      <ChartContainer
        config={reviewSpeedConfig}
        className="h-[200px] w-full flex-1"
      >
        <LineChart
          data={data}
          margin={{ top: 10, right: 10, bottom: 0, left: -20 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="var(--border)"
          />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            className="text-muted-foreground text-xs"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => `${value}h`}
            className="text-muted-foreground text-xs"
            domain={[0, Math.ceil(maxHours)]}
          />
          <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
          <Line
            type="monotone"
            dataKey="hours"
            stroke="var(--color-hours)"
            strokeWidth={2}
            dot={{
              fill: 'var(--color-hours)',
              stroke: 'var(--card)',
              strokeWidth: 2,
              r: 4,
            }}
            activeDot={{
              fill: 'var(--color-hours)',
              stroke: 'var(--card)',
              strokeWidth: 2,
              r: 6,
            }}
          />
        </LineChart>
      </ChartContainer>
      <p className="mt-4 flex items-center gap-1 text-muted-foreground text-sm">
        Current Trend:{' '}
        {isImproving ? (
          <>
            <TrendingDown className="h-4 w-4 text-green-600" />
            <span className="font-medium text-green-600">Improving</span>
          </>
        ) : (
          <>
            <TrendingUp className="h-4 w-4 text-red-600" />
            <span className="font-medium text-red-600">Needs Attention</span>
          </>
        )}
        {firstValue > 0 && lastValue > 0 && (
          <span className="text-foreground">
            (avg {firstValue}h → {lastValue}h)
          </span>
        )}
      </p>
    </Card>
  );
}
