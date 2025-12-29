'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { TimeToFirstReviewData } from '@/lib/schema/performance';
import { formatMinutes } from '@/utils/format';
import { PerformanceChartSkeleton } from './performance-skeleton';

interface TimeToFirstReviewChartProps {
  data?: TimeToFirstReviewData[];
}

const timeToFirstReviewConfig = {
  minutes: {
    label: 'Avg Minutes',
    color: '#22c55e',
  },
} satisfies ChartConfig;

// Empty state placeholder data
const EMPTY_STATE_DATA: TimeToFirstReviewData[] = [
  { reviewer: 'Reviewer 1', minutes: 0 },
  { reviewer: 'Reviewer 2', minutes: 0 },
  { reviewer: 'Reviewer 3', minutes: 0 },
];

export function TimeToFirstReviewChart({ data }: TimeToFirstReviewChartProps) {
  if (!data) {
    return <PerformanceChartSkeleton chartType="bar" />;
  }

  const isEmpty = data.length === 0;
  const chartData = isEmpty ? EMPTY_STATE_DATA : data;
  const fastest = isEmpty ? null : data[0];
  const teamAvg = isEmpty
    ? 0
    : data.reduce((sum, d) => sum + d.minutes, 0) / data.length;

  return (
    <Card className="flex flex-col p-4 transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <CardTitle>Time to First Review</CardTitle>
        <CardDescription>
          Average time from PR creation to first review by reviewer
        </CardDescription>
      </div>
      <div className="relative">
        <ChartContainer
          config={timeToFirstReviewConfig}
          className="h-50 w-full flex-1"
        >
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 10, right: 10, bottom: 0, left: 60 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={true}
              vertical={false}
              stroke="var(--border)"
            />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => formatMinutes(value)}
              className="text-xs"
            />
            <YAxis
              type="category"
              dataKey="reviewer"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={55}
              className="text-xs"
              tick={{ fill: isEmpty ? 'var(--muted-foreground)' : undefined }}
            />
            {!isEmpty && (
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatMinutes(value as number)}
                  />
                }
              />
            )}
            <Bar
              dataKey="minutes"
              fill={isEmpty ? 'var(--muted)' : 'var(--color-minutes)'}
              radius={[0, 4, 4, 0]}
              opacity={isEmpty ? 0.3 : 1}
            />
          </BarChart>
        </ChartContainer>
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground text-sm">
                No review data yet
              </p>
              <p className="text-muted-foreground/70 text-xs">
                Data will appear when reviews are completed
              </p>
            </div>
          </div>
        )}
      </div>
      <p className="mt-4 text-muted-foreground text-sm">
        Fastest:{' '}
        <span
          className={`font-medium ${isEmpty ? 'text-muted-foreground' : 'text-green-600'}`}
        >
          {fastest
            ? `${fastest.reviewer} (${formatMinutes(fastest.minutes)})`
            : 'N/A'}
        </span>
        {' | '}
        Team avg:{' '}
        <span className="font-medium text-foreground">
          {isEmpty ? 'N/A' : formatMinutes(teamAvg)}
        </span>
      </p>
    </Card>
  );
}
