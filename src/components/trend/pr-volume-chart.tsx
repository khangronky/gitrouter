'use client';

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

const prVolumeData = [
  { date: 'Dec 1', count: 8 },
  { date: 'Dec 2', count: 12 },
  { date: 'Dec 3', count: 15 },
  { date: 'Dec 4', count: 10 },
  { date: 'Dec 5', count: 14 },
  { date: 'Dec 6', count: 18 },
  { date: 'Dec 7', count: 11 },
  { date: 'Dec 8', count: 13 },
];

const prVolumeConfig = {
  count: {
    label: 'PR Count',
    color: '#8b5cf6',
  },
} satisfies ChartConfig;

export function PrVolumeChart() {
  return (
    <Card className="p-4 flex flex-col transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <CardTitle>PR Volume Trend</CardTitle>
        <CardDescription>
          Total number of pull requests created daily
        </CardDescription>
      </div>
      <ChartContainer
        config={prVolumeConfig}
        className="h-[200px] w-full flex-1"
      >
        <AreaChart
          data={prVolumeData}
          margin={{ top: 10, right: 10, bottom: 0, left: -20 }}
        >
          <defs>
            <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--color-count)"
                stopOpacity={0.4}
              />
              <stop
                offset="100%"
                stopColor="var(--color-count)"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
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
            className="text-xs text-muted-foreground"
          />
          <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
          <Area
            type="monotone"
            dataKey="count"
            stroke="var(--color-count)"
            strokeWidth={2}
            fill="url(#volumeGradient)"
          />
        </AreaChart>
      </ChartContainer>
      <p className="text-muted-foreground text-sm mt-4">
        Average PRs/day: <span className="text-foreground font-medium">12</span>
        {' | '}
        Total this month:{' '}
        <span className="text-foreground font-medium">360</span>
      </p>
    </Card>
  );
}
