'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { PerformanceChartSkeleton } from './performance-skeleton';
import type { WorkloadDistributionData } from '@/lib/schema/performance';

interface WorkloadDistributionChartProps {
  data?: WorkloadDistributionData[];
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: WorkloadDistributionData;
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  return (
    <div className="rounded-lg border bg-background p-2 shadow-md">
      <p className="font-medium">{data.reviewer}</p>
      <p className="text-sm text-muted-foreground">
        {data.reviewCount} reviews ({data.percentage.toFixed(1)}%)
      </p>
    </div>
  );
}

// Empty state placeholder data
const EMPTY_STATE_DATA = [
  { reviewer: 'No data', reviewCount: 1, percentage: 100 },
];

export function WorkloadDistributionChart({
  data,
}: WorkloadDistributionChartProps) {
  if (!data) {
    return <PerformanceChartSkeleton chartType="pie" />;
  }

  const isEmpty = data.length === 0;
  const chartData = isEmpty ? EMPTY_STATE_DATA : data;

  // Calculate if workload is balanced (no reviewer has >40% of reviews)
  const maxPercentage = isEmpty
    ? 0
    : Math.max(...data.map((d) => d.percentage));
  const isBalanced = maxPercentage <= 40;
  const totalReviews = isEmpty
    ? 0
    : data.reduce((sum, d) => sum + d.reviewCount, 0);

  return (
    <Card className="flex flex-col p-4 transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <CardTitle>Workload Distribution</CardTitle>
        <CardDescription>
          Review workload distribution across team members
        </CardDescription>
      </div>
      <div className="relative flex flex-1 items-center gap-4">
        <div className="h-[200px] w-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={isEmpty ? 0 : 2}
                dataKey="reviewCount"
                nameKey="reviewer"
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      isEmpty ? 'var(--muted)' : COLORS[index % COLORS.length]
                    }
                    opacity={isEmpty ? 0.3 : 1}
                  />
                ))}
              </Pie>
              {!isEmpty && <Tooltip content={<CustomTooltip />} />}
            </PieChart>
          </ResponsiveContainer>
        </div>
        {isEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <p className="text-sm text-muted-foreground">No review data yet</p>
            <p className="text-xs text-muted-foreground/70">
              Data will appear when reviews are completed
            </p>
          </div>
        ) : (
          <div className="flex flex-1 flex-col gap-2">
            {data.slice(0, 5).map((item, index) => (
              <div key={item.reviewer} className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="flex-1 truncate text-sm">{item.reviewer}</span>
                <span className="text-sm text-muted-foreground">
                  {item.percentage.toFixed(0)}%
                </span>
              </div>
            ))}
            {data.length > 5 && (
              <p className="text-xs text-muted-foreground">
                +{data.length - 5} more reviewers
              </p>
            )}
          </div>
        )}
      </div>
      <p className="mt-4 text-muted-foreground text-sm">
        Total:{' '}
        <span className="font-medium text-foreground">
          {totalReviews} reviews
        </span>
        {' | '}
        Balance:{' '}
        <span
          className={`font-medium ${isEmpty ? 'text-muted-foreground' : isBalanced ? 'text-green-600' : 'text-amber-600'}`}
        >
          {isEmpty ? 'N/A' : isBalanced ? 'Well distributed' : 'Imbalanced'}
        </span>
      </p>
    </Card>
  );
}
