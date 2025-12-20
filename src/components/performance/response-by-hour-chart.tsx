'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

const responseByHourData = [
  { hour: '9am', avgMinutes: 15 },
  { hour: '10am', avgMinutes: 12 },
  { hour: '11am', avgMinutes: 18 },
  { hour: '12pm', avgMinutes: 35 },
  { hour: '1pm', avgMinutes: 28 },
  { hour: '2pm', avgMinutes: 14 },
  { hour: '3pm', avgMinutes: 16 },
  { hour: '4pm', avgMinutes: 20 },
  { hour: '5pm', avgMinutes: 25 },
];

const responseByHourConfig = {
  avgMinutes: {
    label: 'Avg Minutes',
    color: '#8b5cf6',
  },
} satisfies ChartConfig;

export function ResponseByHourChart() {
  return (
    <Card className="p-4 flex flex-col transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <CardTitle>Response Time by Hour</CardTitle>
        <CardDescription>
          When reviewers are fastest to respond
        </CardDescription>
      </div>
      <ChartContainer
        config={responseByHourConfig}
        className="h-[200px] w-full flex-1"
      >
        <BarChart
          data={responseByHourData}
          margin={{ top: 10, right: 10, bottom: 0, left: -20 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="var(--border)"
          />
          <XAxis
            dataKey="hour"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            className="text-xs"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(v) => `${v}m`}
            className="text-xs"
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar
            dataKey="avgMinutes"
            fill="var(--color-avgMinutes)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ChartContainer>
      <p className="text-muted-foreground text-sm mt-4">
        Fastest:{' '}
        <span className="text-foreground font-medium">
          10am (12 min avg)
        </span>
        {' | '}
        Slowest:{' '}
        <span className="text-foreground font-medium">
          12pm (35 min avg)
        </span>
      </p>
    </Card>
  );
}

