'use client';

import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Legend, XAxis, YAxis } from 'recharts';
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

interface PrSizeByAuthorData {
  author: string;
  small: number;
  medium: number;
  large: number;
}

const prSizeConfig = {
  small: {
    label: 'Small',
    color: '#22c55e',
  },
  medium: {
    label: 'Medium',
    color: '#f59e0b',
  },
  large: {
    label: 'Large',
    color: '#ef4444',
  },
} satisfies ChartConfig;

async function fetchPrSizeByAuthorData(
  timeRange: PerformanceChartProps['timeRange'],
  organizationId: string
): Promise<PrSizeByAuthorData[]> {
  await verifyOrgAccess(organizationId);

  const supabase = createClient();
  const startDate = getDateRangeFromTimeRange(timeRange);
  const repoIds = await getOrgRepositoryIds(organizationId);

  if (repoIds.length === 0) {
    return [];
  }

  // Get PRs with author and size info
  const { data: prs } = await supabase
    .from('pull_requests')
    .select('id, author_login, additions, deletions')
    .in('repository_id', repoIds)
    .gte('created_at', startDate.toISOString());

  if (!prs || prs.length === 0) {
    return [];
  }

  // Group by author
  const authorStats: Record<
    string,
    { small: number; medium: number; large: number }
  > = {};

  prs.forEach((pr) => {
    const author = pr.author_login || 'Unknown';
    if (!authorStats[author]) {
      authorStats[author] = { small: 0, medium: 0, large: 0 };
    }

    const size = (pr.additions || 0) + (pr.deletions || 0);
    if (size < 100) {
      authorStats[author].small++;
    } else if (size <= 500) {
      authorStats[author].medium++;
    } else {
      authorStats[author].large++;
    }
  });

  // Format data
  const data: PrSizeByAuthorData[] = Object.entries(authorStats)
    .map(([author, stats]) => ({
      author: author.startsWith('@') ? author : `@${author}`,
      small: stats.small,
      medium: stats.medium,
      large: stats.large,
    }))
    .sort((a, b) => {
      const totalA = a.small + a.medium + a.large;
      const totalB = b.small + b.medium + b.large;
      return totalB - totalA;
    })
    .slice(0, 8); // Top 8 authors

  return data;
}

export function PrSizeByAuthorChart({
  timeRange,
  organizationId,
}: PerformanceChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['pr-size-by-author-chart', timeRange, organizationId],
    queryFn: () => fetchPrSizeByAuthorData(timeRange, organizationId),
    enabled: !!organizationId,
  });

  if (isLoading || !data) {
    return <PerformanceChartSkeleton chartType="bar" />;
  }

  if (data.length === 0) {
    return (
      <Card className="flex flex-col p-4 transition-all duration-200">
        <div className="flex flex-col gap-1">
          <CardTitle>PR Size by Author</CardTitle>
          <CardDescription>
            Distribution of PR sizes (small/medium/large) by author
          </CardDescription>
        </div>
        <p className="mt-4 text-muted-foreground text-sm">
          No PR data available for this period.
        </p>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col p-4 transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <CardTitle>PR Size by Author</CardTitle>
        <CardDescription>
          Distribution of PR sizes (small/medium/large) by author
        </CardDescription>
      </div>
      <ChartContainer
        config={prSizeConfig}
        className="mt-4 h-[220px] w-full flex-1"
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
            dataKey="author"
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
          <Legend />
          <Bar
            dataKey="small"
            stackId="a"
            fill="var(--color-small)"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="medium"
            stackId="a"
            fill="var(--color-medium)"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="large"
            stackId="a"
            fill="var(--color-large)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ChartContainer>
    </Card>
  );
}
