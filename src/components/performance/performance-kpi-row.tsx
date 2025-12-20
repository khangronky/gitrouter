'use client';

import { Line, LineChart, ResponsiveContainer } from 'recharts';
import { Card, CardAction, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  IconTrendingDown,
  IconTrendingUp,
} from '@tabler/icons-react';

interface PerformanceKpi {
  label: string;
  value: string;
  delta: number;
  data: { value: number }[];
  color: string;
  lowerIsBetter?: boolean;
}

const performanceKpis: PerformanceKpi[] = [
  {
    label: 'Top Reviewer',
    value: '@diana',
    delta: 12,
    data: [
      { value: 3.2 },
      { value: 2.9 },
      { value: 2.7 },
      { value: 2.5 },
      { value: 2.3 },
      { value: 2.2 },
    ],
    color: '#3b82f6',
    lowerIsBetter: true,
  },
  {
    label: 'Team Avg Time',
    value: '2.7h',
    delta: -35,
    data: [
      { value: 4.2 },
      { value: 3.8 },
      { value: 3.4 },
      { value: 3.1 },
      { value: 2.9 },
      { value: 2.7 },
    ],
    color: '#10b981',
    lowerIsBetter: true,
  },
  {
    label: 'SLA Compliance',
    value: '95%',
    delta: 8,
    data: [
      { value: 88 },
      { value: 89 },
      { value: 91 },
      { value: 93 },
      { value: 94 },
      { value: 95 },
    ],
    color: '#16a34a',
  },
  {
    label: 'Total Reviews',
    value: '251',
    delta: 15,
    data: [
      { value: 180 },
      { value: 195 },
      { value: 210 },
      { value: 225 },
      { value: 240 },
      { value: 251 },
    ],
    color: '#f59e0b',
  },
];

function Sparkline({ data, color }: { data: { value: number }[]; color: string }) {
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

export function PerformanceKpiRow() {
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {performanceKpis.map((kpi, index) => {
        const isPositive = kpi.lowerIsBetter ? kpi.delta < 0 : kpi.delta > 0;
        const displayDelta = Math.abs(kpi.delta);

        return (
          <Card
            key={kpi.label}
            className="p-4 flex flex-col justify-between gap-3 transition-all duration-200 hover:shadow-md animate-in fade-in-50 slide-in-from-bottom-2 duration-300"
            style={{ 
              animationDelay: `${index * 50}ms`, 
              animationFillMode: 'backwards',
            }}
          >
            <div>
              <div className="flex flex-row justify-between items-center w-full">
                <div className="font-medium text-[11px] text-muted-foreground uppercase tracking-wide">
                  {kpi.label}
                </div>
                <CardAction>
                  <Badge
                    variant="outline"
                    className={
                      isPositive
                        ? 'text-green-600 border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800'
                        : 'text-red-600 border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800'
                    }
                  >
                    {isPositive ? (
                      <IconTrendingUp className="size-3 mr-1" />
                    ) : (
                      <IconTrendingDown className="size-3 mr-1" />
                    )}
                    {displayDelta}%
                  </Badge>
                </CardAction>
              </div>
              <div className="font-bold text-3xl text-foreground mt-1">
                {kpi.value}
              </div>
            </div>

            <div className="h-10">
              <Sparkline data={kpi.data} color={kpi.color} />
            </div>

            <CardFooter className="flex-col items-start gap-1 text-sm p-0">
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

