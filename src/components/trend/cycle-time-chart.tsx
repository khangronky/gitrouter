'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { TrendChartSkeleton } from './trend-skeleton';
import type { CycleTimeData } from '@/lib/schema/trend';

interface CycleTimeChartProps {
  data?: CycleTimeData[];
}

const cycleTimeConfig = {
  hours: {
    label: 'Hours',
    color: '#0ea5e9',
  },
} satisfies ChartConfig;

export function CycleTimeChart({ data }: CycleTimeChartProps) {
  if (!data) {
    return <TrendChartSkeleton chartType="line" />;
  }

  if (data.length === 0) {
    return (
      <Card className="flex flex-col p-4 transition-all duration-200">
        <div className="flex flex-col gap-1">
          <CardTitle>Cycle Time Trend</CardTitle>
          <CardDescription>
            Time from PR creation to merge over time
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
  const trend = secondAvg < firstAvg ? 'improving' : 'declining';

  // Calculate average for reference line
  const avgValue = data.reduce((sum, d) => sum + d.hours, 0) / data.length;

  return (
    <Card className="flex flex-col p-4 transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <CardTitle>Cycle Time Trend</CardTitle>
        <CardDescription>
          Time from PR creation to merge over time
        </CardDescription>
      </div>
      <ChartContainer
        config={cycleTimeConfig}
        className="h-[200px] w-full flex-1"
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
          <ReferenceLine
            y={avgValue}
            stroke="var(--muted-foreground)"
            strokeDasharray="5 5"
          />
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
