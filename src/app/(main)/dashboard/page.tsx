'use client';

import { useState } from 'react';
import { BottlenecksTable } from '@/components/dashboard/bottlenecks-table';
import { KpiRow } from '@/components/dashboard/kpi-row';
import { LatencyChart } from '@/components/dashboard/latency-chart';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { StalePullRequests } from '@/components/dashboard/stale-pull-requests';
import { WorkloadChart } from '@/components/dashboard/workload-chart';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';
import { useCurrentOrganization } from '@/hooks/use-current-organization';
import { useDashboardData } from '@/lib/api/dashboard';
import type {
  TimeRange,
  KpiRowData,
  LatencySeries,
} from '@/lib/schema/dashboard';

// Fallback data for when API returns empty or during initial load
const fallbackKpis: KpiRowData = {
  totalPRs: { value: 0, delta: 0, note: 'from last period' },
  pending: { value: 0, delta: 0, note: 'from last period' },
  sla: { value: 0, delta: 0, note: 'from last period' },
  approved: { value: 0, delta: 0, note: 'from last period' },
};

const fallbackLatencySeries: LatencySeries = [
  { day: 'Mon', hours: 0 },
  { day: 'Tue', hours: 0 },
  { day: 'Wed', hours: 0 },
  { day: 'Thu', hours: 0 },
  { day: 'Fri', hours: 0 },
  { day: 'Sat', hours: 0 },
  { day: 'Sun', hours: 0 },
];

export default function Page() {
  const { currentOrgId, isLoading: orgLoading } = useCurrentOrganization();
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useDashboardData(currentOrgId || '', timeRange);

  const handleTimeRangeChange = (value: string) => {
    if (value) {
      setTimeRange(value as TimeRange);
    }
  };

  if ((isLoading || orgLoading) && !response?.data) {
    return <DashboardSkeleton />;
  }

  // Use dashboard data or fallbacks
  const dashboardData = response?.data;
  const kpis = dashboardData?.kpis || fallbackKpis;
  const latencySeries = dashboardData?.latencySeries?.length
    ? dashboardData.latencySeries
    : fallbackLatencySeries;
  const reviewerWorkload = dashboardData?.reviewerWorkload || [];
  const bottlenecks = dashboardData?.bottlenecks || [];
  const stalePRs = dashboardData?.stalePRs || [];
  const recentActivity = dashboardData?.recentActivity || [];

  // Extract error message
  const errorMessage = error
    ? error instanceof Error
      ? error.message
      : 'Failed to fetch dashboard data'
    : null;

  return (
    <>
      <section className="p-4">
        <div className="flex flex-row justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              {timeRange === '7d' && 'Showing data for the last 7 days'}
              {timeRange === '30d' && 'Showing data for the last 30 days'}
              {timeRange === '3m' && 'Showing data for the last 3 months'}
            </p>
          </div>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={handleTimeRangeChange}
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="3m">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
        </div>

        {errorMessage && (
          <div className="mb-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">{errorMessage}</p>
            <button
              onClick={() => refetch()}
              className="mt-2 text-sm text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        <div className={isLoading ? 'opacity-60 pointer-events-none' : ''}>
          <KpiRow kpis={kpis} />

          <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <LatencyChart
              latencySeries={latencySeries}
              className="lg:col-span-2"
            />
            <WorkloadChart reviewerWorkload={reviewerWorkload} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <BottlenecksTable
              bottlenecks={bottlenecks}
              className="lg:col-span-2"
            />
            <StalePullRequests stalePRs={stalePRs} className="lg:col-span-1" />
            <RecentActivity
              recentActivity={recentActivity}
              className="lg:col-span-1"
            />
          </div>
        </div>
      </section>
    </>
  );
}
