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
import { PerformanceChartSkeleton } from './performance-skeleton';
import {
  getDateRangeFromTimeRange,
  getOrgRepositoryIds,
  getTimeRangeInDays,
  type PerformanceChartProps,
  verifyOrgAccess,
} from './utils';

interface TeamSpeedData {
  period: string;
  hours: number;
}

const teamSpeedConfig = {
  hours: {
    label: 'Hours',
    color: '#2563eb',
  },
} satisfies ChartConfig;

async function fetchTeamSpeedData(
  timeRange: PerformanceChartProps['timeRange'],
  organizationId: string
): Promise<TeamSpeedData[]> {
  await verifyOrgAccess(organizationId);

  const supabase = createClient();
  const startDate = getDateRangeFromTimeRange(timeRange);
  const daysInRange = getTimeRangeInDays(timeRange);
  const repoIds = await getOrgRepositoryIds(organizationId);

  if (repoIds.length === 0) {
    return [];
  }

  // Determine grouping: days for 7d/30d, weeks for 3m
  const useWeeks = timeRange === '3m';
  const numPeriods = useWeeks ? Math.ceil(daysInRange / 7) : daysInRange;

  // Get review assignments
  const { data: assignments } = await supabase
    .from('review_assignments')
    .select(
      `
      id,
      assigned_at,
      reviewed_at,
      pull_request:pull_requests!inner (
        repository_id
      )
    `
    )
    .in('pull_request.repository_id', repoIds)
    .gte('assigned_at', startDate.toISOString())
    .not('reviewed_at', 'is', null);

  if (!assignments || assignments.length === 0) {
    return Array(numPeriods)
      .fill(null)
      .map((_, i) => ({
        period: useWeeks ? `Week ${i + 1}` : `Day ${i + 1}`,
        hours: 0,
      }));
  }

  // Group by period
  const periodStats: Record<number, number[]> = {};
  const msPerPeriod = useWeeks ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  const startTime = startDate.getTime();

  assignments.forEach((a) => {
    if (!a.reviewed_at) return;
    const periodIndex = Math.floor(
      (new Date(a.assigned_at).getTime() - startTime) / msPerPeriod
    );
    if (periodIndex >= 0 && periodIndex < numPeriods) {
      if (!periodStats[periodIndex]) {
        periodStats[periodIndex] = [];
      }
      const hours =
        (new Date(a.reviewed_at).getTime() -
          new Date(a.assigned_at).getTime()) /
        3600000;
      periodStats[periodIndex].push(hours);
    }
  });

  // Calculate averages
  const data: TeamSpeedData[] = Array.from({ length: numPeriods }, (_, i) => {
    const times = periodStats[i] || [];
    const avgHours =
      times.length > 0
        ? times.reduce((sum, t) => sum + t, 0) / times.length
        : 0;
    return {
      period: useWeeks ? `W${i + 1}` : `D${i + 1}`,
      hours: avgHours,
    };
  });

  return data;
}

export function TeamSpeedChart({
  timeRange,
  organizationId,
}: PerformanceChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['team-speed-chart', timeRange, organizationId],
    queryFn: () => fetchTeamSpeedData(timeRange, organizationId),
    enabled: !!organizationId,
  });

  if (isLoading || !data) {
    return <PerformanceChartSkeleton chartType="line" />;
  }

  if (data.length === 0) {
    return (
      <Card className="flex flex-col p-4 transition-all duration-200">
        <div className="flex flex-col gap-1">
          <CardTitle>Team Review Speed Trend</CardTitle>
          <CardDescription>Average team review time over time</CardDescription>
        </div>
        <p className="mt-4 text-muted-foreground text-sm">
          No review data available for this period.
        </p>
      </Card>
    );
  }

  // Calculate trend
  const firstHalf = data.slice(0, Math.floor(data.length / 2));
  const secondHalf = data.slice(Math.floor(data.length / 2));
  const firstAvg =
    firstHalf.reduce((sum, d) => sum + d.hours, 0) / firstHalf.length;
  const secondAvg =
    secondHalf.reduce((sum, d) => sum + d.hours, 0) / secondHalf.length;
  const trend = secondAvg < firstAvg ? 'improving' : 'declining';

  return (
    <Card className="flex flex-col p-4 transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <CardTitle>Team Review Speed Trend</CardTitle>
        <CardDescription>Average team review time over time</CardDescription>
      </div>
      <ChartContainer
        config={teamSpeedConfig}
        className="mt-4 h-[200px] w-full flex-1"
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
            dataKey="period"
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
          <Line
            type="monotone"
            dataKey="hours"
            stroke="var(--color-hours)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartContainer>
      <p className="mt-4 text-muted-foreground text-sm">
        Trend:{' '}
        <span
          className={`font-medium ${
            trend === 'improving' ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {trend === 'improving' ? 'Improving' : 'Declining'}
        </span>
        <span className="text-foreground">
          {' '}
          ({firstAvg.toFixed(1)}h → {secondAvg.toFixed(1)}h)
        </span>
      </p>
    </Card>
  );
}
