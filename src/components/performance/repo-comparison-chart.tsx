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
import type { RepoComparisonData } from '@/lib/schema/performance';

interface RepoComparisonChartProps {
  data?: RepoComparisonData[];
}

const repoComparisonConfig = {
  hours: {
    label: 'Hours',
    color: '#6366f1',
  },
} satisfies ChartConfig;

// Empty state placeholder data
const EMPTY_STATE_DATA: RepoComparisonData[] = [
  { repo: 'repo-1', hours: 0 },
  { repo: 'repo-2', hours: 0 },
  { repo: 'repo-3', hours: 0 },
];

export function RepoComparisonChart({ data }: RepoComparisonChartProps) {
  if (!data) {
    return <PerformanceChartSkeleton chartType="bar" />;
  }

  const isEmpty = data.length === 0;
  const chartData = isEmpty ? EMPTY_STATE_DATA : data;
  const slowest = isEmpty ? null : data[0];
  const fastest = isEmpty ? null : data[data.length - 1];

  return (
    <Card className="flex flex-col p-4 transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <CardTitle>Repository Comparison (Avg Review Time)</CardTitle>
        <CardDescription>Average review time by repository</CardDescription>
      </div>
      <div className="relative">
        <ChartContainer
          config={repoComparisonConfig}
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
                        <span>Avg Review Time</span>
                        <span className="font-medium font-mono">{value}h</span>
                      </div>
                    )}
                  />
                }
              />
            )}
            <Bar
              dataKey="hours"
              fill={isEmpty ? 'var(--muted)' : 'var(--color-hours)'}
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
                  dataKey="hours"
                  position="right"
                  offset={8}
                  className="fill-foreground"
                  fontSize={12}
                  formatter={(value: number) => `${value.toFixed(1)}h`}
                />
              )}
            </Bar>
          </BarChart>
        </ChartContainer>
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">No review data yet</p>
              <p className="text-xs text-muted-foreground/70">
                Data will appear when reviews are completed
              </p>
            </div>
          </div>
        )}
      </div>
      <p className="mt-4 text-muted-foreground text-sm">
        Slowest:{' '}
        <span className={`font-medium ${isEmpty ? 'text-muted-foreground' : 'text-foreground'}`}>
          {slowest ? `${slowest.repo} (${slowest.hours.toFixed(1)}h avg)` : 'N/A'}
        </span>
        {' | '}
        Fastest:{' '}
        <span className={`font-medium ${isEmpty ? 'text-muted-foreground' : 'text-foreground'}`}>
          {fastest ? `${fastest.repo} (${fastest.hours.toFixed(1)}h avg)` : 'N/A'}
        </span>
      </p>
    </Card>
  );
}
