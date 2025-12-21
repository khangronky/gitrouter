'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Users } from 'lucide-react';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';

const workloadBalanceData = [
  { week: 'Week 1', alice: 8, bob: 12, charlie: 6, diana: 10 },
  { week: 'Week 2', alice: 10, bob: 10, charlie: 8, diana: 9 },
  { week: 'Week 3', alice: 9, bob: 9, charlie: 9, diana: 10 },
  { week: 'Week 4', alice: 11, bob: 8, charlie: 10, diana: 8 },
  { week: 'Week 5', alice: 10, bob: 9, charlie: 9, diana: 9 },
  { week: 'Week 6', alice: 9, bob: 10, charlie: 10, diana: 10 },
];

const workloadBalanceConfig = {
  alice: {
    label: 'Alice',
    color: '#3b82f6',
  },
  bob: {
    label: 'Bob',
    color: '#10b981',
  },
  charlie: {
    label: 'Charlie',
    color: '#f59e0b',
  },
  diana: {
    label: 'Diana',
    color: '#ef4444',
  },
} satisfies ChartConfig;

export function WorkloadBalanceChart() {
  return (
    <Card className="p-4 flex flex-col transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Reviewer Workload Balance Trend
        </CardTitle>
        <CardDescription>
          Distribution of assigned PRs per reviewer over time
        </CardDescription>
      </div>
      <ChartContainer
        config={workloadBalanceConfig}
        className="h-[200px] w-full flex-1"
      >
        <BarChart
          data={workloadBalanceData}
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
            className="text-xs text-muted-foreground"
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar
            dataKey="alice"
            stackId="workload"
            fill="var(--color-alice)"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="bob"
            stackId="workload"
            fill="var(--color-bob)"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="charlie"
            stackId="workload"
            fill="var(--color-charlie)"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="diana"
            stackId="workload"
            fill="var(--color-diana)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ChartContainer>
      <p className="text-muted-foreground text-sm mt-4 flex items-center gap-1">
        Workload Variance:{' '}
        <span className="text-green-600 font-medium">Low</span>
        <span className="text-foreground">
          {' '}
          (evenly distributed across team)
        </span>
      </p>
    </Card>
  );
}
