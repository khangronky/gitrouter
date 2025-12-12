'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  XAxis,
  YAxis,
} from 'recharts';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

// Mock data for PR Review Speed Table
const reviewerPerformanceData = [
  { reviewer: '@alice', avgTime: '2.4 hours', prsReviewed: 45, sla: '98%', trend: 'up' },
  { reviewer: '@bob', avgTime: '3.1 hours', prsReviewed: 38, sla: '92%', trend: 'up' },
  { reviewer: '@charlie', avgTime: '2.8 hours', prsReviewed: 42, sla: '95%', trend: 'up' },
  { reviewer: '@diana', avgTime: '2.2 hours', prsReviewed: 51, sla: '99%', trend: 'up' },
  { reviewer: '@eve', avgTime: '3.5 hours', prsReviewed: 35, sla: '88%', trend: 'down' },
  { reviewer: '@frank', avgTime: '2.6 hours', prsReviewed: 40, sla: '96%', trend: 'up' },
];

// Mock data for Repository Comparison
const repoComparisonData = [
  { repo: 'frontend', hours: 2.8 },
  { repo: 'backend', hours: 4.2 },
  { repo: 'api', hours: 3.1 },
  { repo: 'mobile', hours: 3.5 },
  { repo: 'infra', hours: 1.8 },
  { repo: 'docs', hours: 1.2 },
];

// Mock data for Team Speed Improvement Trend
const teamSpeedData = [
  { week: 'Week 1', hours: 7.2 },
  { week: 'Week 2', hours: 6.5 },
  { week: 'Week 3', hours: 5.8 },
  { week: 'Week 4', hours: 5.2 },
  { week: 'Week 5', hours: 4.5 },
  { week: 'Week 6', hours: 3.8 },
  { week: 'Week 7', hours: 3.1 },
];

// Mock data for Review Throughput (additional chart)
const reviewThroughputData = [
  { day: 'Mon', reviews: 24 },
  { day: 'Tue', reviews: 32 },
  { day: 'Wed', reviews: 28 },
  { day: 'Thu', reviews: 35 },
  { day: 'Fri', reviews: 22 },
  { day: 'Sat', reviews: 8 },
  { day: 'Sun', reviews: 5 },
];

const repoComparisonConfig = {
  hours: {
    label: 'Hours',
    color: '#6366f1',
  },
} satisfies ChartConfig;

const teamSpeedConfig = {
  hours: {
    label: 'Hours',
    color: '#10b981',
  },
} satisfies ChartConfig;

const reviewThroughputConfig = {
  reviews: {
    label: 'Reviews',
    color: '#f59e0b',
  },
} satisfies ChartConfig;

// Mock data for Review Quality Score (Radar)
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

// Mock data for PR Size by Author
const prSizeByAuthorData = [
  { author: 'Alice', small: 15, medium: 8, large: 2 },
  { author: 'Bob', small: 10, medium: 12, large: 5 },
  { author: 'Charlie', small: 18, medium: 6, large: 1 },
  { author: 'Diana', small: 12, medium: 10, large: 3 },
];

const prSizeByAuthorConfig = {
  small: { label: 'Small', color: '#22c55e' },
  medium: { label: 'Medium', color: '#eab308' },
  large: { label: 'Large', color: '#ef4444' },
} satisfies ChartConfig;

// Mock data for Response Time by Hour
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

// Mock data for Merge Success Rate
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

// Mock data for Review Comments Distribution
const commentsDistributionData = [
  { reviewer: 'Alice', comments: 8.5 },
  { reviewer: 'Bob', comments: 4.2 },
  { reviewer: 'Charlie', comments: 12.1 },
  { reviewer: 'Diana', comments: 6.8 },
  { reviewer: 'Eve', comments: 3.5 },
  { reviewer: 'Frank', comments: 7.2 },
];

const commentsDistributionConfig = {
  comments: {
    label: 'Avg Comments',
    color: '#0ea5e9',
  },
} satisfies ChartConfig;

// Mock data for Bottleneck Frequency
const bottleneckData = [
  { reviewer: 'Alice', frequency: 3 },
  { reviewer: 'Bob', frequency: 8 },
  { reviewer: 'Charlie', frequency: 2 },
  { reviewer: 'Diana', frequency: 5 },
  { reviewer: 'Eve', frequency: 12 },
  { reviewer: 'Frank', frequency: 4 },
];

const bottleneckConfig = {
  frequency: {
    label: 'Bottleneck Count',
    color: '#ef4444',
  },
} satisfies ChartConfig;

