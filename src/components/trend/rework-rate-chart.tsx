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
import type { ReworkRateData } from '@/lib/schema/trend';

interface ReworkRateChartProps {
  data?: ReworkRateData[];
}

const reworkRateConfig = {
  percentage: {
    label: 'Rework %',
    color: '#ef4444',
  },
} satisfies ChartConfig;

export function ReworkRateChart({ data }: ReworkRateChartProps) {
  if (!data) {
    return <TrendChartSkeleton chartType="bar" />;
  }

  if (data.length === 0) {
    return (
      <Card className="flex flex-col p-4 transition-all duration-200">
        <div className="flex flex-col gap-1">
          <CardTitle>Rework Rate Trend</CardTitle>
          <CardDescription>Percentage of PRs requiring changes</CardDescription>
        </div>
        <p className="mt-4 text-muted-foreground text-sm">
          No rework data available for this period.
        </p>
      </Card>
    );
  }

  // Calculate trend (lower is better)
  const firstHalf = data.slice(0, Math.floor(data.length / 2));
  const secondHalf = data.slice(Math.floor(data.length / 2));
  const firstAvg =
    firstHalf.reduce((sum, d) => sum + d.percentage, 0) / firstHalf.length;
  const secondAvg =
    secondHalf.reduce((sum, d) => sum + d.percentage, 0) / secondHalf.length;
  const trend = secondAvg < firstAvg ? 'improving' : 'declining';

  return (
    <Card className="flex flex-col p-4 transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <CardTitle>Rework Rate Trend</CardTitle>
        <CardDescription>Percentage of PRs requiring changes</CardDescription>
      </div>
      <ChartContainer
        config={reworkRateConfig}
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
            domain={[0, 100]}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar
            dataKey="percentage"
            fill="var(--color-percentage)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
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
          ({Math.round(firstAvg)}% → {Math.round(secondAvg)}%)
        </span>
      </p>
    </Card>
  );
}
