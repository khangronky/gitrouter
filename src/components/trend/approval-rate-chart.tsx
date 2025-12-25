'use client';

import { Bar, BarChart, CartesianGrid, Legend, XAxis, YAxis } from 'recharts';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { TrendChartSkeleton } from './trend-skeleton';
import type { ApprovalRateData } from '@/lib/schema/trend';

interface ApprovalRateChartProps {
  data?: ApprovalRateData[];
}

const approvalRateConfig = {
  approved: {
    label: 'Approved',
    color: '#22c55e',
  },
  rejected: {
    label: 'Changes Requested',
    color: '#ef4444',
  },
} satisfies ChartConfig;

export function ApprovalRateChart({ data }: ApprovalRateChartProps) {
  if (!data) {
    return <TrendChartSkeleton chartType="bar" />;
  }

  if (data.length === 0) {
    return (
      <Card className="flex flex-col p-4 transition-all duration-200">
        <div className="flex flex-col gap-1">
          <CardTitle>Approval vs Changes Requested</CardTitle>
          <CardDescription>Review outcomes over time</CardDescription>
        </div>
        <p className="mt-4 text-muted-foreground text-sm">
          No approval data available for this period.
        </p>
      </Card>
    );
  }

  // Calculate totals
  const totalApproved = data.reduce((sum, d) => sum + d.approved, 0);
  const totalRejected = data.reduce((sum, d) => sum + d.rejected, 0);
  const total = totalApproved + totalRejected;
  const approvalRate =
    total > 0 ? Math.round((totalApproved / total) * 100) : 0;

  return (
    <Card className="flex flex-col p-4 transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <CardTitle>Approval vs Changes Requested</CardTitle>
        <CardDescription>Review outcomes over time</CardDescription>
      </div>
      <ChartContainer
        config={approvalRateConfig}
        className="h-[200px] w-full flex-1"
      >
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, bottom: 0, left: -20 }}
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
            className="text-xs"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            className="text-xs"
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Legend />
          <Bar
            dataKey="approved"
            stackId="a"
            fill="var(--color-approved)"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="rejected"
            stackId="a"
            fill="var(--color-rejected)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ChartContainer>
      <p className="mt-4 text-muted-foreground text-sm">
        Overall approval rate:{' '}
        <span
          className={`font-medium ${
            approvalRate >= 70 ? 'text-green-600' : 'text-yellow-600'
          }`}
        >
          {approvalRate}%
        </span>
        <span className="text-foreground">
          {' '}
          ({totalApproved} approved, {totalRejected} changes requested)
        </span>
      </p>
    </Card>
  );
}
