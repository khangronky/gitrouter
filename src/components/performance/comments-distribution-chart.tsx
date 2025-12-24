'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

const commentsDistributionData = [
  { reviewer: 'Alice', comments: 8.5 },
  { reviewer: 'Bob', comments: 4.2 },
  { reviewer: 'Charlie', comments: 12.1 },
  { reviewer: 'Diana', comments: 6.8 },
  { reviewer: 'Eve', comments: 3.5 },
  { reviewer: 'Frank', comments: 7.2 },
];

const commentsDistributionConfig = {
  comments: {
    label: 'Avg Comments',
    color: '#0ea5e9',
  },
} satisfies ChartConfig;

/**
 * NOTE: This chart is not implemented yet.
 * It is a placeholder for the actual chart that will be implemented in the future.
 */
export function CommentsDistributionChart() {
  return (
    <Card className="flex flex-col p-4 transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <CardTitle>Review Comments Distribution</CardTitle>
        <CardDescription>
          Average comments per review by reviewer
        </CardDescription>
      </div>
      <ChartContainer
        config={commentsDistributionConfig}
        className="h-[200px] w-full flex-1"
      >
        <BarChart
          data={commentsDistributionData}
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
            dataKey="comments"
            fill="var(--color-comments)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ChartContainer>
      <p className="mt-4 text-muted-foreground text-sm">
        Most thorough:{' '}
        <span className="font-medium text-foreground">Charlie (12.1 avg)</span>
        {' | '}
        Team avg:{' '}
        <span className="font-medium text-foreground">7.0 comments</span>
      </p>
    </Card>
  );
}
