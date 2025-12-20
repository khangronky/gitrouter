'use client';

import { Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Check } from 'lucide-react';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

const firstResponseData = [
  { week: 'Week 1', minutes: 45 },
  { week: 'Week 2', minutes: 38 },
  { week: 'Week 3', minutes: 32 },
  { week: 'Week 4', minutes: 28 },
  { week: 'Week 5', minutes: 25 },
  { week: 'Week 6', minutes: 22 },
];

const firstResponseConfig = {
  minutes: {
    label: 'Minutes',
    color: '#14b8a6',
  },
} satisfies ChartConfig;

export function FirstResponseChart() {
  return (
    <Card className="p-4 flex flex-col transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <CardTitle>First Response Time Trend</CardTitle>
        <CardDescription>
          Average time until first reviewer action
        </CardDescription>
      </div>
      <ChartContainer
        config={firstResponseConfig}
        className="h-[200px] w-full flex-1"
      >
        <LineChart
          data={firstResponseData}
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
            tickFormatter={(value) => `${value}m`}
            className="text-xs text-muted-foreground"
          />
          <ChartTooltip
            content={<ChartTooltipContent indicator="line" />}
          />
          <Line
            type="monotone"
            dataKey="minutes"
            stroke="var(--color-minutes)"
            strokeWidth={2}
            dot={{
              fill: 'var(--color-minutes)',
              stroke: 'var(--card)',
              strokeWidth: 2,
              r: 4,
            }}
          />
        </LineChart>
      </ChartContainer>
      <p className="text-muted-foreground text-sm mt-4">
        Target: 30 min → Current:{' '}
        <span className="text-green-600 font-medium">22 min</span>
        <Check className="inline h-4 w-4 text-green-600 ml-1" />
      </p>
    </Card>
  );
}

