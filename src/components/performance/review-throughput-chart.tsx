'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

const reviewThroughputData = [
  { day: 'Mon', reviews: 24 },
  { day: 'Tue', reviews: 32 },
  { day: 'Wed', reviews: 28 },
  { day: 'Thu', reviews: 35 },
  { day: 'Fri', reviews: 22 },
  { day: 'Sat', reviews: 8 },
  { day: 'Sun', reviews: 5 },
];

const reviewThroughputConfig = {
  reviews: {
    label: 'Reviews',
    color: '#f59e0b',
  },
} satisfies ChartConfig;

export function ReviewThroughputChart() {
  return (
    <Card className="p-4 flex flex-col transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <CardTitle>Daily Review Throughput</CardTitle>
        <CardDescription>
          Number of reviews completed per day
        </CardDescription>
      </div>
      <ChartContainer
        config={reviewThroughputConfig}
        className="h-[200px] w-full flex-1"
      >
        <BarChart
          data={reviewThroughputData}
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
            className="text-xs text-muted-foreground"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            className="text-xs text-muted-foreground"
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar
            dataKey="reviews"
            fill="var(--color-reviews)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ChartContainer>
      <p className="text-muted-foreground text-sm mt-4">
        Peak day:{' '}
        <span className="text-foreground font-medium">
          Thursday (35 reviews)
        </span>
        {' | '}
        Weekly avg:{' '}
        <span className="text-foreground font-medium">22 reviews/day</span>
      </p>
    </Card>
  );
}

