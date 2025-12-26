'use client';

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { TrendChartSkeleton } from './trend-skeleton';
import type { PrVolumeData } from '@/lib/schema/trend';

interface PrVolumeChartProps {
  data?: PrVolumeData[];
}

const prVolumeConfig = {
  count: {
    label: 'PRs',
    color: '#8b5cf6',
  },
} satisfies ChartConfig;

export function PrVolumeChart({ data }: PrVolumeChartProps) {
  if (!data) {
    return <TrendChartSkeleton chartType="area" />;
  }

  if (data.length === 0) {
    return (
      <Card className="flex flex-col p-4 transition-all duration-200">
        <div className="flex flex-col gap-1">
          <CardTitle>PR Volume Trend</CardTitle>
          <CardDescription>Number of PRs created per week</CardDescription>
        </div>
        <p className="mt-4 text-muted-foreground text-sm">
          No PR data available for this period.
        </p>
      </Card>
    );
  }

  // Calculate totals
  const totalPRs = data.reduce((sum, d) => sum + d.count, 0);
  const avgPerWeek = Math.round(totalPRs / data.length);

  return (
    <Card className="flex flex-col p-4 transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <CardTitle>PR Volume Trend</CardTitle>
        <CardDescription>Number of PRs created per week</CardDescription>
      </div>
      <ChartContainer
        config={prVolumeConfig}
        className="h-[200px] w-full flex-1"
      >
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
            dataKey="date"
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
          <Area
            type="monotone"
            dataKey="count"
            stroke="var(--color-count)"
            fill="var(--color-count)"
            fillOpacity={0.2}
          />
        </AreaChart>
      </ChartContainer>
      <p className="mt-4 text-muted-foreground text-sm">
        Total PRs:{' '}
        <span className="font-medium text-foreground">{totalPRs}</span>
        {' | '}
        Avg per week:{' '}
        <span className="font-medium text-foreground">{avgPerWeek}</span>
      </p>
    </Card>
  );
}
