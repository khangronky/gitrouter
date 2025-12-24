'use client';

import { Bar, BarChart, CartesianGrid, Legend, XAxis, YAxis } from 'recharts';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { TrendChartSkeleton } from './trend-skeleton';
import type { PrSizeData } from '@/lib/schema/trend';

interface PrSizeChartProps {
  data?: PrSizeData[];
}

const prSizeConfig = {
  small: {
    label: 'Small (<100 lines)',
    color: '#22c55e',
  },
  medium: {
    label: 'Medium (100-500 lines)',
    color: '#f59e0b',
  },
  large: {
    label: 'Large (>500 lines)',
    color: '#ef4444',
  },
} satisfies ChartConfig;

export function PrSizeChart({ data }: PrSizeChartProps) {
  if (!data) {
    return <TrendChartSkeleton chartType="bar" />;
  }

  if (data.length === 0) {
    return (
      <Card className="flex flex-col p-4 transition-all duration-200">
        <div className="flex flex-col gap-1">
          <CardTitle>PR Size Distribution</CardTitle>
          <CardDescription>Distribution of PR sizes over time</CardDescription>
        </div>
        <p className="mt-4 text-muted-foreground text-sm">
          No PR data available for this period.
        </p>
      </Card>
    );
  }

  // Calculate totals
  const totalSmall = data.reduce((sum, d) => sum + d.small, 0);
  const totalMedium = data.reduce((sum, d) => sum + d.medium, 0);
  const totalLarge = data.reduce((sum, d) => sum + d.large, 0);
  const total = totalSmall + totalMedium + totalLarge;

  const smallPct = total > 0 ? Math.round((totalSmall / total) * 100) : 0;
  const mediumPct = total > 0 ? Math.round((totalMedium / total) * 100) : 0;
  const largePct = total > 0 ? Math.round((totalLarge / total) * 100) : 0;

  return (
    <Card className="flex flex-col p-4 transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <CardTitle>PR Size Distribution</CardTitle>
        <CardDescription>Distribution of PR sizes over time</CardDescription>
      </div>
      <ChartContainer config={prSizeConfig} className="h-[200px] w-full flex-1">
        <BarChart
          data={data}
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
            className="text-xs"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            className="text-xs"
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Legend />
          <Bar
            dataKey="small"
            stackId="a"
            fill="var(--color-small)"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="medium"
            stackId="a"
            fill="var(--color-medium)"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="large"
            stackId="a"
            fill="var(--color-large)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ChartContainer>
      <p className="mt-4 text-muted-foreground text-sm">
        Distribution: <span className="text-green-600">{smallPct}% small</span>
        {' | '}
        <span className="text-yellow-600">{mediumPct}% medium</span>
        {' | '}
        <span className="text-red-600">{largePct}% large</span>
      </p>
    </Card>
  );
}
