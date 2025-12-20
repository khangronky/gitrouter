'use client';

import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from 'recharts';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

const reviewQualityData = [
  { metric: 'Thoroughness', alice: 85, bob: 70, charlie: 90 },
  { metric: 'Speed', alice: 75, bob: 90, charlie: 65 },
  { metric: 'Comments', alice: 80, bob: 60, charlie: 85 },
  { metric: 'Accuracy', alice: 90, bob: 75, charlie: 80 },
  { metric: 'Helpfulness', alice: 85, bob: 80, charlie: 75 },
];

const reviewQualityConfig = {
  alice: {
    label: 'Alice',
    color: '#3b82f6',
  },
  bob: {
    label: 'Bob',
    color: '#10b981',
  },
  charlie: {
    label: 'Charlie',
    color: '#f59e0b',
  },
} satisfies ChartConfig;

export function ReviewQualityChart() {
  return (
    <Card className="p-4 flex flex-col transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <CardTitle>Review Quality Score</CardTitle>
        <CardDescription>
          Composite quality metrics per reviewer
        </CardDescription>
      </div>
      <ChartContainer
        config={reviewQualityConfig}
        className="h-[280px] w-full flex-1"
      >
        <RadarChart
          data={reviewQualityData}
          margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
        >
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis dataKey="metric" className="text-xs" />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Radar
            dataKey="alice"
            stroke="var(--color-alice)"
            fill="var(--color-alice)"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Radar
            dataKey="bob"
            stroke="var(--color-bob)"
            fill="var(--color-bob)"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Radar
            dataKey="charlie"
            stroke="var(--color-charlie)"
            fill="var(--color-charlie)"
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </RadarChart>
      </ChartContainer>
      <div className="mt-4 flex items-center justify-center gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-[#3b82f6]" />
          <span>Alice</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-[#10b981]" />
          <span>Bob</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-[#f59e0b]" />
          <span>Charlie</span>
        </div>
      </div>
    </Card>
  );
}

