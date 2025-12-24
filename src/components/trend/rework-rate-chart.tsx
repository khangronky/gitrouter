'use client';

import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
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

interface ReworkData {
  week: string;
  percentage: number;
}

const reworkRateConfig = {
  percentage: {
    label: 'Rework %',
    color: '#f97316',
  },
} satisfies ChartConfig;

async function fetchReworkData(
  timeRange: TrendChartProps['timeRange'],
  organizationId: string
): Promise<ReworkData[]> {
  await verifyOrgAccess(organizationId);

  const supabase = createClient();
  const startDate = getDateRangeFromTimeRange(timeRange);
  const numWeeks = getWeeksFromTimeRange(timeRange);
  const repoIds = await getOrgRepositoryIds(organizationId);

  if (repoIds.length === 0) {
    return Array(numWeeks)
      .fill(null)
      .map((_, i) => ({ week: getWeekLabel(i), percentage: 0 }));
  }

  // Get PRs with their review assignments to identify rework
  // Rework = PR has more than one review cycle (changes_requested followed by another review)
  const { data: assignments } = await supabase
    .from('review_assignments')
    .select(
      `
      id,
      status,
      assigned_at,
      pull_request_id,
      pull_request:pull_requests!inner (
        id,
        repository_id,
        created_at
      )
    `
    )
    .in('pull_request.repository_id', repoIds)
    .gte('assigned_at', startDate.toISOString());

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const startTime = startDate.getTime();

  // Group assignments by PR and week
  const prAssignmentsByWeek: Map<number, Map<string, Set<string>>> = new Map();

  if (assignments) {
    for (const assignment of assignments) {
      const assignedAt = new Date(assignment.assigned_at);
      const weekIndex = Math.floor(
        (assignedAt.getTime() - startTime) / msPerWeek
      );

      if (weekIndex >= 0 && weekIndex < numWeeks) {
        if (!prAssignmentsByWeek.has(weekIndex)) {
          prAssignmentsByWeek.set(weekIndex, new Map());
        }
        const weekMap = prAssignmentsByWeek.get(weekIndex)!;
        if (!weekMap.has(assignment.pull_request_id)) {
          weekMap.set(assignment.pull_request_id, new Set());
        }
        weekMap.get(assignment.pull_request_id)!.add(assignment.status);
      }
    }
  }

  // Calculate rework rate per week
  // A PR has rework if it has 'changes_requested' status
  const weeklyReworkCount: number[] = Array(numWeeks).fill(0);
  const weeklyTotalCount: number[] = Array(numWeeks).fill(0);

  for (const [weekIndex, prMap] of prAssignmentsByWeek) {
    for (const [_, statuses] of prMap) {
      weeklyTotalCount[weekIndex]++;
      if (statuses.has('changes_requested')) {
        weeklyReworkCount[weekIndex]++;
      }
    }
  }

  return Array(numWeeks)
    .fill(null)
    .map((_, i) => ({
      week: getWeekLabel(i),
      percentage:
        weeklyTotalCount[i] > 0
          ? Math.round((weeklyReworkCount[i] / weeklyTotalCount[i]) * 100)
          : 0,
    }));
}

export function ReworkRateChart({
  timeRange,
  organizationId,
}: TrendChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['rework-rate-chart', timeRange, organizationId],
    queryFn: () => fetchReworkData(timeRange, organizationId),
    enabled: !!organizationId,
  });

  if (isLoading || !data) {
    return <TrendChartSkeleton chartType="area" />;
  }

  // Calculate reduction
  const nonZeroValues = data.filter((d) => d.percentage > 0);
  const firstValue = nonZeroValues.length > 0 ? nonZeroValues[0].percentage : 0;
  const lastValue =
    nonZeroValues.length > 0
      ? nonZeroValues[nonZeroValues.length - 1].percentage
      : 0;
  const reduction =
    firstValue > 0
      ? Math.round(((firstValue - lastValue) / firstValue) * 100)
      : 0;

  return (
    <Card className="flex flex-col p-4 transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <CardTitle>Rework Rate Trend</CardTitle>
        <CardDescription>
          Percentage of PRs requiring multiple review cycles
        </CardDescription>
      </div>
      <ChartContainer
        config={reworkRateConfig}
        className="h-[200px] w-full flex-1"
      >
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, bottom: 0, left: -20 }}
        >
          <defs>
            <linearGradient id="reworkGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--color-percentage)"
                stopOpacity={0.4}
              />
              <stop
                offset="100%"
                stopColor="var(--color-percentage)"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
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
            tickFormatter={(value) => `${value}%`}
            className="text-muted-foreground text-xs"
          />
          <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
          <Area
            type="monotone"
            dataKey="percentage"
            stroke="var(--color-percentage)"
            strokeWidth={2}
            fill="url(#reworkGradient)"
          />
        </AreaChart>
      </ChartContainer>
      <p className="mt-4 text-muted-foreground text-sm">
        Rework rate:{' '}
        {reduction > 0 ? (
          <>
            <span className="font-medium text-green-600">
              {reduction}% reduction
            </span>
            <span className="text-foreground">
              {' '}
              ({firstValue}% → {lastValue}%)
            </span>
          </>
        ) : reduction < 0 ? (
          <>
            <span className="font-medium text-red-600">
              {Math.abs(reduction)}% increase
            </span>
            <span className="text-foreground">
              {' '}
              ({firstValue}% → {lastValue}%)
            </span>
          </>
        ) : (
          <span className="text-foreground">Stable at {lastValue}%</span>
        )}
      </p>
    </Card>
  );
}
