'use client';

import { Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

const cycleTimeData = [
  { week: 'Week 1', hours: 18.5 },
  { week: 'Week 2', hours: 16.2 },
  { week: 'Week 3', hours: 15.8 },
  { week: 'Week 4', hours: 14.1 },
  { week: 'Week 5', hours: 12.5 },
  { week: 'Week 6', hours: 11.2 },
];

const cycleTimeConfig = {
  hours: {
    label: 'Hours',
    color: '#0ea5e9',
  },
} satisfies ChartConfig;

export function CycleTimeChart() {
  return (
    <Card className="p-4 flex flex-col transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <CardTitle>Review Cycle Time Trend</CardTitle>
        <CardDescription>
          Average time from PR creation to merge
        </CardDescription>
      </div>
      <ChartContainer
        config={cycleTimeConfig}
        className="h-[200px] w-full flex-1"
      >
        <LineChart
          data={cycleTimeData}
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
          />
        </LineChart>
      </ChartContainer>
      <p className="text-muted-foreground text-sm mt-4">
        Improvement:{' '}
        <span className="text-green-600 font-medium">39% faster</span>
        <span className="text-foreground"> (18.5h → 11.2h)</span>
      </p>
    </Card>
  );
}
