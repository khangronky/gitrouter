'use client';

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

const reworkRateData = [
  { week: 'Week 1', percentage: 28 },
  { week: 'Week 2', percentage: 25 },
  { week: 'Week 3', percentage: 22 },
  { week: 'Week 4', percentage: 18 },
  { week: 'Week 5', percentage: 15 },
  { week: 'Week 6', percentage: 12 },
];

const reworkRateConfig = {
  percentage: {
    label: 'Rework %',
    color: '#f97316',
  },
} satisfies ChartConfig;

export function ReworkRateChart() {
  return (
    <Card className="p-4 flex flex-col transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <CardTitle>Rework Rate Trend</CardTitle>
        <CardDescription>
          Percentage of PRs requiring multiple review cycles
        </CardDescription>
      </div>
      <ChartContainer
        config={reworkRateConfig}
        className="h-[200px] w-full flex-1"
      >
        <AreaChart
          data={reworkRateData}
          margin={{ top: 10, right: 10, bottom: 0, left: -20 }}
        >
          <defs>
            <linearGradient id="reworkGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--color-percentage)"
                stopOpacity={0.4}
              />
              <stop
                offset="100%"
                stopColor="var(--color-percentage)"
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
            tickFormatter={(value) => `${value}%`}
            className="text-xs text-muted-foreground"
          />
          <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
          <Area
            type="monotone"
            dataKey="percentage"
            stroke="var(--color-percentage)"
            strokeWidth={2}
            fill="url(#reworkGradient)"
          />
        </AreaChart>
      </ChartContainer>
      <p className="text-muted-foreground text-sm mt-4">
        Rework rate:{' '}
        <span className="text-green-600 font-medium">57% reduction</span>
        <span className="text-foreground"> (28% → 12%)</span>
      </p>
    </Card>
  );
}