export default function PerformancePage() {
  return (
    <section className="p-4 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Performance</h1>
        <p className="text-sm text-muted-foreground">
          Team and repository performance metrics
        </p>
      </div>

      {/* Top Row: PR Review Speed Table & Repository Comparison Chart */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* PR Review Speed Trend Table */}
        <Card className="p-4 flex flex-col">
          <div className="flex flex-col gap-1 mb-4">
            <CardTitle>PR Review Speed Trend</CardTitle>
            <CardDescription>
              Individual reviewer performance metrics
            </CardDescription>
          </div>
          <div className="rounded-lg border flex-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reviewer</TableHead>
                  <TableHead>Avg Review Time</TableHead>
                  <TableHead className="text-center">PRs Reviewed</TableHead>
                  <TableHead className="text-center">SLA %</TableHead>
                  <TableHead className="text-center">Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviewerPerformanceData.map((row) => (
                  <TableRow key={row.reviewer}>
                    <TableCell className="font-medium">{row.reviewer}</TableCell>
                    <TableCell>{row.avgTime}</TableCell>
                    <TableCell className="text-center">{row.prsReviewed}</TableCell>
                    <TableCell className="text-center">{row.sla}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={
                          row.trend === 'up'
                            ? 'text-green-600 border-green-200 bg-green-50'
                            : 'text-red-600 border-red-200 bg-red-50'
                        }
                      >
                        {row.trend === 'up' ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {row.trend === 'up' ? 'Up' : 'Down'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-muted-foreground text-sm mt-4 flex items-center gap-1">
            Current Trend: <TrendingDown className="h-4 w-4 text-green-600" />
            <span className="text-green-600 font-medium">Improving</span>
            <span className="text-foreground">(avg 4.2h → 3.1h)</span>
          </p>
        </Card>

        {/* Repository Comparison Chart */}
        <Card className="p-4 flex flex-col">
          <div className="flex flex-col gap-1">
            <CardTitle>Repository Comparison (Avg Review Time)</CardTitle>
            <CardDescription>
              Average review time by repository
            </CardDescription>
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
              <Bar
                dataKey="hours"
                fill="var(--color-hours)"
                radius={4}
              >
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
      </div>

      {/* Bottom Row: Team Speed Improvement & Review Throughput */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Team Speed Improvement Trend */}
        <Card className="p-4 flex flex-col">
          <div className="flex flex-col gap-1">
            <CardTitle>Team Speed Improvement Trend</CardTitle>
            <CardDescription>
              Average team review time over the past weeks
            </CardDescription>
          </div>
          <ChartContainer
            config={teamSpeedConfig}
            className="h-[200px] w-full flex-1"
          >
            <AreaChart
              data={teamSpeedData}
              margin={{ top: 10, right: 10, bottom: 0, left: -20 }}
            >
              <defs>
                <linearGradient id="speedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="var(--color-hours)"
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--color-hours)"
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
              <Area
                type="monotone"
                dataKey="hours"
                stroke="var(--color-hours)"
                strokeWidth={2}
                fill="url(#speedGradient)"
              />
            </AreaChart>
          </ChartContainer>
          <p className="text-muted-foreground text-sm mt-4 flex items-center gap-1">
            Overall Trend: <TrendingDown className="h-4 w-4 text-green-600" />
            <span className="text-green-600 font-medium">Getting Faster</span>
            <span className="text-foreground">(7.2h → 3.1h over 7 weeks)</span>
          </p>
        </Card>

        {/* Review Throughput Chart (Additional) */}
        <Card className="p-4 flex flex-col">
          <div className="flex flex-col gap-1">
            <CardTitle>Daily Review Throughput</CardTitle>
            <CardDescription>
              Number of reviews completed per day
            </CardDescription>
          </div>
          <ChartContainer
            config={reviewThroughputConfig}
            className="h-[200px] w-full flex-1"
          >
            <BarChart
              data={reviewThroughputData}
              margin={{ top: 10, right: 10, bottom: 0, left: -20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
              />
              <XAxis
                dataKey="day"
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
              <Bar
                dataKey="reviews"
                fill="var(--color-reviews)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
          <p className="text-muted-foreground text-sm mt-4">
            Peak day:{' '}
            <span className="text-foreground font-medium">Thursday (35 reviews)</span>
            {' | '}
            Weekly avg:{' '}
            <span className="text-foreground font-medium">22 reviews/day</span>
          </p>
        </Card>
      </div>

      {/* Row 3: Review Quality Score & PR Size by Author */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Review Quality Score (Radar) */}
        <Card className="p-4 flex flex-col">
          <div className="flex flex-col gap-1">
            <CardTitle>Review Quality Score</CardTitle>
            <CardDescription>
              Composite quality metrics per reviewer
            </CardDescription>
          </div>
          <ChartContainer config={reviewQualityConfig} className="h-[280px] w-full flex-1">
            <RadarChart data={reviewQualityData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
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

        {/* PR Size by Author */}
        <Card className="p-4 flex flex-col">
          <div className="flex flex-col gap-1">
            <CardTitle>PR Size by Author</CardTitle>
            <CardDescription>
              Distribution of PR sizes per team member
            </CardDescription>
          </div>
          <ChartContainer config={prSizeByAuthorConfig} className="h-[280px] w-full flex-1">
            <BarChart
              data={prSizeByAuthorData}
              margin={{ top: 20, right: 10, bottom: 0, left: -20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="author" tickLine={false} axisLine={false} tickMargin={8} className="text-xs" />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="small" stackId="size" fill="var(--color-small)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="medium" stackId="size" fill="var(--color-medium)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="large" stackId="size" fill="var(--color-large)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
          <div className="mt-4 flex items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-sm bg-[#22c55e]" />
              <span>Small</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-sm bg-[#eab308]" />
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-sm bg-[#ef4444]" />
              <span>Large</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Row 4: Response Time by Hour & Merge Success Rate */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Response Time by Hour */}
        <Card className="p-4 flex flex-col">
          <div className="flex flex-col gap-1">
            <CardTitle>Response Time by Hour</CardTitle>
            <CardDescription>
              When reviewers are fastest to respond
            </CardDescription>
          </div>
          <ChartContainer config={responseByHourConfig} className="h-[200px] w-full flex-1">
            <BarChart
              data={responseByHourData}
              margin={{ top: 10, right: 10, bottom: 0, left: -20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="hour" tickLine={false} axisLine={false} tickMargin={8} className="text-xs" />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v) => `${v}m`} className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="avgMinutes" fill="var(--color-avgMinutes)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
          <p className="text-muted-foreground text-sm mt-4">
            Fastest:{' '}
            <span className="text-foreground font-medium">10am (12 min avg)</span>
            {' | '}
            Slowest:{' '}
            <span className="text-foreground font-medium">12pm (35 min avg)</span>
          </p>
        </Card>

        {/* Merge Success Rate */}
        <Card className="p-4 flex flex-col">
          <div className="flex flex-col gap-1">
            <CardTitle>Merge Success Rate</CardTitle>
            <CardDescription>
              Percentage of PRs that merge without issues
            </CardDescription>
          </div>
          <ChartContainer config={mergeSuccessConfig} className="mt-4 h-[180px] w-full flex-1">
            <BarChart
              data={mergeSuccessData}
              layout="vertical"
              margin={{ top: 0, right: 30, bottom: 0, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={false} stroke="var(--border)" />
              <XAxis type="number" hide domain={[0, 100]} />
              <YAxis type="category" dataKey="repo" hide />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="rate" fill="var(--color-rate)" radius={4}>
                <LabelList dataKey="repo" position="insideLeft" offset={8} className="fill-white" fontSize={12} />
                <LabelList dataKey="rate" position="right" offset={8} className="fill-foreground" fontSize={12} formatter={(v: number) => `${v}%`} />
              </Bar>
            </BarChart>
          </ChartContainer>
          <p className="text-muted-foreground text-sm mt-4">
            Team avg:{' '}
            <span className="text-green-600 font-medium">92%</span>
            <span className="text-foreground"> success rate</span>
          </p>
        </Card>
      </div>

      {/* Row 5: Review Comments Distribution & Bottleneck Frequency */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Review Comments Distribution */}
        <Card className="p-4 flex flex-col">
          <div className="flex flex-col gap-1">
            <CardTitle>Review Comments Distribution</CardTitle>
            <CardDescription>
              Average comments per review by reviewer
            </CardDescription>
          </div>
          <ChartContainer config={commentsDistributionConfig} className="h-[200px] w-full flex-1">
            <BarChart
              data={commentsDistributionData}
              margin={{ top: 10, right: 10, bottom: 0, left: -20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="reviewer" tickLine={false} axisLine={false} tickMargin={8} className="text-xs" />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="comments" fill="var(--color-comments)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
          <p className="text-muted-foreground text-sm mt-4">
            Most thorough:{' '}
            <span className="text-foreground font-medium">Charlie (12.1 avg)</span>
            {' | '}
            Team avg:{' '}
            <span className="text-foreground font-medium">7.0 comments</span>
          </p>
        </Card>

        {/* Bottleneck Frequency */}
        <Card className="p-4 flex flex-col">
          <div className="flex flex-col gap-1">
            <CardTitle>Bottleneck Frequency</CardTitle>
            <CardDescription>
              How often each reviewer becomes a bottleneck
            </CardDescription>
          </div>
          <ChartContainer config={bottleneckConfig} className="h-[200px] w-full flex-1">
            <BarChart
              data={bottleneckData}
              margin={{ top: 10, right: 10, bottom: 0, left: -20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="reviewer" tickLine={false} axisLine={false} tickMargin={8} className="text-xs" />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="frequency" fill="var(--color-frequency)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
          <p className="text-muted-foreground text-sm mt-4">
            Highest risk:{' '}
            <span className="text-red-600 font-medium">Eve (12 times)</span>
            {' | '}
            Lowest:{' '}
            <span className="text-green-600 font-medium">Charlie (2 times)</span>
          </p>
        </Card>
      </div>
    </section>
  );
}
