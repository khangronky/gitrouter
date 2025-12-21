'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';

const approvalRateData = [
  { week: 'Week 1', approved: 85, rejected: 15 },
  { week: 'Week 2', approved: 88, rejected: 12 },
  { week: 'Week 3', approved: 90, rejected: 10 },
  { week: 'Week 4', approved: 91, rejected: 9 },
  { week: 'Week 5', approved: 93, rejected: 7 },
  { week: 'Week 6', approved: 94, rejected: 6 },
];

const approvalRateConfig = {
  approved: {
    label: 'Approved',
    color: '#22c55e',
  },
  rejected: {
    label: 'Rejected',
    color: '#ef4444',
  },
} satisfies ChartConfig;

export function ApprovalRateChart() {
  return (
    <Card className="p-4 flex flex-col transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <CardTitle>Approval Rate Trend</CardTitle>
        <CardDescription>
          Percentage of PRs approved vs rejected over time
        </CardDescription>
      </div>
      <ChartContainer config={approvalRateConfig} className="h-[200px] w-full">
        <BarChart
          data={approvalRateData}
          margin={{ top: 20, right: 10, bottom: 0, left: -20 }}
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
            className="text-xs text-muted-foreground"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => `${value}%`}
            domain={[0, 100]}
            className="text-xs text-muted-foreground"
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar
            dataKey="approved"
            stackId="approval"
            fill="var(--color-approved)"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="rejected"
            stackId="approval"
            fill="var(--color-rejected)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ChartContainer>
      <p className="text-muted-foreground text-sm mt-4">
        Current approval rate:{' '}
        <span className="text-green-600 font-medium">94%</span>
        <span className="text-foreground"> (up from 85%)</span>
      </p>
    </Card>
  );
}
