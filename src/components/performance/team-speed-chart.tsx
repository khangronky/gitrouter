'use client';

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { TrendingDown } from 'lucide-react';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

const teamSpeedData = [
  { week: 'Week 1', hours: 7.2 },
  { week: 'Week 2', hours: 6.5 },
  { week: 'Week 3', hours: 5.8 },
  { week: 'Week 4', hours: 5.2 },
  { week: 'Week 5', hours: 4.5 },
  { week: 'Week 6', hours: 3.8 },
  { week: 'Week 7', hours: 3.1 },
];

const teamSpeedConfig = {
  hours: {
    label: 'Hours',
    color: '#10b981',
  },
} satisfies ChartConfig;

export function TeamSpeedChart() {
  return (
    <Card className="p-4 flex flex-col transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <CardTitle>Team Speed Improvement Trend</CardTitle>
        <CardDescription>
          Average team review time over the past weeks
        </CardDescription>
      </div>
      <ChartContainer
        config={teamSpeedConfig}
        className="h-[200px] w-full flex-1"
      >
        <AreaChart
          data={teamSpeedData}
          margin={{ top: 10, right: 10, bottom: 0, left: -20 }}
        >
          <defs>
            <linearGradient id="perfSpeedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--color-hours)"
                stopOpacity={0.4}
              />
              <stop
                offset="100%"
                stopColor="var(--color-hours)"
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
            tickFormatter={(value) => `${value}h`}
            className="text-xs text-muted-foreground"
          />
          <ChartTooltip
            content={<ChartTooltipContent indicator="line" />}
          />
          <Area
            type="monotone"
            dataKey="hours"
            stroke="var(--color-hours)"
            strokeWidth={2}
            fill="url(#perfSpeedGradient)"
          />
        </AreaChart>
      </ChartContainer>
      <p className="text-muted-foreground text-sm mt-4 flex items-center gap-1">
        Overall Trend: <TrendingDown className="h-4 w-4 text-green-600" />
        <span className="text-green-600 font-medium">Getting Faster</span>
        <span className="text-foreground">(7.2h → 3.1h over 7 weeks)</span>
      </p>
    </Card>
  );
}

