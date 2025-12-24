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

interface ResponseByHourData {
  hour: string;
  hours: number;
}

const responseByHourConfig = {
  hours: {
    label: 'Response Time (hours)',
    color: '#8b5cf6',
  },
} satisfies ChartConfig;

async function fetchResponseByHourData(
  timeRange: PerformanceChartProps['timeRange'],
  organizationId: string
): Promise<ResponseByHourData[]> {
  await verifyOrgAccess(organizationId);

  const supabase = createClient();
  const startDate = getDateRangeFromTimeRange(timeRange);
  const repoIds = await getOrgRepositoryIds(organizationId);

  if (repoIds.length === 0) {
    return Array.from({ length: 9 }, (_, i) => ({
      hour: `${9 + i}:00`,
      hours: 0,
    }));
  }

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
    return Array.from({ length: 9 }, (_, i) => ({
      hour: `${9 + i}:00`,
      hours: 0,
    }));
  }

  // Group by hour (business hours 9am-5pm)
  const hourStats: Record<number, number[]> = {};

  assignments.forEach((a) => {
    if (!a.reviewed_at) return;
    const assignedHour = new Date(a.assigned_at).getHours();
    // Only include business hours (9-17)
    if (assignedHour >= 9 && assignedHour < 18) {
      if (!hourStats[assignedHour]) {
        hourStats[assignedHour] = [];
      }
      const responseHours =
        (new Date(a.reviewed_at).getTime() -
          new Date(a.assigned_at).getTime()) /
        3600000;
      hourStats[assignedHour].push(responseHours);
    }
  });

  // Calculate averages
  const data: ResponseByHourData[] = Array.from({ length: 9 }, (_, i) => {
    const hour = 9 + i;
    const times = hourStats[hour] || [];
    const avgHours =
      times.length > 0
        ? times.reduce((sum, t) => sum + t, 0) / times.length
        : 0;
    return {
      hour: `${hour}:00`,
      hours: avgHours,
    };
  });

  return data;
}

export function ResponseByHourChart({
  timeRange,
  organizationId,
}: PerformanceChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['response-by-hour-chart', timeRange, organizationId],
    queryFn: () => fetchResponseByHourData(timeRange, organizationId),
    enabled: !!organizationId,
  });

  if (isLoading || !data) {
    return <PerformanceChartSkeleton chartType="bar" />;
  }

  if (!data || data.length === 0) {
    return (
      <Card className="flex flex-col p-4 transition-all duration-200">
        <div className="flex flex-col gap-1">
          <CardTitle>Response Time by Hour</CardTitle>
          <CardDescription>
            Average response time grouped by hour of day (business hours)
          </CardDescription>
        </div>
        <p className="mt-4 text-muted-foreground text-sm">
          No review data available for this period.
        </p>
      </Card>
    );
  }

  const fastestHour = data.reduce((min, d) => (d.hours < min.hours ? d : min));
  const slowestHour = data.reduce((max, d) => (d.hours > max.hours ? d : max));

  return (
    <Card className="flex flex-col p-4 transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <CardTitle>Response Time by Hour</CardTitle>
        <CardDescription>
          Average response time grouped by hour of day (business hours)
        </CardDescription>
      </div>
      <ChartContainer
        config={responseByHourConfig}
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
            dataKey="hour"
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
            dataKey="hours"
            fill="var(--color-hours)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ChartContainer>
      <p className="mt-4 text-muted-foreground text-sm">
        Fastest:{' '}
        <span className="font-medium text-foreground">
          {fastestHour.hour} ({fastestHour.hours.toFixed(1)}h avg)
        </span>
        {' | '}
        Slowest:{' '}
        <span className="font-medium text-foreground">
          {slowestHour.hour} ({slowestHour.hours.toFixed(1)}h avg)
        </span>
      </p>
    </Card>
  );
}
