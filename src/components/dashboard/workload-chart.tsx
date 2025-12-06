'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

interface ReviewerWorkload {
  name: string;
  assigned: number;
  capacity: number;
}

const chartConfig = {
  assigned: {
    label: 'Assigned',
    color: 'var(--primary-700)',
  },
  available: {
    label: 'Available',
    color: 'var(--primary-200)',
  },
} satisfies ChartConfig;

export function WorkloadChart({
  reviewerWorkload,
}: {
  reviewerWorkload: ReviewerWorkload[];
}) {
  const chartData = reviewerWorkload.map((r) => ({
    name: r.name,
    assigned: r.assigned,
    available: r.capacity - r.assigned,
  }));

  return (
    <Card className="p-4 flex flex-col">
      <div className="flex flex-col gap-1">
        <CardTitle>Reviewer Workload Distribution</CardTitle>
        <CardDescription>
          Distribution of PRs assigned to reviewers
        </CardDescription>
      </div>

      <ChartContainer config={chartConfig} className="mt-4 h-[220px] w-full">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 20, bottom: 0, left: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={true}
            horizontal={false}
            stroke="var(--border)"
          />
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width={50}
            className="text-xs"
            hide
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name) => (
                  <div className="flex items-center gap-2">
                    <span>
                      {chartConfig[name as keyof typeof chartConfig]?.label}
                    </span>
                    <span className="font-mono font-medium">{value} PRs</span>
                  </div>
                )}
              />
            }
          />

          <Bar
            dataKey="assigned"
            stackId="a"
            fill="var(--color-assigned)"
            radius={4}
          >
            <LabelList
              dataKey="name"
              position="insideLeft"
              offset={8}
              className="fill-white"
              fontSize={12}
            />
            <LabelList
              dataKey="assigned"
              position="right"
              offset={8}
              className="fill-foreground"
              fontSize={12}
            />
          </Bar>
        </BarChart>
      </ChartContainer>

      <div className="mt-4 flex items-center justify-center gap-4 text-foreground text-sm">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-primary-700" />
          <span>Assigned</span>
        </div>
      </div>
    </Card>
  );
}
