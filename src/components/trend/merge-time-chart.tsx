'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { TrendChartSkeleton } from './trend-skeleton';
import type { MergeTimeData } from '@/lib/schema/trend';

interface MergeTimeChartProps {
  data?: MergeTimeData[];
}

const mergeTimeConfig = {
  hours: {
    label: 'Hours',
    color: '#8b5cf6',
  },
} satisfies ChartConfig;

export function MergeTimeChart({ data }: MergeTimeChartProps) {
  if (!data) {
    return <TrendChartSkeleton chartType="bar" />;
  }

  if (data.length === 0) {
    return (
      <Card className="flex flex-col p-4 transition-all duration-200">
        <div className="flex flex-col gap-1">
          <CardTitle>Time to Merge After Approval</CardTitle>
          <CardDescription>
            Average time from approval to merge per week
          </CardDescription>
        </div>
        <p className="mt-4 text-muted-foreground text-sm">
          No merge data available for this period.
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
  const trend =
    secondAvg < firstAvg
      ? 'improving'
      : secondAvg > firstAvg
        ? 'declining'
        : 'stable';

  return (
    <Card className="flex flex-col p-4 transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <CardTitle>Time to Merge After Approval</CardTitle>
        <CardDescription>
          Average time from approval to merge per week
        </CardDescription>
      </div>
      <ChartContainer
        config={mergeTimeConfig}
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
          <Bar
            dataKey="hours"
            fill="var(--color-hours)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ChartContainer>
      <p className="mt-4 text-muted-foreground text-sm">
        Trend:{' '}
        <span
          className={`font-medium ${
            trend === 'improving'
              ? 'text-green-600'
              : trend === 'declining'
                ? 'text-red-600'
                : 'text-foreground'
          }`}
        >
          {trend === 'improving'
            ? 'Improving'
            : trend === 'declining'
              ? 'Declining'
              : 'Stable'}
        </span>
        <span className="text-foreground">
          {' '}
          ({firstAvg.toFixed(1)}h → {secondAvg.toFixed(1)}h)
        </span>
      </p>
    </Card>
  );
}
