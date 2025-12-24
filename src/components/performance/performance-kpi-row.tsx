'use client';

import { IconTrendingDown, IconTrendingUp } from '@tabler/icons-react';
import { Line, LineChart, ResponsiveContainer } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Card, CardAction, CardFooter } from '@/components/ui/card';
import { PerformanceKpiSkeleton } from './performance-skeleton';
import type { PerformanceKpiData } from '@/lib/schema/performance';

interface PerformanceKpi {
  label: string;
  value: string;
  delta: number;
  data: { value: number }[];
  color: string;
  lowerIsBetter?: boolean;
}

interface PerformanceKpiRowProps {
  data?: PerformanceKpiData;
}

function Sparkline({
  data,
  color,
}: {
  data: { value: number }[];
  color: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function formatKpiData(data: PerformanceKpiData): PerformanceKpi[] {
  const calcDelta = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  return [
    {
      label: 'Top Reviewer',
      value: data.topReviewer.name,
      delta: calcDelta(data.topReviewer.current, data.topReviewer.previous),
      data: data.topReviewer.sparkline.map((v) => ({ value: v })),
      color: '#3b82f6',
      lowerIsBetter: false,
    },
    {
      label: 'Team Avg Time',
      value: `${data.teamAvgTime.current.toFixed(1)}h`,
      delta: calcDelta(data.teamAvgTime.current, data.teamAvgTime.previous),
      data: data.teamAvgTime.sparkline.map((v) => ({ value: v })),
      color: '#10b981',
      lowerIsBetter: true,
    },
    {
      label: 'SLA Compliance',
      value: `${Math.round(data.slaCompliance.current)}%`,
      delta: calcDelta(data.slaCompliance.current, data.slaCompliance.previous),
      data: data.slaCompliance.sparkline.map((v) => ({ value: v })),
      color: '#16a34a',
    },
    {
      label: 'Total Reviews',
      value: `${data.totalReviews.current}`,
      delta: calcDelta(data.totalReviews.current, data.totalReviews.previous),
      data: data.totalReviews.sparkline.map((v) => ({ value: v })),
      color: '#f59e0b',
    },
  ];
}

export function PerformanceKpiRow({ data }: PerformanceKpiRowProps) {
  if (!data) {
    return <PerformanceKpiSkeleton />;
  }

  const performanceKpis = formatKpiData(data);

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {performanceKpis.map((kpi, index) => {
        const isPositive = kpi.lowerIsBetter ? kpi.delta < 0 : kpi.delta > 0;
        const displayDelta = Math.abs(kpi.delta);

        return (
          <Card
            key={kpi.label}
            className="fade-in-50 slide-in-from-bottom-2 flex animate-in flex-col justify-between gap-3 p-4 transition-all duration-200 hover:shadow-md"
            style={{
              animationDelay: `${index * 50}ms`,
              animationFillMode: 'backwards',
            }}
          >
            <div>
              <div className="flex w-full flex-row items-center justify-between">
                <div className="font-medium text-[11px] text-muted-foreground uppercase tracking-wide">
                  {kpi.label}
                </div>
                <CardAction>
                  <Badge
                    variant="outline"
                    className={
                      isPositive
                        ? 'border-green-200 bg-green-50 text-green-600 dark:border-green-800 dark:bg-green-950'
                        : 'border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950'
                    }
                  >
                    {isPositive ? (
                      <IconTrendingUp className="mr-1 size-3" />
                    ) : (
                      <IconTrendingDown className="mr-1 size-3" />
                    )}
                    {displayDelta}%
                  </Badge>
                </CardAction>
              </div>
              <div className="mt-1 font-bold text-3xl text-foreground">
                {kpi.value}
              </div>
            </div>

            <div className="h-10">
              <Sparkline data={kpi.data} color={kpi.color} />
            </div>

            <CardFooter className="flex-col items-start gap-1 p-0 text-sm">
              <div className="text-muted-foreground text-xs">
                {isPositive ? 'Improved' : 'Declined'} this period
              </div>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
