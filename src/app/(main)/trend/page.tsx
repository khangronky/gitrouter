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

// Mock data for Reviewer Workload Balance Trend
const workloadBalanceData = [
  { week: 'Week 1', alice: 8, bob: 12, charlie: 6, diana: 10 },
  { week: 'Week 2', alice: 10, bob: 10, charlie: 8, diana: 9 },
  { week: 'Week 3', alice: 9, bob: 9, charlie: 9, diana: 10 },
  { week: 'Week 4', alice: 11, bob: 8, charlie: 10, diana: 8 },
  { week: 'Week 5', alice: 10, bob: 9, charlie: 9, diana: 9 },
  { week: 'Week 6', alice: 9, bob: 10, charlie: 10, diana: 10 },
];

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

// Mock data for Review Cycle Time Trend (PR creation to merge)
const cycleTimeData = [
  { week: 'Week 1', hours: 18.5 },
  { week: 'Week 2', hours: 16.2 },
  { week: 'Week 3', hours: 15.8 },
  { week: 'Week 4', hours: 14.1 },
  { week: 'Week 5', hours: 12.5 },
  { week: 'Week 6', hours: 11.2 },
];

const cycleTimeConfig = {
  hours: {
    label: 'Hours',
    color: '#0ea5e9',
  },
} satisfies ChartConfig;

// Mock data for First Response Time Trend
const firstResponseData = [
  { week: 'Week 1', minutes: 45 },
  { week: 'Week 2', minutes: 38 },
  { week: 'Week 3', minutes: 32 },
  { week: 'Week 4', minutes: 28 },
  { week: 'Week 5', minutes: 25 },
  { week: 'Week 6', minutes: 22 },
];

const firstResponseConfig = {
  minutes: {
    label: 'Minutes',
    color: '#14b8a6',
  },
} satisfies ChartConfig;

// Mock data for Rework Rate Trend
const reworkRateData = [
  { week: 'Week 1', percentage: 28 },
  { week: 'Week 2', percentage: 25 },
  { week: 'Week 3', percentage: 22 },
  { week: 'Week 4', percentage: 18 },
  { week: 'Week 5', percentage: 15 },
  { week: 'Week 6', percentage: 12 },
];

const reworkRateConfig = {
  percentage: {
    label: 'Rework %',
    color: '#f97316',
  },
} satisfies ChartConfig;

// Mock data for PR Size Distribution Trend
const prSizeData = [
  { week: 'Week 1', small: 12, medium: 8, large: 5 },
  { week: 'Week 2', small: 15, medium: 10, large: 4 },
  { week: 'Week 3', small: 18, medium: 9, large: 3 },
  { week: 'Week 4', small: 20, medium: 8, large: 3 },
  { week: 'Week 5', small: 22, medium: 7, large: 2 },
  { week: 'Week 6', small: 25, medium: 6, large: 2 },
];

const prSizeConfig = {
  small: {
    label: 'Small (<100 lines)',
    color: '#22c55e',
  },
  medium: {
    label: 'Medium (100-500)',
    color: '#eab308',
  },
  large: {
    label: 'Large (>500)',
    color: '#ef4444',
  },
} satisfies ChartConfig;

// Mock data for Approval Rate Trend
const approvalRateData = [
  { week: 'Week 1', approved: 85, rejected: 15 },
  { week: 'Week 2', approved: 88, rejected: 12 },
  { week: 'Week 3', approved: 90, rejected: 10 },
  { week: 'Week 4', approved: 91, rejected: 9 },
  { week: 'Week 5', approved: 93, rejected: 7 },
  { week: 'Week 6', approved: 94, rejected: 6 },
];

const approvalRateConfig = {
  approved: {
    label: 'Approved',
    color: '#22c55e',
  },
  rejected: {
    label: 'Rejected',
    color: '#ef4444',
  },
} satisfies ChartConfig;

