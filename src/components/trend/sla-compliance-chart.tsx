'use client';

import { Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Check } from 'lucide-react';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

const slaComplianceData = [
  { date: 'Week 1', percentage: 72 },
  { date: 'Week 2', percentage: 75 },
  { date: 'Week 3', percentage: 78 },
  { date: 'Week 4', percentage: 82 },
  { date: 'Week 5', percentage: 85 },
  { date: 'Week 6', percentage: 87 },
];

const slaComplianceConfig = {
  percentage: {
    label: 'Percentage',
    color: '#16a34a',
  },
} satisfies ChartConfig;

export function SlaComplianceChart() {
  return (
    <Card className="p-4 flex flex-col transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <CardTitle>SLA Compliance Trend</CardTitle>
        <CardDescription>
          Percentage of PRs meeting the 4-hour review target
        </CardDescription>
      </div>
      <ChartContainer
        config={slaComplianceConfig}
        className="h-[200px] w-full flex-1"
      >
        <LineChart
          data={slaComplianceData}
          margin={{ top: 10, right: 10, bottom: 0, left: -20 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="var(--border)"
          />
          <XAxis
            dataKey="date"
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
          <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
          <Line
            type="monotone"
            dataKey="percentage"
            stroke="var(--color-percentage)"
            strokeWidth={2}
            dot={{
              fill: 'var(--color-percentage)',
              stroke: 'var(--card)',
              strokeWidth: 2,
              r: 4,
            }}
            activeDot={{
              fill: 'var(--color-percentage)',
              stroke: 'var(--card)',
              strokeWidth: 2,
              r: 6,
            }}
          />
        </LineChart>
      </ChartContainer>
      <p className="text-muted-foreground text-sm mt-4 flex items-center gap-1">
        Target: 80% → Current:{' '}
        <span className="text-foreground font-medium">87%</span>
        <Check className="h-4 w-4 text-green-600" />
        <span className="text-green-600">(Above target)</span>
      </p>
    </Card>
  );
}
