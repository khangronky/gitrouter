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
  type TrendChartProps,
  verifyOrgAccess,
} from './utils';

interface PrVolumeData {
  date: string;
  count: number;
}

const prVolumeConfig = {
  count: {
    label: 'PR Count',
    color: '#8b5cf6',
  },
} satisfies ChartConfig;

async function fetchPrVolumeData(
  timeRange: TrendChartProps['timeRange'],
  organizationId: string
): Promise<PrVolumeData[]> {
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
    .select('id, created_at')
    .in('repository_id', repoIds)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true });

  if (!prs || prs.length === 0) {
    return [];
  }

  // Group by day
  const dailyCounts: Record<string, number> = {};

  for (const pr of prs) {
    const date = new Date(pr.created_at);
    const dateKey = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + 1;
  }

  // Convert to array
  return Object.entries(dailyCounts).map(([date, count]) => ({
    date,
    count,
  }));
}

export function PrVolumeChart({ timeRange, organizationId }: TrendChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['pr-volume-chart', timeRange, organizationId],
    queryFn: () => fetchPrVolumeData(timeRange, organizationId),
    enabled: !!organizationId,
  });

  const timeRangeLabel =
    timeRange === '6w'
      ? '6 weeks'
      : timeRange === '12w'
        ? '12 weeks'
        : '6 months';

  if (isLoading || !data) {
    return <TrendChartSkeleton chartType="area" />;
  }

  // Calculate stats
  const totalPRs = data.reduce((sum, d) => sum + d.count, 0);
  const avgPerDay = data.length > 0 ? Math.round(totalPRs / data.length) : 0;
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <Card className="flex flex-col p-4 transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <CardTitle>PR Volume Trend</CardTitle>
        <CardDescription>
          Total number of pull requests created daily
        </CardDescription>
      </div>
      <ChartContainer
        config={prVolumeConfig}
        className="h-[200px] w-full flex-1"
      >
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, bottom: 0, left: -20 }}
        >
          <defs>
            <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--color-count)"
                stopOpacity={0.4}
              />
              <stop
                offset="100%"
                stopColor="var(--color-count)"
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
            className="text-muted-foreground text-xs"
            domain={[0, Math.ceil(maxCount * 1.1)]}
          />
          <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
          <Area
            type="monotone"
            dataKey="count"
            stroke="var(--color-count)"
            strokeWidth={2}
            fill="url(#volumeGradient)"
          />
        </AreaChart>
      </ChartContainer>
      <p className="mt-4 text-muted-foreground text-sm">
        Average PRs/day:{' '}
        <span className="font-medium text-foreground">{avgPerDay}</span>
        {' | '}
        Total in {timeRangeLabel}:{' '}
        <span className="font-medium text-foreground">{totalPRs}</span>
      </p>
    </Card>
  );
}
