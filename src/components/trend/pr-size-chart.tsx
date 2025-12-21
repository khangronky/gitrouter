'use client';

import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
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

interface PrSizeData {
  week: string;
  small: number;
  medium: number;
  large: number;
}

const prSizeConfig = {
  small: {
    label: 'Small (<100 lines)',
    color: '#22c55e',
  },
  medium: {
    label: 'Medium (100-500)',
    color: '#eab308',
  },
  large: {
    label: 'Large (>500)',
    color: '#ef4444',
  },
} satisfies ChartConfig;

async function fetchPrSizeData(
  timeRange: TrendChartProps['timeRange'],
  organizationId: string
): Promise<PrSizeData[]> {
  await verifyOrgAccess(organizationId);

  const supabase = createClient();
  const startDate = getDateRangeFromTimeRange(timeRange);
  const numWeeks = getWeeksFromTimeRange(timeRange);
  const repoIds = await getOrgRepositoryIds(organizationId);

  if (repoIds.length === 0) {
    return Array(numWeeks)
      .fill(null)
      .map((_, i) => ({
        week: getWeekLabel(i),
        small: 0,
        medium: 0,
        large: 0,
      }));
  }

  // Get PRs with size info
  const { data: prs } = await supabase
    .from('pull_requests')
    .select('id, created_at, additions, deletions')
    .in('repository_id', repoIds)
    .gte('created_at', startDate.toISOString());

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const startTime = startDate.getTime();

  // Initialize weekly data
  const weeklyCounts: { small: number[]; medium: number[]; large: number[] } = {
    small: Array(numWeeks).fill(0),
    medium: Array(numWeeks).fill(0),
    large: Array(numWeeks).fill(0),
  };

  if (prs) {
    for (const pr of prs) {
      const createdAt = new Date(pr.created_at);
      const weekIndex = Math.floor(
        (createdAt.getTime() - startTime) / msPerWeek
      );

      if (weekIndex >= 0 && weekIndex < numWeeks) {
        const totalLines = (pr.additions || 0) + (pr.deletions || 0);

        if (totalLines < 100) {
          weeklyCounts.small[weekIndex]++;
        } else if (totalLines <= 500) {
          weeklyCounts.medium[weekIndex]++;
        } else {
          weeklyCounts.large[weekIndex]++;
        }
      }
    }
  }

  return Array(numWeeks)
    .fill(null)
    .map((_, i) => ({
      week: getWeekLabel(i),
      small: weeklyCounts.small[i],
      medium: weeklyCounts.medium[i],
      large: weeklyCounts.large[i],
    }));
}

export function PrSizeChart({ timeRange, organizationId }: TrendChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['pr-size-chart', timeRange, organizationId],
    queryFn: () => fetchPrSizeData(timeRange, organizationId),
    enabled: !!organizationId,
  });

  if (isLoading || !data) {
    return <TrendChartSkeleton chartType="bar" />;
  }

  // Calculate trend
  const firstWeekSmall = data[0]?.small || 0;
  const lastWeekSmall = data[data.length - 1]?.small || 0;
  const smallTrend = lastWeekSmall > firstWeekSmall;

  return (
    <Card className="flex flex-col p-4 transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <CardTitle>PR Size Distribution Trend</CardTitle>
        <CardDescription>
          Small, medium, and large PRs over time
        </CardDescription>
      </div>
      <ChartContainer config={prSizeConfig} className="h-[200px] w-full flex-1">
        <BarChart
          data={data}
          margin={{ top: 20, right: 10, bottom: 0, left: -20 }}
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
            className="text-muted-foreground text-xs"
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar
            dataKey="small"
            stackId="size"
            fill="var(--color-small)"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="medium"
            stackId="size"
            fill="var(--color-medium)"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="large"
            stackId="size"
            fill="var(--color-large)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ChartContainer>
      <p className="mt-4 text-muted-foreground text-sm">
        Trend:{' '}
        {smallTrend ? (
          <>
            <span className="font-medium text-green-600">More small PRs</span>
            <span className="text-foreground"> (better for reviews)</span>
          </>
        ) : (
          <span className="text-foreground">Stable distribution</span>
        )}
      </p>
    </Card>
  );
}
