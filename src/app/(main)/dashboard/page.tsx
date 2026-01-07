'use client';

import { useState } from 'react';
import { BottlenecksTable } from '@/components/dashboard/bottlenecks-table';
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';
import { KpiRow } from '@/components/dashboard/kpi-row';
import { LatencyChart } from '@/components/dashboard/latency-chart';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { StalePullRequests } from '@/components/dashboard/stale-pull-requests';
import { WorkloadChart } from '@/components/dashboard/workload-chart';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCurrentOrganization } from '@/hooks/use-current-organization';
import { useDashboardData } from '@/lib/api/dashboard';
import type {
  KpiRowData,
  LatencySeries,
  TimeRange,
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
    <section className="p-4">
      <div className="mb-4 flex flex-row items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            {timeRange === '7d' && 'Showing data for the last 7 days'}
            {timeRange === '30d' && 'Showing data for the last 30 days'}
            {timeRange === '3m' && 'Showing data for the last 3 months'}
          </p>
        </div>
        <Tabs value={timeRange} onValueChange={handleTimeRangeChange}>
          <TabsList className="h-10 gap-1 bg-foreground/10 p-1">
            <TabsTrigger value="3m" className="cursor-pointer px-3">
              Last 3 months
            </TabsTrigger>
            <TabsTrigger value="30d" className="cursor-pointer px-3">
              Last 30 days
            </TabsTrigger>
            <TabsTrigger value="7d" className="cursor-pointer px-3">
              Last 7 days
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {errorMessage && (
        <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-4">
          <p className="text-destructive text-sm">{errorMessage}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-2 text-primary text-sm hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      <div className={isLoading ? 'pointer-events-none opacity-60' : ''}>
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
  );
}
