'use client';

import { cn } from '@/lib/utils';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

interface LatencySeries {
  day: string;
  hours: number;
}

const chartConfig = {
  hours: {
    label: 'Hours',
    color: 'var(--primary-500)',
  },
} satisfies ChartConfig;

export function LatencyChart({
  latencySeries,
  className,
}: {
  latencySeries: LatencySeries[];
  className?: string;
}) {
  return (
    <Card
      className={cn('h-full p-4 flex flex-col justify-between ', className)}
    >
      <div className="flex flex-col gap-1">
        <CardTitle>First Review Latency (Target: 4 hours)</CardTitle>
        <CardDescription>Latency for the selected time range</CardDescription>
      </div>
      <ChartContainer config={chartConfig} className="h-[225px] w-full">
        <AreaChart
          data={latencySeries}
          margin={{ top: 10, right: 10, bottom: 0, left: -20 }}
        >
          <defs>
            <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
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
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => value.slice(0, 3)}
            className="text-xs text-muted-foreground"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => `${value}h`}
            className="text-xs text-muted-foreground"
          />
          <ReferenceLine
            y={4}
            stroke="var(--destructive)"
            strokeDasharray="5 5"
            strokeWidth={1.5}
            label={{
              value: 'Target',
              position: 'right',
              fill: 'var(--destructive)',
              fontSize: 11,
            }}
          />
          <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
          <Area
            type="monotone"
            dataKey="hours"
            stroke="var(--color-hours)"
            strokeWidth={2}
            fill="url(#latencyGradient)"
          />
        </AreaChart>
      </ChartContainer>

      <p className="text-muted-foreground text-sm">
        Current avg:{' '}
        <span className="font-semibold text-foreground">3.2 hours</span> (within
        target)
      </p>
    </Card>
  );
}
