'use client';

import { Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { TrendingDown } from 'lucide-react';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

const reviewSpeedData = [
  { date: 'Week 1', hours: 4.8 },
  { date: 'Week 2', hours: 4.5 },
  { date: 'Week 3', hours: 4.2 },
  { date: 'Week 4', hours: 3.8 },
  { date: 'Week 5', hours: 3.5 },
  { date: 'Week 6', hours: 3.1 },
];

const reviewSpeedConfig = {
  hours: {
    label: 'Hours',
    color: '#2563eb',
  },
} satisfies ChartConfig;

export function ReviewSpeedChart() {
  return (
    <Card className="p-4 flex flex-col transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <CardTitle>PR Review Speed Trend</CardTitle>
        <CardDescription>
          Average review speed over the past 6 weeks
        </CardDescription>
      </div>
      <ChartContainer
        config={reviewSpeedConfig}
        className="h-[200px] w-full flex-1"
      >
        <LineChart
          data={reviewSpeedData}
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
            className="text-xs text-muted-foreground"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => `${value}h`}
            className="text-xs text-muted-foreground"
          />
          <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
          <Line
            type="monotone"
            dataKey="hours"
            stroke="var(--color-hours)"
            strokeWidth={2}
            dot={{
              fill: 'var(--color-hours)',
              stroke: 'var(--card)',
              strokeWidth: 2,
              r: 4,
            }}
            activeDot={{
              fill: 'var(--color-hours)',
              stroke: 'var(--card)',
              strokeWidth: 2,
              r: 6,
            }}
          />
        </LineChart>
      </ChartContainer>
      <p className="text-muted-foreground text-sm mt-4 flex items-center gap-1">
        Current Trend: <TrendingDown className="h-4 w-4 text-green-600" />
        <span className="text-green-600 font-medium">Improving</span>
        <span className="text-foreground">(avg 4.2h → 3.1h)</span>
      </p>
    </Card>
  );
}
