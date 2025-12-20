'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

const repoComparisonData = [
  { repo: 'frontend', hours: 2.8 },
  { repo: 'backend', hours: 4.2 },
  { repo: 'api', hours: 3.1 },
  { repo: 'mobile', hours: 3.5 },
  { repo: 'infra', hours: 1.8 },
  { repo: 'docs', hours: 1.2 },
];

const repoComparisonConfig = {
  hours: {
    label: 'Hours',
    color: '#6366f1',
  },
} satisfies ChartConfig;

export function RepoComparisonChart() {
  return (
    <Card className="p-4 flex flex-col transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <CardTitle>Repository Comparison (Avg Review Time)</CardTitle>
        <CardDescription>Average review time by repository</CardDescription>
      </div>
      <ChartContainer
        config={repoComparisonConfig}
        className="mt-4 h-[220px] w-full flex-1"
      >
        <BarChart
          data={repoComparisonData}
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
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) => (
                  <div className="flex items-center gap-2">
                    <span>Avg Review Time</span>
                    <span className="font-mono font-medium">{value}h</span>
                  </div>
                )}
              />
            }
          />
          <Bar dataKey="hours" fill="var(--color-hours)" radius={4}>
            <LabelList
              dataKey="repo"
              position="insideLeft"
              offset={8}
              className="fill-white"
              fontSize={12}
            />
            <LabelList
              dataKey="hours"
              position="right"
              offset={8}
              className="fill-foreground"
              fontSize={12}
              formatter={(value: number) => `${value}h`}
            />
          </Bar>
        </BarChart>
      </ChartContainer>
      <p className="text-muted-foreground text-sm mt-4">
        Slowest:{' '}
        <span className="text-foreground font-medium">backend (4.2h avg)</span>
        {' | '}
        Fastest:{' '}
        <span className="text-foreground font-medium">docs (1.2h avg)</span>
      </p>
    </Card>
  );
}
