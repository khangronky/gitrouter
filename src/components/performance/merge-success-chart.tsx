'use client';

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

const mergeSuccessData = [
  { repo: 'frontend', rate: 94 },
  { repo: 'backend', rate: 88 },
  { repo: 'api', rate: 91 },
  { repo: 'mobile', rate: 85 },
  { repo: 'infra', rate: 97 },
  { repo: 'docs', rate: 99 },
];

const mergeSuccessConfig = {
  rate: {
    label: 'Success Rate',
    color: '#22c55e',
  },
} satisfies ChartConfig;

export function MergeSuccessChart() {
  return (
    <Card className="p-4 flex flex-col transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <CardTitle>Merge Success Rate</CardTitle>
        <CardDescription>
          Percentage of PRs that merge without issues
        </CardDescription>
      </div>
      <ChartContainer
        config={mergeSuccessConfig}
        className="mt-4 h-[220px] w-full flex-1"
      >
        <BarChart
          data={mergeSuccessData}
          layout="vertical"
          margin={{ top: 0, right: 30, bottom: 0, left: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={true}
            horizontal={false}
            stroke="var(--border)"
          />
          <XAxis type="number" hide domain={[0, 100]} />
          <YAxis type="category" dataKey="repo" hide />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="rate" fill="var(--color-rate)" radius={4}>
            <LabelList
              dataKey="repo"
              position="insideLeft"
              offset={8}
              className="fill-white"
              fontSize={12}
            />
            <LabelList
              dataKey="rate"
              position="right"
              offset={8}
              className="fill-foreground"
              fontSize={12}
              formatter={(v: number) => `${v}%`}
            />
          </Bar>
        </BarChart>
      </ChartContainer>
      <p className="text-muted-foreground text-sm mt-4">
        Team avg: <span className="text-green-600 font-medium">92%</span>
        <span className="text-foreground"> success rate</span>
      </p>
    </Card>
  );
}

