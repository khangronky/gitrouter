'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts';
import { TrendingDown, Check, Users } from 'lucide-react';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

// Mock data for Reviewer Workload Balance Trend
const workloadBalanceData = [
  { week: 'Week 1', alice: 8, bob: 12, charlie: 6, diana: 10 },
  { week: 'Week 2', alice: 10, bob: 10, charlie: 8, diana: 9 },
  { week: 'Week 3', alice: 9, bob: 9, charlie: 9, diana: 10 },
  { week: 'Week 4', alice: 11, bob: 8, charlie: 10, diana: 8 },
  { week: 'Week 5', alice: 10, bob: 9, charlie: 9, diana: 9 },
  { week: 'Week 6', alice: 9, bob: 10, charlie: 10, diana: 10 },
];

// Mock data for PR Review Speed Trend
const reviewSpeedData = [
  { date: 'Week 1', hours: 4.8 },
  { date: 'Week 2', hours: 4.5 },
  { date: 'Week 3', hours: 4.2 },
  { date: 'Week 4', hours: 3.8 },
  { date: 'Week 5', hours: 3.5 },
  { date: 'Week 6', hours: 3.1 },
];

// Mock data for SLA Compliance Trend
const slaComplianceData = [
  { date: 'Week 1', percentage: 72 },
  { date: 'Week 2', percentage: 75 },
  { date: 'Week 3', percentage: 78 },
  { date: 'Week 4', percentage: 82 },
  { date: 'Week 5', percentage: 85 },
  { date: 'Week 6', percentage: 87 },
];

// Mock data for PR Volume Trend
const prVolumeData = [
  { date: 'Dec 1', count: 8 },
  { date: 'Dec 2', count: 12 },
  { date: 'Dec 3', count: 15 },
  { date: 'Dec 4', count: 10 },
  { date: 'Dec 5', count: 14 },
  { date: 'Dec 6', count: 18 },
  { date: 'Dec 7', count: 11 },
  { date: 'Dec 8', count: 13 },
];

const reviewSpeedConfig = {
  hours: {
    label: 'Hours',
    color: '#2563eb',
  },
} satisfies ChartConfig;

const slaComplianceConfig = {
  percentage: {
    label: 'Percentage',
    color: '#16a34a',
  },
} satisfies ChartConfig;

const prVolumeConfig = {
  count: {
    label: 'PR Count',
    color: '#8b5cf6',
  },
} satisfies ChartConfig;

const workloadBalanceConfig = {
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
  diana: {
    label: 'Diana',
    color: '#ef4444',
  },
} satisfies ChartConfig;

