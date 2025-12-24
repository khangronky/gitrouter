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

export function ReviewDepthChart({ data }: ReviewDepthChartProps) {
  if (!data) {
    return <TrendChartSkeleton chartType="area" />;
  }

  if (data.length === 0) {
    return (
      <Card className="flex flex-col p-4 transition-all duration-200">
        <div className="flex flex-col gap-1">
          <CardTitle>Review Depth Trend</CardTitle>
          <CardDescription>
            Average lines of code reviewed per PR over time
          </CardDescription>
        </div>
        <p className="mt-4 text-muted-foreground text-sm">
          No review depth data available for this period.
        </p>
      </Card>
    );
  }

  // Calculate statistics
  const avgLines = data.reduce((sum, d) => sum + d.linesPerPr, 0) / data.length;
  const maxLines = Math.max(...data.map((d) => d.linesPerPr));

  // Calculate trend
  const firstHalf = data.slice(0, Math.floor(data.length / 2));
  const secondHalf = data.slice(Math.floor(data.length / 2));
  const firstAvg =
    firstHalf.reduce((sum, d) => sum + d.linesPerPr, 0) / firstHalf.length;
  const secondAvg =
    secondHalf.reduce((sum, d) => sum + d.linesPerPr, 0) / secondHalf.length;

  // For PR size, stable or decreasing is generally better (smaller PRs)
  const trend =
    secondAvg < firstAvg * 0.9
      ? 'decreasing'
      : secondAvg > firstAvg * 1.1
        ? 'increasing'
        : 'stable';

  return (
    <Card className="flex flex-col p-4 transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <CardTitle>Review Depth Trend</CardTitle>
        <CardDescription>
          Average lines of code reviewed per PR over time
        </CardDescription>
      </div>
      <ChartContainer
        config={reviewDepthConfig}
        className="h-[200px] w-full flex-1"
      >
        <AreaChart
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
          <defs>
            <linearGradient id="fillLinesPerPr" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--color-linesPerPr)"
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor="var(--color-linesPerPr)"
                stopOpacity={0.1}
              />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="linesPerPr"
            stroke="var(--color-linesPerPr)"
            fill="url(#fillLinesPerPr)"
            strokeWidth={2}
          />
        </AreaChart>
      </ChartContainer>
      <p className="mt-4 text-muted-foreground text-sm">
        Average:{' '}
        <span className="font-medium text-foreground">
          {Math.round(avgLines).toLocaleString()} lines/PR
        </span>
        {' | '}
        Trend:{' '}
        <span
          className={`font-medium ${
            trend === 'decreasing'
              ? 'text-green-600'
              : trend === 'increasing'
                ? 'text-amber-600'
                : 'text-foreground'
          }`}
        >
          {trend === 'decreasing'
            ? 'Smaller PRs'
            : trend === 'increasing'
              ? 'Larger PRs'
              : 'Stable'}
        </span>
      </p>
    </Card>
  );
}
