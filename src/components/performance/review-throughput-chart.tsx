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
import type { ReviewThroughputData } from '@/lib/schema/performance';

interface ReviewThroughputChartProps {
  data?: ReviewThroughputData[];
}

const reviewThroughputConfig = {
  reviews: {
    label: 'Reviews',
    color: '#f59e0b',
  },
} satisfies ChartConfig;

// Empty state placeholder data (days of the week)
const EMPTY_STATE_DATA: ReviewThroughputData[] = [
  { day: 'Sun', reviews: 0 },
  { day: 'Mon', reviews: 0 },
  { day: 'Tue', reviews: 0 },
  { day: 'Wed', reviews: 0 },
  { day: 'Thu', reviews: 0 },
  { day: 'Fri', reviews: 0 },
  { day: 'Sat', reviews: 0 },
];

export function ReviewThroughputChart({ data }: ReviewThroughputChartProps) {
  if (!data) {
    return <PerformanceChartSkeleton chartType="bar" />;
  }

  // Check if all reviews are 0 (effectively empty)
  const isEmpty = data.length === 0 || data.every((d) => d.reviews === 0);
  const chartData = data.length === 0 ? EMPTY_STATE_DATA : data;

  const peakDay = isEmpty
    ? null
    : data.reduce((max, d) => (d.reviews > max.reviews ? d : max));
  const weeklyAvg = isEmpty
    ? 0
    : Math.round(data.reduce((sum, d) => sum + d.reviews, 0) / data.length);

  return (
    <Card className="flex flex-col p-4 transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <CardTitle>Daily Review Throughput</CardTitle>
        <CardDescription>Number of reviews completed per day</CardDescription>
      </div>
      <div className="relative">
        <ChartContainer
          config={reviewThroughputConfig}
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
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              className="text-muted-foreground text-xs"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              className="text-muted-foreground text-xs"
            />
            {!isEmpty && <ChartTooltip content={<ChartTooltipContent />} />}
            <Bar
              dataKey="reviews"
              fill={isEmpty ? 'var(--muted)' : 'var(--color-reviews)'}
              radius={[4, 4, 0, 0]}
              opacity={isEmpty ? 0.3 : 1}
            />
          </BarChart>
        </ChartContainer>
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                No review data yet
              </p>
              <p className="text-xs text-muted-foreground/70">
                Data will appear when reviews are completed
              </p>
            </div>
          </div>
        )}
      </div>
      <p className="mt-4 text-muted-foreground text-sm">
        Peak day:{' '}
        <span
          className={`font-medium ${isEmpty ? 'text-muted-foreground' : 'text-foreground'}`}
        >
          {peakDay ? `${peakDay.day} (${peakDay.reviews} reviews)` : 'N/A'}
        </span>
        {' | '}
        Weekly avg:{' '}
        <span
          className={`font-medium ${isEmpty ? 'text-muted-foreground' : 'text-foreground'}`}
        >
          {isEmpty ? 'N/A' : `${weeklyAvg} reviews/day`}
        </span>
      </p>
    </Card>
  );
}
