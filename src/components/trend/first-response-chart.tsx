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
import type { FirstResponseData } from '@/lib/schema/trend';

interface FirstResponseChartProps {
  data?: FirstResponseData[];
}

const firstResponseConfig = {
  minutes: {
    label: 'Minutes',
    color: '#f59e0b',
  },
} satisfies ChartConfig;

export function FirstResponseChart({ data }: FirstResponseChartProps) {
  if (!data) {
    return <TrendChartSkeleton chartType="bar" />;
  }

  if (data.length === 0) {
    return (
      <Card className="flex flex-col p-4 transition-all duration-200">
        <div className="flex flex-col gap-1">
          <CardTitle>First Response Time Trend</CardTitle>
          <CardDescription>
            Time to first review activity per week
          </CardDescription>
        </div>
        <p className="mt-4 text-muted-foreground text-sm">
          No response data available for this period.
        </p>
      </Card>
    );
  }

  // Calculate trend
  const firstHalf = data.slice(0, Math.floor(data.length / 2));
  const secondHalf = data.slice(Math.floor(data.length / 2));
  const firstAvg =
    firstHalf.reduce((sum, d) => sum + d.minutes, 0) / firstHalf.length;
  const secondAvg =
    secondHalf.reduce((sum, d) => sum + d.minutes, 0) / secondHalf.length;
  const trend = secondAvg < firstAvg ? 'improving' : 'declining';

  return (
    <Card className="flex flex-col p-4 transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <CardTitle>First Response Time Trend</CardTitle>
        <CardDescription>Time to first review activity per week</CardDescription>
      </div>
      <ChartContainer
        config={firstResponseConfig}
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
            dataKey="minutes"
            fill="var(--color-minutes)"
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
          ({Math.round(firstAvg)}min → {Math.round(secondAvg)}min)
        </span>
      </p>
    </Card>
  );
}
