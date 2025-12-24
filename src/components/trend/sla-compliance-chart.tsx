'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { TrendChartSkeleton } from './trend-skeleton';
import type { SlaComplianceData } from '@/lib/schema/trend';

interface SlaComplianceChartProps {
  data?: SlaComplianceData[];
}

const slaComplianceConfig = {
  percentage: {
    label: 'SLA %',
    color: '#22c55e',
  },
} satisfies ChartConfig;

export function SlaComplianceChart({ data }: SlaComplianceChartProps) {
  if (!data) {
    return <TrendChartSkeleton chartType="line" />;
  }

  if (data.length === 0) {
    return (
      <Card className="flex flex-col p-4 transition-all duration-200">
        <div className="flex flex-col gap-1">
          <CardTitle>SLA Compliance Trend</CardTitle>
          <CardDescription>
            Percentage of reviews meeting the 4-hour SLA
          </CardDescription>
        </div>
        <p className="mt-4 text-muted-foreground text-sm">
          No SLA data available for this period.
        </p>
      </Card>
    );
  }

  // Calculate trend
  const firstHalf = data.slice(0, Math.floor(data.length / 2));
  const secondHalf = data.slice(Math.floor(data.length / 2));
  const firstAvg =
    firstHalf.reduce((sum, d) => sum + d.percentage, 0) / firstHalf.length;
  const secondAvg =
    secondHalf.reduce((sum, d) => sum + d.percentage, 0) / secondHalf.length;
  const trend = secondAvg > firstAvg ? 'improving' : 'declining';

  return (
    <Card className="flex flex-col p-4 transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <CardTitle>SLA Compliance Trend</CardTitle>
        <CardDescription>
          Percentage of reviews meeting the 4-hour SLA
        </CardDescription>
      </div>
      <ChartContainer
        config={slaComplianceConfig}
        className="h-[200px] w-full flex-1"
      >
        <LineChart
          data={data}
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
            className="text-xs"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            className="text-xs"
            domain={[0, 100]}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ReferenceLine
            y={80}
            stroke="var(--muted-foreground)"
            strokeDasharray="5 5"
            label={{ value: '80% target', position: 'right', fill: 'var(--muted-foreground)' }}
          />
          <Line
            type="monotone"
            dataKey="percentage"
            stroke="var(--color-percentage)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartContainer>
      <p className="mt-4 text-muted-foreground text-sm">
        Trend:{' '}
        <span
          className={`font-medium ${
            trend === 'improving' ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {trend === 'improving' ? 'Improving' : 'Declining'}
        </span>
        <span className="text-foreground">
          {' '}
          ({Math.round(firstAvg)}% → {Math.round(secondAvg)}%)
        </span>
      </p>
    </Card>
  );
}
