'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';

const prSizeData = [
  { week: 'Week 1', small: 12, medium: 8, large: 5 },
  { week: 'Week 2', small: 15, medium: 10, large: 4 },
  { week: 'Week 3', small: 18, medium: 9, large: 3 },
  { week: 'Week 4', small: 20, medium: 8, large: 3 },
  { week: 'Week 5', small: 22, medium: 7, large: 2 },
  { week: 'Week 6', small: 25, medium: 6, large: 2 },
];

const prSizeConfig = {
  small: {
    label: 'Small (<100 lines)',
    color: '#22c55e',
  },
  medium: {
    label: 'Medium (100-500)',
    color: '#eab308',
  },
  large: {
    label: 'Large (>500)',
    color: '#ef4444',
  },
} satisfies ChartConfig;

export function PrSizeChart() {
  return (
    <Card className="p-4 flex flex-col transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <CardTitle>PR Size Distribution Trend</CardTitle>
        <CardDescription>
          Small, medium, and large PRs over time
        </CardDescription>
      </div>
      <ChartContainer config={prSizeConfig} className="h-[200px] w-full flex-1">
        <BarChart
          data={prSizeData}
          margin={{ top: 20, right: 10, bottom: 0, left: -20 }}
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
            className="text-xs text-muted-foreground"
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar
            dataKey="small"
            stackId="size"
            fill="var(--color-small)"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="medium"
            stackId="size"
            fill="var(--color-medium)"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="large"
            stackId="size"
            fill="var(--color-large)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ChartContainer>
      <p className="text-muted-foreground text-sm mt-4">
        Trend:{' '}
        <span className="text-green-600 font-medium">More small PRs</span>
        <span className="text-foreground"> (better for reviews)</span>
      </p>
    </Card>
  );
}
