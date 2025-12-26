'use client';

import { Area, AreaChart, CartesianGrid, Legend, XAxis, YAxis } from 'recharts';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { TrendChartSkeleton } from './trend-skeleton';
import type { WorkloadBalanceData } from '@/lib/schema/trend';

interface WorkloadBalanceChartProps {
  data?: WorkloadBalanceData[];
}

// Color palette for reviewers
const REVIEWER_COLORS = [
  '#3b82f6',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
];

export function WorkloadBalanceChart({ data }: WorkloadBalanceChartProps) {
  if (!data) {
    return <TrendChartSkeleton chartType="area" />;
  }

  if (data.length === 0) {
    return (
      <Card className="flex flex-col p-4 transition-all duration-200">
        <div className="flex flex-col gap-1">
          <CardTitle>Workload Balance Trend</CardTitle>
          <CardDescription>
            Review distribution across team members
          </CardDescription>
        </div>
        <p className="mt-4 text-muted-foreground text-sm">
          No workload data available for this period.
        </p>
      </Card>
    );
  }

  // Extract unique reviewers from the data
  const reviewers = new Set<string>();
  data.forEach((week) => {
    Object.keys(week).forEach((key) => {
      if (key !== 'week') reviewers.add(key);
    });
  });
  const reviewerList = Array.from(reviewers);

  // Build chart config dynamically
  const chartConfig: ChartConfig = {};
  reviewerList.forEach((reviewer, index) => {
    chartConfig[reviewer] = {
      label: reviewer,
      color: REVIEWER_COLORS[index % REVIEWER_COLORS.length],
    };
  });

  // Calculate totals
  const totals: Record<string, number> = {};
  data.forEach((week) => {
    reviewerList.forEach((reviewer) => {
      const count = week[reviewer];
      if (typeof count === 'number') {
        totals[reviewer] = (totals[reviewer] || 0) + count;
      }
    });
  });
  const sortedReviewers = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <Card className="flex flex-col p-4 transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <CardTitle>Workload Balance Trend</CardTitle>
        <CardDescription>
          Review distribution across team members
        </CardDescription>
      </div>
      <ChartContainer config={chartConfig} className="h-[200px] w-full flex-1">
        <AreaChart
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
          {reviewerList.slice(0, 5).map((reviewer, index) => (
            <Area
              key={reviewer}
              type="monotone"
              dataKey={reviewer}
              stackId="1"
              stroke={REVIEWER_COLORS[index % REVIEWER_COLORS.length]}
              fill={REVIEWER_COLORS[index % REVIEWER_COLORS.length]}
              fillOpacity={0.4}
            />
          ))}
        </AreaChart>
      </ChartContainer>
      <p className="mt-4 text-muted-foreground text-sm">
        Top reviewers:{' '}
        {sortedReviewers
          .map(([name, count]) => `${name} (${count})`)
          .join(', ')}
      </p>
    </Card>
  );
}
