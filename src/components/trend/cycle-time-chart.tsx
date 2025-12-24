'use client';

import { useQuery } from '@tanstack/react-query';
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

interface CycleTimeData {
  week: string;
  hours: number;
}

const cycleTimeConfig = {
  hours: {
    label: 'Hours',
    color: '#0ea5e9',
  },
} satisfies ChartConfig;

async function fetchCycleTimeData(
  timeRange: TrendChartProps['timeRange'],
  organizationId: string
): Promise<CycleTimeData[]> {
  await verifyOrgAccess(organizationId);

  const supabase = createClient();
  const startDate = getDateRangeFromTimeRange(timeRange);
  const numWeeks = getWeeksFromTimeRange(timeRange);
  const repoIds = await getOrgRepositoryIds(organizationId);

  if (repoIds.length === 0) {
    return Array(numWeeks)
      .fill(null)
      .map((_, i) => ({ week: getWeekLabel(i), hours: 0 }));
  }

  // Get merged PRs
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
  const weeklyTotalHours: number[] = Array(numWeeks).fill(0);
  const weeklyCounts: number[] = Array(numWeeks).fill(0);

  if (mergedPRs) {
    for (const pr of mergedPRs) {
      if (pr.merged_at && pr.created_at) {
        const mergedAt = new Date(pr.merged_at);
        const createdAt = new Date(pr.created_at);
        const weekIndex = Math.floor(
          (mergedAt.getTime() - startTime) / msPerWeek
        );

        if (weekIndex >= 0 && weekIndex < numWeeks) {
          const cycleHours =
            (mergedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
          weeklyTotalHours[weekIndex] += cycleHours;
          weeklyCounts[weekIndex]++;
        }
      }
    }
  }

  return Array(numWeeks)
    .fill(null)
    .map((_, i) => ({
      week: getWeekLabel(i),
      hours:
        weeklyCounts[i] > 0
          ? Math.round((weeklyTotalHours[i] / weeklyCounts[i]) * 10) / 10
          : 0,
    }));
}

export function CycleTimeChart({ timeRange, organizationId }: TrendChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['cycle-time-chart', timeRange, organizationId],
    queryFn: () => fetchCycleTimeData(timeRange, organizationId),
    enabled: !!organizationId,
  });

  if (isLoading || !data) {
    return <TrendChartSkeleton chartType="line" />;
  }

  // Calculate improvement
  const nonZeroValues = data.filter((d) => d.hours > 0);
  const firstValue = nonZeroValues.length > 0 ? nonZeroValues[0].hours : 0;
  const lastValue =
    nonZeroValues.length > 0
      ? nonZeroValues[nonZeroValues.length - 1].hours
      : 0;
  const improvement =
    firstValue > 0
      ? Math.round(((firstValue - lastValue) / firstValue) * 100)
      : 0;
  const maxHours = Math.max(...data.map((d) => d.hours), 1);

  return (
    <Card className="flex flex-col p-4 transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <CardTitle>Review Cycle Time Trend</CardTitle>
        <CardDescription>
          Average time from PR creation to merge
        </CardDescription>
      </div>
      <ChartContainer
        config={cycleTimeConfig}
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
          />
        </LineChart>
      </ChartContainer>
      <p className="mt-4 text-muted-foreground text-sm">
        {improvement > 0 ? (
          <>
            Improvement:{' '}
            <span className="font-medium text-green-600">
              {improvement}% faster
            </span>
          </>
        ) : improvement < 0 ? (
          <>
            Change:{' '}
            <span className="font-medium text-red-600">
              {Math.abs(improvement)}% slower
            </span>
          </>
        ) : (
          <span>No change in cycle time</span>
        )}
        {firstValue > 0 && lastValue > 0 && (
          <span className="text-foreground">
            {' '}
            ({firstValue}h → {lastValue}h)
          </span>
        )}
      </p>
    </Card>
  );
}
