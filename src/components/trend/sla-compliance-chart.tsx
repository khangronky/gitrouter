'use client';

import { useQuery } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { createClient } from '@/lib/supabase/client';
import { TrendChartSkeleton } from './trend-skeleton';
import {
  getDateRangeFromTimeRange,
  getOrgRepositoryIds,
  getWeekLabel,
  getWeeksFromTimeRange,
  type TrendChartProps,
  verifyOrgAccess,
} from './utils';

interface SlaData {
  date: string;
  percentage: number;
}

const slaComplianceConfig = {
  percentage: {
    label: 'Percentage',
    color: '#16a34a',
  },
} satisfies ChartConfig;

// SLA threshold in hours and target percentage
const SLA_THRESHOLD_HOURS = 4;
const TARGET_PERCENTAGE = 80;

async function fetchSlaData(
  timeRange: TrendChartProps['timeRange'],
  organizationId: string
): Promise<SlaData[]> {
  await verifyOrgAccess(organizationId);

  const supabase = createClient();
  const startDate = getDateRangeFromTimeRange(timeRange);
  const numWeeks = getWeeksFromTimeRange(timeRange);
  const repoIds = await getOrgRepositoryIds(organizationId);

  if (repoIds.length === 0) {
    return Array(numWeeks)
      .fill(null)
      .map((_, i) => ({ date: getWeekLabel(i), percentage: 0 }));
  }

  // Get review assignments with review times
  const { data: assignments } = await supabase
    .from('review_assignments')
    .select(
      `
      id,
      assigned_at,
      reviewed_at,
      pull_request:pull_requests!inner (
        id,
        repository_id
      )
    `
    )
    .in('pull_request.repository_id', repoIds)
    .not('reviewed_at', 'is', null)
    .gte('assigned_at', startDate.toISOString());

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const startTime = startDate.getTime();

  // Initialize weekly data
  const weeklySlaCount: number[] = Array(numWeeks).fill(0);
  const weeklyTotalCount: number[] = Array(numWeeks).fill(0);

  if (assignments) {
    for (const assignment of assignments) {
      if (assignment.reviewed_at && assignment.assigned_at) {
        const assignedAt = new Date(assignment.assigned_at);
        const reviewedAt = new Date(assignment.reviewed_at);
        const weekIndex = Math.floor(
          (assignedAt.getTime() - startTime) / msPerWeek
        );

        if (weekIndex >= 0 && weekIndex < numWeeks) {
          weeklyTotalCount[weekIndex]++;

          const hoursToReview =
            (reviewedAt.getTime() - assignedAt.getTime()) / (1000 * 60 * 60);
          if (hoursToReview <= SLA_THRESHOLD_HOURS) {
            weeklySlaCount[weekIndex]++;
          }
        }
      }
    }
  }

  return Array(numWeeks)
    .fill(null)
    .map((_, i) => ({
      date: getWeekLabel(i),
      percentage:
        weeklyTotalCount[i] > 0
          ? Math.round((weeklySlaCount[i] / weeklyTotalCount[i]) * 100)
          : 0,
    }));
}

export function SlaComplianceChart({
  timeRange,
  organizationId,
}: TrendChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['sla-compliance-chart', timeRange, organizationId],
    queryFn: () => fetchSlaData(timeRange, organizationId),
    enabled: !!organizationId,
  });

  if (isLoading || !data) {
    return <TrendChartSkeleton chartType="line" />;
  }

  // Get current value
  const nonZeroValues = data.filter((d) => d.percentage > 0);
  const currentValue =
    nonZeroValues.length > 0
      ? nonZeroValues[nonZeroValues.length - 1].percentage
      : 0;
  const meetingTarget = currentValue >= TARGET_PERCENTAGE;

  return (
    <Card className="flex flex-col p-4 transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <CardTitle>SLA Compliance Trend</CardTitle>
        <CardDescription>
          Percentage of PRs meeting the {SLA_THRESHOLD_HOURS}-hour review target
        </CardDescription>
      </div>
      <ChartContainer
        config={slaComplianceConfig}
        className="h-[200px] w-full flex-1"
      >
        <LineChart
          data={data}
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
            className="text-muted-foreground text-xs"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => `${value}%`}
            domain={[0, 100]}
            className="text-muted-foreground text-xs"
          />
          <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
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
      <p className="mt-4 flex items-center gap-1 text-muted-foreground text-sm">
        Target: {TARGET_PERCENTAGE}% → Current:{' '}
        {currentValue > 0 ? (
          <>
            <span className="font-medium text-foreground">{currentValue}%</span>
            {meetingTarget ? (
              <>
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-green-600">(Above target)</span>
              </>
            ) : (
              <>
                <X className="h-4 w-4 text-red-600" />
                <span className="text-red-600">(Below target)</span>
              </>
            )}
          </>
        ) : (
          <span className="text-muted-foreground">No data</span>
        )}
      </p>
    </Card>
  );
}
