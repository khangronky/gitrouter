'use client';

import { Bar, BarChart, CartesianGrid, Legend, XAxis, YAxis } from 'recharts';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { PerformanceChartSkeleton } from './performance-skeleton';
import type { PrSizeByAuthorData } from '@/lib/schema/performance';

interface PrSizeByAuthorChartProps {
  data?: PrSizeByAuthorData[];
}

const prSizeConfig = {
  small: {
    label: 'Small',
    color: '#22c55e',
  },
  medium: {
    label: 'Medium',
    color: '#f59e0b',
  },
  large: {
    label: 'Large',
    color: '#ef4444',
  },
} satisfies ChartConfig;

// Empty state placeholder data
const EMPTY_STATE_DATA: PrSizeByAuthorData[] = [
  { author: 'Author 1', small: 0, medium: 0, large: 0 },
  { author: 'Author 2', small: 0, medium: 0, large: 0 },
  { author: 'Author 3', small: 0, medium: 0, large: 0 },
  { author: 'Author 4', small: 0, medium: 0, large: 0 },
];

export function PrSizeByAuthorChart({ data }: PrSizeByAuthorChartProps) {
  if (!data) {
    return <PerformanceChartSkeleton chartType="bar" />;
  }

  const isEmpty = data.length === 0;
  const chartData = isEmpty ? EMPTY_STATE_DATA : data;

  return (
    <Card className="flex flex-col p-4 transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <CardTitle>PR Size by Author</CardTitle>
        <CardDescription>
          Distribution of PR sizes (small/medium/large) by author
        </CardDescription>
      </div>
      <div className="relative">
        <ChartContainer
          config={prSizeConfig}
          className="mt-4 h-[220px] w-full flex-1"
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
              dataKey="author"
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
            <Legend />
            <Bar
              dataKey="small"
              stackId="a"
              fill={isEmpty ? 'var(--muted)' : 'var(--color-small)'}
              radius={[0, 0, 0, 0]}
              opacity={isEmpty ? 0.3 : 1}
            />
            <Bar
              dataKey="medium"
              stackId="a"
              fill={isEmpty ? 'var(--muted)' : 'var(--color-medium)'}
              radius={[0, 0, 0, 0]}
              opacity={isEmpty ? 0.3 : 1}
            />
            <Bar
              dataKey="large"
              stackId="a"
              fill={isEmpty ? 'var(--muted)' : 'var(--color-large)'}
              radius={[4, 4, 0, 0]}
              opacity={isEmpty ? 0.3 : 1}
            />
          </BarChart>
        </ChartContainer>
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">No PR data yet</p>
              <p className="text-xs text-muted-foreground/70">
                Data will appear when PRs are created
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
