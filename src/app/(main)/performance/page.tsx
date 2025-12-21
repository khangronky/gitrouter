'use client';

import { useState } from 'react';
import { Users, GitBranch, TrendingUp } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  PerformanceKpiRow,
  ReviewerPerformanceTable,
  RepoComparisonChart,
  TeamSpeedChart,
  ReviewThroughputChart,
  ReviewQualityChart,
  PrSizeByAuthorChart,
  ResponseByHourChart,
  MergeSuccessChart,
  CommentsDistributionChart,
  BottleneckChart,
} from '@/components/performance';

type TimeRange = '7d' | '30d' | '3m';

export default function PerformancePage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');

  const handleTimeRangeChange = (value: string) => {
    if (value) {
      setTimeRange(value as TimeRange);
    }
  };

  return (
    <section className="p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Performance</h1>
          <p className="text-sm text-muted-foreground">
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
      <PerformanceKpiRow />

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
              className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300"
              style={{ animationDelay: '0ms' }}
            >
              <ReviewerPerformanceTable />
            </div>
            <div
              className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300"
              style={{ animationDelay: '75ms', animationFillMode: 'backwards' }}
            >
              <ReviewQualityChart />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div
              className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300"
              style={{
                animationDelay: '150ms',
                animationFillMode: 'backwards',
              }}
            >
              <CommentsDistributionChart />
            </div>
            <div
              className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300"
              style={{
                animationDelay: '225ms',
                animationFillMode: 'backwards',
              }}
            >
              <BottleneckChart />
            </div>
          </div>
        </TabsContent>

        {/* Repositories Tab */}
        <TabsContent value="repositories" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div
              className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300"
              style={{ animationDelay: '0ms' }}
            >
              <RepoComparisonChart />
            </div>
            <div
              className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300"
              style={{ animationDelay: '75ms', animationFillMode: 'backwards' }}
            >
              <MergeSuccessChart />
            </div>
          </div>
          <div
            className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300"
            style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}
          >
            <PrSizeByAuthorChart />
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div
              className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300"
              style={{ animationDelay: '0ms' }}
            >
              <TeamSpeedChart />
            </div>
            <div
              className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300"
              style={{ animationDelay: '75ms', animationFillMode: 'backwards' }}
            >
              <ReviewThroughputChart />
            </div>
          </div>
          <div
            className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300"
            style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}
          >
            <ResponseByHourChart />
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}
