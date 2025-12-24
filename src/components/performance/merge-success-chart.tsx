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
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { PerformanceChartSkeleton } from './performance-skeleton';
import type { MergeSuccessData } from '@/lib/schema/performance';

interface MergeSuccessChartProps {
  data?: MergeSuccessData[];
}

const mergeSuccessConfig = {
  successRate: {
    label: 'Success Rate',
    color: '#22c55e',
  },
} satisfies ChartConfig;

// Empty state placeholder data
const EMPTY_STATE_DATA: MergeSuccessData[] = [
  { repo: 'repo-1', successRate: 0 },
  { repo: 'repo-2', successRate: 0 },
  { repo: 'repo-3', successRate: 0 },
];

export function MergeSuccessChart({ data }: MergeSuccessChartProps) {
  if (!data) {
    return <PerformanceChartSkeleton chartType="bar" />;
  }

  const isEmpty = data.length === 0;
  const chartData = isEmpty ? EMPTY_STATE_DATA : data;
  const highest = isEmpty ? null : data[0];
  const lowest = isEmpty ? null : data[data.length - 1];

  return (
    <Card className="flex flex-col p-4 transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <CardTitle>Merge Success Rate</CardTitle>
        <CardDescription>
          Percentage of PRs successfully merged by repository
        </CardDescription>
      </div>
      <div className="relative">
        <ChartContainer
          config={mergeSuccessConfig}
          className="mt-4 h-[220px] w-full flex-1"
        >
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 30, bottom: 0, left: 0 }}
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
              dataKey="repo"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={50}
              className="text-xs"
              hide
            />
            {!isEmpty && (
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => (
                      <div className="flex items-center gap-2">
                        <span>Success Rate</span>
                        <span className="font-medium font-mono">{value}%</span>
                      </div>
                    )}
                  />
                }
              />
            )}
            <Bar
              dataKey="successRate"
              fill={isEmpty ? 'var(--muted)' : 'var(--color-successRate)'}
              radius={4}
              opacity={isEmpty ? 0.3 : 1}
            >
              <LabelList
                dataKey="repo"
                position="insideLeft"
                offset={8}
                className={isEmpty ? 'fill-muted-foreground' : 'fill-white'}
                fontSize={12}
              />
              {!isEmpty && (
                <LabelList
                  dataKey="successRate"
                  position="right"
                  offset={8}
                  className="fill-foreground"
                  fontSize={12}
                  formatter={(value: number) => `${Math.round(value)}%`}
                />
              )}
            </Bar>
          </BarChart>
        </ChartContainer>
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">No PR data yet</p>
              <p className="text-xs text-muted-foreground/70">
                Data will appear when PRs are created
              </p>
            </div>
          </div>
        )}
      </div>
      <p className="mt-4 text-muted-foreground text-sm">
        Highest:{' '}
        <span
          className={`font-medium ${isEmpty ? 'text-muted-foreground' : 'text-foreground'}`}
        >
          {highest
            ? `${highest.repo} (${Math.round(highest.successRate)}%)`
            : 'N/A'}
        </span>
        {' | '}
        Lowest:{' '}
        <span
          className={`font-medium ${isEmpty ? 'text-muted-foreground' : 'text-foreground'}`}
        >
          {lowest
            ? `${lowest.repo} (${Math.round(lowest.successRate)}%)`
            : 'N/A'}
        </span>
      </p>
    </Card>
  );
}
