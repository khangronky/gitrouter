'use client';

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { TrendChartSkeleton } from './trend-skeleton';
import type { ReviewDepthData } from '@/lib/schema/trend';

interface ReviewDepthChartProps {
  data?: ReviewDepthData[];
}

const reviewDepthConfig = {
  linesPerPr: {
    label: 'Lines per PR',
    color: '#06b6d4',
  },
} satisfies ChartConfig;

// Empty state placeholder data
const EMPTY_STATE_DATA: ReviewDepthData[] = [
  { week: 'W1', linesPerPr: 0 },
  { week: 'W2', linesPerPr: 0 },
  { week: 'W3', linesPerPr: 0 },
  { week: 'W4', linesPerPr: 0 },
  { week: 'W5', linesPerPr: 0 },
  { week: 'W6', linesPerPr: 0 },
];

export function ReviewDepthChart({ data }: ReviewDepthChartProps) {
  if (!data) {
    return <TrendChartSkeleton chartType="area" />;
  }

  const isEmpty = data.length === 0 || data.every((d) => d.linesPerPr === 0);
  const chartData = data.length === 0 ? EMPTY_STATE_DATA : data;

  // Calculate statistics
  const avgLines = isEmpty ? 0 : data.reduce((sum, d) => sum + d.linesPerPr, 0) / data.length;
  
  // Calculate trend
  const firstHalf = isEmpty ? [] : data.slice(0, Math.floor(data.length / 2));
  const secondHalf = isEmpty ? [] : data.slice(Math.floor(data.length / 2));
  const firstAvg = isEmpty
    ? 0
    : firstHalf.reduce((sum, d) => sum + d.linesPerPr, 0) / firstHalf.length;
  const secondAvg = isEmpty
    ? 0
    : secondHalf.reduce((sum, d) => sum + d.linesPerPr, 0) / secondHalf.length;
  
  // For PR size, stable or decreasing is generally better (smaller PRs)
  const trend = isEmpty
    ? null
    : secondAvg < firstAvg * 0.9 ? 'decreasing' : secondAvg > firstAvg * 1.1 ? 'increasing' : 'stable';

  return (
    <Card className="flex flex-col p-4 transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <CardTitle>Review Depth Trend</CardTitle>
        <CardDescription>
          Average lines of code reviewed per PR over time
        </CardDescription>
      </div>
      <div className="relative">
        <ChartContainer
          config={reviewDepthConfig}
          className="h-[200px] w-full flex-1"
        >
          <AreaChart
            data={chartData}
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
            {!isEmpty && <ChartTooltip content={<ChartTooltipContent />} />}
            <defs>
              <linearGradient id="fillLinesPerPr" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isEmpty ? 'var(--muted)' : 'var(--color-linesPerPr)'} stopOpacity={isEmpty ? 0.2 : 0.8} />
                <stop offset="95%" stopColor={isEmpty ? 'var(--muted)' : 'var(--color-linesPerPr)'} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="linesPerPr"
              stroke={isEmpty ? 'var(--muted)' : 'var(--color-linesPerPr)'}
              fill="url(#fillLinesPerPr)"
              strokeWidth={2}
              opacity={isEmpty ? 0.3 : 1}
            />
          </AreaChart>
        </ChartContainer>
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">No PR data yet</p>
              <p className="text-xs text-muted-foreground/70">
                Data will appear when PRs are reviewed
              </p>
            </div>
          </div>
        )}
      </div>
      <p className="mt-4 text-muted-foreground text-sm">
        Average:{' '}
        <span className={`font-medium ${isEmpty ? 'text-muted-foreground' : 'text-foreground'}`}>
          {isEmpty ? 'N/A' : `${Math.round(avgLines).toLocaleString()} lines/PR`}
        </span>
        {' | '}
        Trend:{' '}
        {isEmpty ? (
          <span className="font-medium text-muted-foreground">N/A</span>
        ) : (
          <span
            className={`font-medium ${
              trend === 'decreasing' ? 'text-green-600' : trend === 'increasing' ? 'text-amber-600' : 'text-foreground'
            }`}
          >
            {trend === 'decreasing' ? 'Smaller PRs' : trend === 'increasing' ? 'Larger PRs' : 'Stable'}
          </span>
        )}
      </p>
    </Card>
  );
}

