'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

const prSizeByAuthorData = [
  { author: 'Alice', small: 15, medium: 8, large: 2 },
  { author: 'Bob', small: 10, medium: 12, large: 5 },
  { author: 'Charlie', small: 18, medium: 6, large: 1 },
  { author: 'Diana', small: 12, medium: 10, large: 3 },
];

const prSizeByAuthorConfig = {
  small: { label: 'Small', color: '#22c55e' },
  medium: { label: 'Medium', color: '#eab308' },
  large: { label: 'Large', color: '#ef4444' },
} satisfies ChartConfig;

export function PrSizeByAuthorChart() {
  return (
    <Card className="p-4 flex flex-col transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <CardTitle>PR Size by Author</CardTitle>
        <CardDescription>
          Distribution of PR sizes per team member
        </CardDescription>
      </div>
      <ChartContainer
        config={prSizeByAuthorConfig}
        className="h-[280px] w-full flex-1"
      >
        <BarChart
          data={prSizeByAuthorData}
          margin={{ top: 20, right: 10, bottom: 0, left: -20 }}
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
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            className="text-xs"
          />
          <ChartTooltip content={<ChartTooltipContent />} />
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
      <div className="mt-4 flex items-center justify-center gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-[#22c55e]" />
          <span>Small</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-[#eab308]" />
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-[#ef4444]" />
          <span>Large</span>
        </div>
      </div>
    </Card>
  );
}

