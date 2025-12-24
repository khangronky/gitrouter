'use client';

import { useQuery } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';
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

interface FirstResponseData {
  week: string;
  minutes: number;
}

const firstResponseConfig = {
  minutes: {
    label: 'Minutes',
    color: '#14b8a6',
  },
} satisfies ChartConfig;

// Target first response time in minutes
const TARGET_MINUTES = 30;

async function fetchFirstResponseData(
  timeRange: TrendChartProps['timeRange'],
  organizationId: string
): Promise<FirstResponseData[]> {
  await verifyOrgAccess(organizationId);

  const supabase = createClient();
  const startDate = getDateRangeFromTimeRange(timeRange);
  const numWeeks = getWeeksFromTimeRange(timeRange);
  const repoIds = await getOrgRepositoryIds(organizationId);

  if (repoIds.length === 0) {
    return Array(numWeeks)
      .fill(null)
      .map((_, i) => ({ week: getWeekLabel(i), minutes: 0 }));
  }

  // Get review assignments with PR data - first response is time to first review action
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
  const weeklyTotalMinutes: number[] = Array(numWeeks).fill(0);
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
          const minutesToRespond =
            (reviewedAt.getTime() - assignedAt.getTime()) / (1000 * 60);
          weeklyTotalMinutes[weekIndex] += minutesToRespond;
          weeklyCounts[weekIndex]++;
        }
      }
    }
  }

  return Array(numWeeks)
    .fill(null)
    .map((_, i) => ({
      week: getWeekLabel(i),
      minutes:
        weeklyCounts[i] > 0
          ? Math.round(weeklyTotalMinutes[i] / weeklyCounts[i])
          : 0,
    }));
}

export function FirstResponseChart({
  timeRange,
  organizationId,
}: TrendChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['first-response-chart', timeRange, organizationId],
    queryFn: () => fetchFirstResponseData(timeRange, organizationId),
    enabled: !!organizationId,
  });

  if (isLoading || !data) {
    return <TrendChartSkeleton chartType="line" />;
  }

  // Get current value
  const nonZeroValues = data.filter((d) => d.minutes > 0);
  const currentValue =
    nonZeroValues.length > 0
      ? nonZeroValues[nonZeroValues.length - 1].minutes
      : 0;
  const meetingTarget = currentValue <= TARGET_MINUTES && currentValue > 0;
  const maxMinutes = Math.max(...data.map((d) => d.minutes), TARGET_MINUTES);

  return (
    <Card className="flex flex-col p-4 transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <CardTitle>First Response Time Trend</CardTitle>
        <CardDescription>
          Average time until first reviewer action
        </CardDescription>
      </div>
      <ChartContainer
        config={firstResponseConfig}
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
            tickFormatter={(value) => `${value}m`}
            className="text-muted-foreground text-xs"
            domain={[0, Math.ceil(maxMinutes)]}
          />
          <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
          <Line
            type="monotone"
            dataKey="minutes"
            stroke="var(--color-minutes)"
            strokeWidth={2}
            dot={{
              fill: 'var(--color-minutes)',
              stroke: 'var(--card)',
              strokeWidth: 2,
              r: 4,
            }}
          />
        </LineChart>
      </ChartContainer>
      <p className="mt-4 text-muted-foreground text-sm">
        Target: {TARGET_MINUTES} min → Current:{' '}
        {currentValue > 0 ? (
          <>
            <span
              className={`font-medium ${meetingTarget ? 'text-green-600' : 'text-red-600'}`}
            >
              {currentValue} min
            </span>
            {meetingTarget ? (
              <Check className="ml-1 inline h-4 w-4 text-green-600" />
            ) : (
              <X className="ml-1 inline h-4 w-4 text-red-600" />
            )}
          </>
        ) : (
          <span className="text-muted-foreground">No data</span>
        )}
      </p>
    </Card>
  );
}