export default function TrendPage() {
  return (
    <section className="p-4 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Trend</h1>
        <p className="text-sm text-muted-foreground">
          Historical trends and analytics
        </p>
      </div>
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

      {/* Bottom Row: PR Volume Trend & Reviewer Workload Balance Trend */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* PR Volume Trend */}
        <Card className="p-4 flex flex-col">
          <div className="flex flex-col gap-1">
            <CardTitle>PR Volume Trend</CardTitle>
            <CardDescription>
              Total number of pull requests created daily
            </CardDescription>
          </div>
          <ChartContainer config={prVolumeConfig} className="h-[200px] w-full flex-1">
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
              <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
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

      {/* Row 3: Review Cycle Time & First Response Time */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Review Cycle Time Trend */}
        <Card className="p-4 flex flex-col">
          <div className="flex flex-col gap-1">
            <CardTitle>Review Cycle Time Trend</CardTitle>
            <CardDescription>
              Average time from PR creation to merge
            </CardDescription>
          </div>
          <ChartContainer config={cycleTimeConfig} className="h-[200px] w-full flex-1">
            <LineChart
              data={cycleTimeData}
              margin={{ top: 10, right: 10, bottom: 0, left: -20 }}
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
                tickFormatter={(value) => `${value}h`}
                className="text-xs text-muted-foreground"
              />
              <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
              <Line
                type="monotone"
                dataKey="hours"
                stroke="var(--color-hours)"
                strokeWidth={2}
                dot={{ fill: 'var(--color-hours)', stroke: 'var(--card)', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ChartContainer>
          <p className="text-muted-foreground text-sm mt-4">
            Improvement:{' '}
            <span className="text-green-600 font-medium">39% faster</span>
            <span className="text-foreground"> (18.5h → 11.2h)</span>
          </p>
        </Card>

        {/* First Response Time Trend */}
        <Card className="p-4 flex flex-col">
          <div className="flex flex-col gap-1">
            <CardTitle>First Response Time Trend</CardTitle>
            <CardDescription>
              Average time until first reviewer action
            </CardDescription>
          </div>
          <ChartContainer config={firstResponseConfig} className="h-[200px] w-full flex-1">
            <LineChart
              data={firstResponseData}
              margin={{ top: 10, right: 10, bottom: 0, left: -20 }}
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
                tickFormatter={(value) => `${value}m`}
                className="text-xs text-muted-foreground"
              />
              <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
              <Line
                type="monotone"
                dataKey="minutes"
                stroke="var(--color-minutes)"
                strokeWidth={2}
                dot={{ fill: 'var(--color-minutes)', stroke: 'var(--card)', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ChartContainer>
          <p className="text-muted-foreground text-sm mt-4">
            Target: 30 min → Current:{' '}
            <span className="text-green-600 font-medium">22 min</span>
            <Check className="inline h-4 w-4 text-green-600 ml-1" />
          </p>
        </Card>
      </div>

      {/* Row 4: Rework Rate & PR Size Distribution */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Rework Rate Trend */}
        <Card className="p-4 flex flex-col">
          <div className="flex flex-col gap-1">
            <CardTitle>Rework Rate Trend</CardTitle>
            <CardDescription>
              Percentage of PRs requiring multiple review cycles
            </CardDescription>
          </div>
          <ChartContainer config={reworkRateConfig} className="h-[200px] w-full flex-1">
            <AreaChart
              data={reworkRateData}
              margin={{ top: 10, right: 10, bottom: 0, left: -20 }}
            >
              <defs>
                <linearGradient id="reworkGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-percentage)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--color-percentage)" stopOpacity={0} />
                </linearGradient>
              </defs>
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
                tickFormatter={(value) => `${value}%`}
                className="text-xs text-muted-foreground"
              />
              <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
              <Area
                type="monotone"
                dataKey="percentage"
                stroke="var(--color-percentage)"
                strokeWidth={2}
                fill="url(#reworkGradient)"
              />
            </AreaChart>
          </ChartContainer>
          <p className="text-muted-foreground text-sm mt-4">
            Rework rate:{' '}
            <span className="text-green-600 font-medium">57% reduction</span>
            <span className="text-foreground"> (28% → 12%)</span>
          </p>
        </Card>

        {/* PR Size Distribution Trend */}
        <Card className="p-4 flex flex-col">
          <div className="flex flex-col gap-1">
            <CardTitle>PR Size Distribution Trend</CardTitle>
            <CardDescription>
              Small, medium, and large PRs over time
            </CardDescription>
          </div>
          <ChartContainer config={prSizeConfig} className="h-[200px] w-full flex-1">
            <BarChart
              data={prSizeData}
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
              <Bar dataKey="small" stackId="size" fill="var(--color-small)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="medium" stackId="size" fill="var(--color-medium)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="large" stackId="size" fill="var(--color-large)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
          <p className="text-muted-foreground text-sm mt-4">
            Trend:{' '}
            <span className="text-green-600 font-medium">More small PRs</span>
            <span className="text-foreground"> (better for reviews)</span>
          </p>
        </Card>
      </div>

      {/* Row 5: Approval Rate Trend */}
      <Card className="p-4 flex flex-col">
        <div className="flex flex-col gap-1">
          <CardTitle>Approval Rate Trend</CardTitle>
          <CardDescription>
            Percentage of PRs approved vs rejected over time
          </CardDescription>
        </div>
        <ChartContainer config={approvalRateConfig} className="h-[200px] w-full">
          <BarChart
            data={approvalRateData}
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
              tickFormatter={(value) => `${value}%`}
              domain={[0, 100]}
              className="text-xs text-muted-foreground"
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="approved" stackId="approval" fill="var(--color-approved)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="rejected" stackId="approval" fill="var(--color-rejected)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
        <p className="text-muted-foreground text-sm mt-4">
          Current approval rate:{' '}
          <span className="text-green-600 font-medium">94%</span>
          <span className="text-foreground"> (up from 85%)</span>
        </p>
      </Card>
    </section>
  );
}
