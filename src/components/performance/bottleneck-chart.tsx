'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { PerformanceChartSkeleton } from './performance-skeleton';
import type { BottleneckData } from '@/lib/schema/performance';

interface BottleneckChartProps {
  data?: BottleneckData[];
}

const bottleneckConfig = {
  frequency: {
    label: 'Bottleneck Count',
    color: '#ef4444',
  },
} satisfies ChartConfig;

// Empty state placeholder data
const EMPTY_STATE_DATA: BottleneckData[] = [
  { reviewer: 'Reviewer 1', frequency: 0 },
  { reviewer: 'Reviewer 2', frequency: 0 },
  { reviewer: 'Reviewer 3', frequency: 0 },
  { reviewer: 'Reviewer 4', frequency: 0 },
];

export function BottleneckChart({ data }: BottleneckChartProps) {
  if (!data) {
    return <PerformanceChartSkeleton chartType="bar" />;
  }

  const isEmpty = data.length === 0;
  const chartData = isEmpty ? EMPTY_STATE_DATA : data;
  const highest = isEmpty ? null : data[0];
  const lowest = isEmpty ? null : data[data.length - 1];

  return (
    <Card className="flex flex-col p-4 transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <CardTitle>Bottleneck Frequency</CardTitle>
        <CardDescription>
          How often each reviewer becomes a bottleneck
        </CardDescription>
      </div>
      <div className="relative">
        <ChartContainer
          config={bottleneckConfig}
          className="h-[200px] w-full flex-1"
        >
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, bottom: 0, left: -20 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="var(--border)"
            />
            <XAxis
              dataKey="reviewer"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              className="text-xs"
              tick={{ fill: isEmpty ? 'var(--muted-foreground)' : undefined }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              className="text-xs"
            />
            {!isEmpty && <ChartTooltip content={<ChartTooltipContent />} />}
            <Bar
              dataKey="frequency"
              fill={isEmpty ? 'var(--muted)' : 'var(--color-frequency)'}
              radius={[4, 4, 0, 0]}
              opacity={isEmpty ? 0.3 : 1}
            />
          </BarChart>
        </ChartContainer>
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">No bottleneck data yet</p>
              <p className="text-xs text-muted-foreground/70">
                Data will appear when reviews are completed
              </p>
            </div>
          </div>
        )}
      </div>
      <p className="mt-4 text-muted-foreground text-sm">
        Highest risk:{' '}
        <span className={`font-medium ${isEmpty ? 'text-muted-foreground' : 'text-red-600'}`}>
          {highest ? `${highest.reviewer} (${highest.frequency} times)` : 'N/A'}
        </span>
        {' | '}
        Lowest:{' '}
        <span className={`font-medium ${isEmpty ? 'text-muted-foreground' : 'text-green-600'}`}>
          {lowest ? `${lowest.reviewer} (${lowest.frequency} times)` : 'N/A'}
        </span>
      </p>
    </Card>
  );
}
