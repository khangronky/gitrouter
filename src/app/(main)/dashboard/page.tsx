'use client';

import { useState, useEffect, useCallback } from 'react';
import { BottlenecksTable } from '@/components/dashboard/bottlenecks-table';
import { KpiRow } from '@/components/dashboard/kpi-row';
import { LatencyChart } from '@/components/dashboard/latency-chart';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { StalePullRequests } from '@/components/dashboard/stale-pull-requests';
import { WorkloadChart } from '@/components/dashboard/workload-chart';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';
import type {
  TimeRange,
  KpiRowData,
  LatencySeries,
  ReviewerWorkloadSeries,
  BottlenecksList,
  StalePullRequestsList,
  RecentActivityList, 
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

interface DashboardData {
  kpis: KpiRowData;
  latencySeries: LatencySeries;
  reviewerWorkload: ReviewerWorkloadSeries;
  bottlenecks: BottlenecksList;
  stalePRs: StalePullRequestsList;
  recentActivity: RecentActivityList;
  timeRange: TimeRange;
}

interface DashboardResponse {
  success: boolean;
  data: DashboardData;
  timestamp: string;
  timeRange: TimeRange;
  error?: string;
  message?: string;
}

export default function Page() {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );

  const fetchDashboard = useCallback(async (range: TimeRange) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/dashboard?timeRange=${range}`);
      const data: DashboardResponse = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.message || data.error || 'Failed to fetch dashboard data'
        );
        return;
      }

      setDashboardData(data.data);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError('Failed to connect to the server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard(timeRange);
  }, [timeRange, fetchDashboard]);

  const handleTimeRangeChange = (value: string) => {
    if (value) {
      setTimeRange(value as TimeRange);
    }
  };  

  if (isLoading && !dashboardData) {
    return <DashboardSkeleton />;
  }

  // Use dashboard data or fallbacks
  const kpis = dashboardData?.kpis || fallbackKpis;
  const latencySeries = dashboardData?.latencySeries?.length
    ? dashboardData.latencySeries
    : fallbackLatencySeries;
  const reviewerWorkload = dashboardData?.reviewerWorkload || [];
  const bottlenecks = dashboardData?.bottlenecks || [];
  const stalePRs = dashboardData?.stalePRs || [];
  const recentActivity = dashboardData?.recentActivity || [];

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

        {error && (
          <div className="mb-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">{error}</p>
            <button
              onClick={() => fetchDashboard(timeRange)}
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

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <BottlenecksTable
              bottlenecks={bottlenecks}
              className="lg:col-span-3"
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
