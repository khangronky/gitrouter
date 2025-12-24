'use client';

import { Activity, GitBranch, Users } from 'lucide-react';
import { useState } from 'react';
import {
  BottleneckChart,
  MergeSuccessChart,
  PerformanceKpiRow,
  PrSizeByAuthorChart,
  RepoComparisonChart,
  ReviewerPerformanceTable,
  ReviewThroughputChart,
  TimeToFirstReviewChart,
  WorkloadDistributionChart,
} from '@/components/performance';
import { PerformanceSkeleton } from '@/components/performance/performance-skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useCurrentOrganization } from '@/hooks/use-current-organization';
import { usePerformanceData } from '@/lib/api/performance';
import type { PerformanceTimeRange } from '@/lib/schema/performance';

export default function PerformancePage() {
  const [timeRange, setTimeRange] = useState<PerformanceTimeRange>('7d');
  const { currentOrgId, isLoading: orgLoading } = useCurrentOrganization();

  const {
    data: response,
    isLoading,
    error,
  } = usePerformanceData(currentOrgId || '', timeRange);

  const handleTimeRangeChange = (value: string) => {
    if (value) {
      setTimeRange(value as PerformanceTimeRange);
    }
  };

  if (orgLoading || !currentOrgId || isLoading) {
    return <PerformanceSkeleton />;
  }

  const performanceData = response?.data;

  return (
    <section className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Performance</h1>
          <p className="text-muted-foreground text-sm">
            {timeRange === '7d' &&
              'Team and repository metrics for the last 7 days'}
            {timeRange === '30d' &&
              'Team and repository metrics for the last 30 days'}
            {timeRange === '3m' &&
              'Team and repository metrics for the last 3 months'}
          </p>
        </div>
        <ToggleGroup
          type="single"
          value={timeRange}
          onValueChange={handleTimeRangeChange}
          variant="outline"
          size="sm"
        >
          <ToggleGroupItem value="7d">7 days</ToggleGroupItem>
          <ToggleGroupItem value="30d">30 days</ToggleGroupItem>
          <ToggleGroupItem value="3m">3 months</ToggleGroupItem>
        </ToggleGroup>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
          <p className="text-sm text-destructive">
            {error instanceof Error ? error.message : 'Failed to fetch performance data'}
          </p>
        </div>
      )}

      <div className={isLoading ? 'opacity-60 pointer-events-none' : ''}>
        {/* Summary KPIs */}
        <PerformanceKpiRow data={performanceData?.kpis} />

        {/* Tabbed Charts */}
        <Tabs defaultValue="reviewers" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="reviewers" className="gap-2">
              <Users className="h-4 w-4" />
              Reviewers
            </TabsTrigger>
            <TabsTrigger value="repositories" className="gap-2">
              <GitBranch className="h-4 w-4" />
              Repositories
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <Activity className="h-4 w-4" />
              Activity
            </TabsTrigger>
          </TabsList>

          {/* Reviewers Tab */}
          <TabsContent value="reviewers" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div
                className="fade-in-50 slide-in-from-bottom-2 animate-in duration-300"
                style={{ animationDelay: '0ms' }}
              >
                <ReviewerPerformanceTable data={performanceData?.reviewerPerformance} />
              </div>
              <div
                className="fade-in-50 slide-in-from-bottom-2 animate-in duration-300"
                style={{ animationDelay: '75ms', animationFillMode: 'backwards' }}
              >
                <WorkloadDistributionChart data={performanceData?.workloadDistribution} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div
                className="fade-in-50 slide-in-from-bottom-2 animate-in duration-300"
                style={{
                  animationDelay: '150ms',
                  animationFillMode: 'backwards',
                }}
              >
                <TimeToFirstReviewChart data={performanceData?.timeToFirstReview} />
              </div>
              <div
                className="fade-in-50 slide-in-from-bottom-2 animate-in duration-300"
                style={{
                  animationDelay: '225ms',
                  animationFillMode: 'backwards',
                }}
              >
                <BottleneckChart data={performanceData?.bottlenecks} />
              </div>
            </div>
            <div
              className="fade-in-50 slide-in-from-bottom-2 animate-in duration-300"
              style={{ animationDelay: '300ms', animationFillMode: 'backwards' }}
            >
              <PrSizeByAuthorChart data={performanceData?.prSizeByAuthor} />
            </div>
          </TabsContent>

          {/* Repositories Tab */}
          <TabsContent value="repositories" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div
                className="fade-in-50 slide-in-from-bottom-2 animate-in duration-300"
                style={{ animationDelay: '0ms' }}
              >
                <RepoComparisonChart data={performanceData?.repoComparison} />
              </div>
              <div
                className="fade-in-50 slide-in-from-bottom-2 animate-in duration-300"
                style={{ animationDelay: '75ms', animationFillMode: 'backwards' }}
              >
                <MergeSuccessChart data={performanceData?.mergeSuccess} />
              </div>
            </div>
          </TabsContent>

          {/* Activity Tab (renamed from Trends) */}
          <TabsContent value="activity" className="space-y-4">
            <div
              className="fade-in-50 slide-in-from-bottom-2 animate-in duration-300"
              style={{ animationDelay: '0ms' }}
            >
              <ReviewThroughputChart data={performanceData?.reviewThroughput} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
