'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

const bottleneckData = [
  { reviewer: 'Alice', frequency: 3 },
  { reviewer: 'Bob', frequency: 8 },
  { reviewer: 'Charlie', frequency: 2 },
  { reviewer: 'Diana', frequency: 5 },
  { reviewer: 'Eve', frequency: 12 },
  { reviewer: 'Frank', frequency: 4 },
];

const bottleneckConfig = {
  frequency: {
    label: 'Bottleneck Count',
    color: '#ef4444',
  },
} satisfies ChartConfig;

export function BottleneckChart() {
  return (
    <Card className="p-4 flex flex-col transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <CardTitle>Bottleneck Frequency</CardTitle>
        <CardDescription>
          How often each reviewer becomes a bottleneck
        </CardDescription>
      </div>
      <ChartContainer
        config={bottleneckConfig}
        className="h-[200px] w-full flex-1"
      >
        <BarChart
          data={bottleneckData}
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
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            className="text-xs"
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar
            dataKey="frequency"
            fill="var(--color-frequency)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ChartContainer>
      <p className="text-muted-foreground text-sm mt-4">
        Highest risk:{' '}
        <span className="text-red-600 font-medium">Eve (12 times)</span>
        {' | '}
        Lowest:{' '}
        <span className="text-green-600 font-medium">Charlie (2 times)</span>
      </p>
    </Card>
  );
}
