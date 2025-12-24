'use client';

import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
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

interface ApprovalData {
  week: string;
  approved: number;
  rejected: number;
}

const approvalRateConfig = {
  approved: {
    label: 'Approved',
    color: '#22c55e',
  },
  rejected: {
    label: 'Changes Requested',
    color: '#ef4444',
  },
} satisfies ChartConfig;

async function fetchApprovalData(
  timeRange: TrendChartProps['timeRange'],
  organizationId: string
): Promise<ApprovalData[]> {
  await verifyOrgAccess(organizationId);

  const supabase = createClient();
  const startDate = getDateRangeFromTimeRange(timeRange);
  const numWeeks = getWeeksFromTimeRange(timeRange);
  const repoIds = await getOrgRepositoryIds(organizationId);

  if (repoIds.length === 0) {
    return Array(numWeeks)
      .fill(null)
      .map((_, i) => ({ week: getWeekLabel(i), approved: 0, rejected: 0 }));
  }

  // Get review assignments with status
  const { data: assignments } = await supabase
    .from('review_assignments')
    .select(
      `
      id,
      status,
      assigned_at,
      pull_request:pull_requests!inner (
        id,
        repository_id
      )
    `
    )
    .in('pull_request.repository_id', repoIds)
    .in('status', ['approved', 'changes_requested'])
    .gte('assigned_at', startDate.toISOString());

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const startTime = startDate.getTime();

  // Initialize weekly data
  const weeklyApproved: number[] = Array(numWeeks).fill(0);
  const weeklyRejected: number[] = Array(numWeeks).fill(0);

  if (assignments) {
    for (const assignment of assignments) {
      const assignedAt = new Date(assignment.assigned_at);
      const weekIndex = Math.floor(
        (assignedAt.getTime() - startTime) / msPerWeek
      );

      if (weekIndex >= 0 && weekIndex < numWeeks) {
        if (assignment.status === 'approved') {
          weeklyApproved[weekIndex]++;
        } else if (assignment.status === 'changes_requested') {
          weeklyRejected[weekIndex]++;
        }
      }
    }
  }

  // Convert counts to percentages
  return Array(numWeeks)
    .fill(null)
    .map((_, i) => {
      const total = weeklyApproved[i] + weeklyRejected[i];
      return {
        week: getWeekLabel(i),
        approved: total > 0 ? Math.round((weeklyApproved[i] / total) * 100) : 0,
        rejected: total > 0 ? Math.round((weeklyRejected[i] / total) * 100) : 0,
      };
    });
}

export function ApprovalRateChart({
  timeRange,
  organizationId,
}: TrendChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['approval-rate-chart', timeRange, organizationId],
    queryFn: () => fetchApprovalData(timeRange, organizationId),
    enabled: !!organizationId,
  });

  if (isLoading || !data) {
    return <TrendChartSkeleton chartType="bar" />;
  }

  // Calculate current approval rate
  const nonZeroValues = data.filter((d) => d.approved > 0 || d.rejected > 0);
  const currentApproved =
    nonZeroValues.length > 0
      ? nonZeroValues[nonZeroValues.length - 1].approved
      : 0;
  const firstApproved =
    nonZeroValues.length > 0 ? nonZeroValues[0].approved : 0;

  return (
    <Card className="flex flex-col p-4 transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1">
        <CardTitle>Approval Rate Trend</CardTitle>
        <CardDescription>
          Percentage of PRs approved vs rejected over time
        </CardDescription>
      </div>
      <ChartContainer config={approvalRateConfig} className="h-[200px] w-full">
        <BarChart
          data={data}
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
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar
            dataKey="approved"
            stackId="approval"
            fill="var(--color-approved)"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="rejected"
            stackId="approval"
            fill="var(--color-rejected)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ChartContainer>
      <p className="mt-4 text-muted-foreground text-sm">
        Current approval rate:{' '}
        {currentApproved > 0 ? (
          <>
            <span className="font-medium text-green-600">
              {currentApproved}%
            </span>
            {firstApproved > 0 && firstApproved !== currentApproved && (
              <span className="text-foreground">
                {' '}
                ({currentApproved > firstApproved ? 'up' : 'down'} from{' '}
                {firstApproved}%)
              </span>
            )}
          </>
        ) : (
          <span className="text-muted-foreground">No data</span>
        )}
      </p>
    </Card>
  );
}