export default function TrendPage() {
  return (
    <section className="p-4 space-y-4">
      {/* Top Row: PR Review Speed Trend & SLA Compliance Trend */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* PR Review Speed Trend */}
        <Card className="p-4 flex flex-col">
          <div className="flex flex-col gap-1">
            <CardTitle>PR Review Speed Trend</CardTitle>
            <CardDescription>
              Average review speed over the past 6 weeks
            </CardDescription>
          </div>
          <ChartContainer
            config={reviewSpeedConfig}
            className="h-[200px] w-full flex-1"
          >
            <LineChart
              data={reviewSpeedData}
              margin={{ top: 10, right: 10, bottom: 0, left: -20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
              />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-xs text-muted-foreground"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => `${value}h`}
                className="text-xs text-muted-foreground"
              />
              <ChartTooltip
                content={<ChartTooltipContent indicator="line" />}
              />
              <Line
                type="monotone"
                dataKey="hours"
                stroke="var(--color-hours)"
                strokeWidth={2}
                dot={{
                  fill: 'var(--color-hours)',
                  stroke: 'var(--card)',
                  strokeWidth: 2,
                  r: 4,
                }}
                activeDot={{
                  fill: 'var(--color-hours)',
                  stroke: 'var(--card)',
                  strokeWidth: 2,
                  r: 6,
                }}
              />
            </LineChart>
          </ChartContainer>
          <p className="text-muted-foreground text-sm mt-4 flex items-center gap-1">
            Current Trend: <TrendingDown className="h-4 w-4 text-green-600" />
            <span className="text-green-600 font-medium">Improving</span>
            <span className="text-foreground">(avg 4.2h → 3.1h)</span>
          </p>
        </Card>

        {/* SLA Compliance Trend */}
        <Card className="p-4 flex flex-col">
          <div className="flex flex-col gap-1">
            <CardTitle>SLA Compliance Trend</CardTitle>
            <CardDescription>
              Percentage of PRs meeting the 4-hour review target
            </CardDescription>
          </div>
          <ChartContainer
            config={slaComplianceConfig}
            className="h-[200px] w-full flex-1"
          >
            <LineChart
              data={slaComplianceData}
              margin={{ top: 10, right: 10, bottom: 0, left: -20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
              />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-xs text-muted-foreground"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => `${value}%`}
                domain={[0, 100]}
                className="text-xs text-muted-foreground"
              />
              <ChartTooltip
                content={<ChartTooltipContent indicator="line" />}
              />
              <Line
                type="monotone"
                dataKey="percentage"
                stroke="var(--color-percentage)"
                strokeWidth={2}
                dot={{
                  fill: 'var(--color-percentage)',
                  stroke: 'var(--card)',
                  strokeWidth: 2,
                  r: 4,
                }}
                activeDot={{
                  fill: 'var(--color-percentage)',
                  stroke: 'var(--card)',
                  strokeWidth: 2,
                  r: 6,
                }}
              />
            </LineChart>
          </ChartContainer>
          <p className="text-muted-foreground text-sm mt-4 flex items-center gap-1">
            Target: 80% → Current:{' '}
            <span className="text-foreground font-medium">87%</span>
            <Check className="h-4 w-4 text-green-600" />
            <span className="text-green-600">(Above target)</span>
          </p>
        </Card>
      </div>

      {/* Bottom Row: PR Volume Trend & Reviewer Workload Balance */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* PR Volume Trend */}
        <Card className="p-4 flex flex-col">
          <div className="flex flex-col gap-1">
            <CardTitle>PR Volume Trend</CardTitle>
            <CardDescription>
              Total number of pull requests created daily
            </CardDescription>
          </div>
          <ChartContainer
            config={prVolumeConfig}
            className="h-[200px] w-full flex-1"
          >
            <AreaChart
              data={prVolumeData}
              margin={{ top: 10, right: 10, bottom: 0, left: -20 }}
            >
              <defs>
                <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="var(--color-count)"
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--color-count)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
              />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-xs text-muted-foreground"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-xs text-muted-foreground"
              />
              <ChartTooltip
                content={<ChartTooltipContent indicator="line" />}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="var(--color-count)"
                strokeWidth={2}
                fill="url(#volumeGradient)"
              />
            </AreaChart>
          </ChartContainer>
          <p className="text-muted-foreground text-sm mt-4">
            Average PRs/day:{' '}
            <span className="text-foreground font-medium">12</span>
            {' | '}
            Total this month:{' '}
            <span className="text-foreground font-medium">360</span>
          </p>
        </Card>

        {/* Reviewer Workload Balance Trend */}
        <Card className="p-4 flex flex-col">
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Reviewer Workload Balance Trend
            </CardTitle>
            <CardDescription>
              Distribution of assigned PRs per reviewer over time
            </CardDescription>
          </div>
          <ChartContainer
            config={workloadBalanceConfig}
            className="h-[200px] w-full flex-1"
          >
            <BarChart
              data={workloadBalanceData}
              margin={{ top: 20, right: 10, bottom: 0, left: -20 }}
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
                className="text-xs text-muted-foreground"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-xs text-muted-foreground"
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="alice"
                stackId="workload"
                fill="var(--color-alice)"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="bob"
                stackId="workload"
                fill="var(--color-bob)"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="charlie"
                stackId="workload"
                fill="var(--color-charlie)"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="diana"
                stackId="workload"
                fill="var(--color-diana)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
          <p className="text-muted-foreground text-sm mt-4 flex items-center gap-1">
            Workload Variance:{' '}
            <span className="text-green-600 font-medium">Low</span>
            <span className="text-foreground">
              {' '}
              (evenly distributed across team)
            </span>
          </p>
        </Card>
      </div>
    </section>
  );
}
