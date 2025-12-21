'use client';

import { GitBranch, TrendingUp, Users } from 'lucide-react';
import { useState } from 'react';
import {
  BottleneckChart,
  CommentsDistributionChart,
  MergeSuccessChart,
  PerformanceKpiRow,
  PrSizeByAuthorChart,
  RepoComparisonChart,
  ResponseByHourChart,
  ReviewerPerformanceTable,
  ReviewQualityChart,
  ReviewThroughputChart,
  TeamSpeedChart,
} from '@/components/performance';
import { PerformanceSkeleton } from '@/components/performance/performance-skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useCurrentOrganization } from '@/hooks/use-current-organization';

type TimeRange = '7d' | '30d' | '3m';

export default function PerformancePage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const { currentOrgId, isLoading: orgLoading } = useCurrentOrganization();

  const handleTimeRangeChange = (value: string) => {
    if (value) {
      setTimeRange(value as TimeRange);
    }
  };

  if (orgLoading || !currentOrgId) {
    return <PerformanceSkeleton />;
  }

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

      {/* Summary KPIs */}
      <PerformanceKpiRow timeRange={timeRange} organizationId={currentOrgId} />

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
          <TabsTrigger value="trends" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Trends
          </TabsTrigger>
        </TabsList>

        {/* Reviewers Tab */}
        <TabsContent value="reviewers" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div
              className="fade-in-50 slide-in-from-bottom-2 animate-in duration-300"
              style={{ animationDelay: '0ms' }}
            >
              <ReviewerPerformanceTable
                timeRange={timeRange}
                organizationId={currentOrgId}
              />
            </div>
            <div
              className="fade-in-50 slide-in-from-bottom-2 animate-in duration-300"
              style={{ animationDelay: '75ms', animationFillMode: 'backwards' }}
            >
              <ReviewQualityChart />
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
              <CommentsDistributionChart />
            </div>
            <div
              className="fade-in-50 slide-in-from-bottom-2 animate-in duration-300"
              style={{
                animationDelay: '225ms',
                animationFillMode: 'backwards',
              }}
            >
              <BottleneckChart
                timeRange={timeRange}
                organizationId={currentOrgId}
              />
            </div>
          </div>
        </TabsContent>

        {/* Repositories Tab */}
        <TabsContent value="repositories" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div
              className="fade-in-50 slide-in-from-bottom-2 animate-in duration-300"
              style={{ animationDelay: '0ms' }}
            >
              <RepoComparisonChart
                timeRange={timeRange}
                organizationId={currentOrgId}
              />
            </div>
            <div
              className="fade-in-50 slide-in-from-bottom-2 animate-in duration-300"
              style={{ animationDelay: '75ms', animationFillMode: 'backwards' }}
            >
              <MergeSuccessChart
                timeRange={timeRange}
                organizationId={currentOrgId}
              />
            </div>
          </div>
          <div
            className="fade-in-50 slide-in-from-bottom-2 animate-in duration-300"
            style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}
          >
            <PrSizeByAuthorChart
              timeRange={timeRange}
              organizationId={currentOrgId}
            />
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div
              className="fade-in-50 slide-in-from-bottom-2 animate-in duration-300"
              style={{ animationDelay: '0ms' }}
            >
              <TeamSpeedChart
                timeRange={timeRange}
                organizationId={currentOrgId}
              />
            </div>
            <div
              className="fade-in-50 slide-in-from-bottom-2 animate-in duration-300"
              style={{ animationDelay: '75ms', animationFillMode: 'backwards' }}
            >
              <ReviewThroughputChart
                timeRange={timeRange}
                organizationId={currentOrgId}
              />
            </div>
          </div>
          <div
            className="fade-in-50 slide-in-from-bottom-2 animate-in duration-300"
            style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}
          >
            <ResponseByHourChart
              timeRange={timeRange}
              organizationId={currentOrgId}
            />
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}
