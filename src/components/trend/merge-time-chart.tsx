'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { TrendChartSkeleton } from './trend-skeleton';
import type { MergeTimeData } from '@/lib/schema/trend';

interface MergeTimeChartProps {
  data?: MergeTimeData[];
}

const mergeTimeConfig = {
  hours: {
    label: 'Hours',
    color: '#8b5cf6',
  },
} satisfies ChartConfig;

// Empty state placeholder data
const EMPTY_STATE_DATA: MergeTimeData[] = [
  { week: 'W1', hours: 0 },
  { week: 'W2', hours: 0 },
  { week: 'W3', hours: 0 },
  { week: 'W4', hours: 0 },
  { week: 'W5', hours: 0 },
  { week: 'W6', hours: 0 },
];

export function MergeTimeChart({ data }: MergeTimeChartProps) {
  if (!data) {
    return <TrendChartSkeleton chartType="bar" />;
  }

  const isEmpty = data.length === 0 || data.every((d) => d.hours === 0);
  const chartData = data.length === 0 ? EMPTY_STATE_DATA : data;

  // Calculate trend
  const firstHalf = isEmpty ? [] : data.slice(0, Math.floor(data.length / 2));
  const secondHalf = isEmpty ? [] : data.slice(Math.floor(data.length / 2));
  const firstAvg = isEmpty
    ? 0
    : firstHalf.reduce((sum, d) => sum + d.hours, 0) / firstHalf.length;
  const secondAvg = isEmpty
    ? 0
    : secondHalf.reduce((sum, d) => sum + d.hours, 0) / secondHalf.length;
  const trend = isEmpty
    ? null
    : secondAvg < firstAvg ? 'improving' : secondAvg > firstAvg ? 'declining' : 'stable';

  return (
    <Card className="flex flex-col p-4 transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <CardTitle>Time to Merge After Approval</CardTitle>
        <CardDescription>
          Average time from approval to merge per week
        </CardDescription>
      </div>
      <div className="relative">
        <ChartContainer
          config={mergeTimeConfig}
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
            {!isEmpty && <ChartTooltip content={<ChartTooltipContent />} />}
            <Bar
              dataKey="hours"
              fill={isEmpty ? 'var(--muted)' : 'var(--color-hours)'}
              radius={[4, 4, 0, 0]}
              opacity={isEmpty ? 0.3 : 1}
            />
          </BarChart>
        </ChartContainer>
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">No merge data yet</p>
              <p className="text-xs text-muted-foreground/70">
                Data will appear when PRs are merged
              </p>
            </div>
          </div>
        )}
      </div>
      <p className="mt-4 text-muted-foreground text-sm">
        Trend:{' '}
        {isEmpty ? (
          <span className="font-medium text-muted-foreground">N/A</span>
        ) : (
          <>
            <span
              className={`font-medium ${
                trend === 'improving' ? 'text-green-600' : trend === 'declining' ? 'text-red-600' : 'text-foreground'
              }`}
            >
              {trend === 'improving' ? 'Improving' : trend === 'declining' ? 'Declining' : 'Stable'}
            </span>
            <span className="text-foreground">
              {' '}
              ({firstAvg.toFixed(1)}h → {secondAvg.toFixed(1)}h)
            </span>
          </>
        )}
      </p>
    </Card>
  );
}

