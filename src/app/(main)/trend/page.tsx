'use client';

import { BarChart3, ShieldCheck, Zap } from 'lucide-react';
import { useState } from 'react';
import {
  ApprovalRateChart,
  CycleTimeChart,
  FirstResponseChart,
  MergeTimeChart,
  PrSizeChart,
  PrVolumeChart,
  ReviewDepthChart,
  ReviewSpeedChart,
  ReworkRateChart,
  SlaComplianceChart,
  TrendKpiRow,
  WorkloadBalanceChart,
} from '@/components/trend';
import { TrendSkeleton } from '@/components/trend/trend-skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useCurrentOrganization } from '@/hooks/use-current-organization';
import { useTrendData } from '@/lib/api/trend';
import type { TrendTimeRange } from '@/lib/schema/trend';

export default function TrendPage() {
  const { currentOrgId, isLoading: orgLoading } = useCurrentOrganization();
  const [timeRange, setTimeRange] = useState<TrendTimeRange>('6w');

  const {
    data: response,
    isLoading,
    error,
  } = useTrendData(currentOrgId || '', timeRange);

  const handleTimeRangeChange = (value: string) => {
    if (value) {
      setTimeRange(value as TrendTimeRange);
    }
  };

  if (orgLoading || !currentOrgId || isLoading) {
    return <TrendSkeleton />;
  }

  const trendData = response?.data;

  return (
    <section className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Trend</h1>
          <p className="text-muted-foreground text-sm">
            {timeRange === '6w' && 'Historical trends over the last 6 weeks'}
            {timeRange === '12w' && 'Historical trends over the last 12 weeks'}
            {timeRange === '6m' && 'Historical trends over the last 6 months'}
          </p>
        </div>
        <Tabs value={timeRange} onValueChange={handleTimeRangeChange}>
          <TabsList>
            <TabsTrigger value="6w">6 weeks</TabsTrigger>
            <TabsTrigger value="12w">12 weeks</TabsTrigger>
            <TabsTrigger value="6m">6 months</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
          <p className="text-sm text-destructive">
            {error instanceof Error
              ? error.message
              : 'Failed to fetch trend data'}
          </p>
        </div>
      )}

      {/* Summary KPIs */}
      <TrendKpiRow data={trendData?.kpis} />

      {/* Tabbed Charts */}
      <Tabs defaultValue="speed" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="speed" className="gap-2">
            <Zap className="h-4 w-4" />
            Speed
          </TabsTrigger>
          <TabsTrigger value="volume" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Volume
          </TabsTrigger>
          <TabsTrigger value="quality" className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            Quality
          </TabsTrigger>
        </TabsList>

        {/* Speed Tab */}
        <TabsContent value="speed" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div
              className="fade-in-50 slide-in-from-bottom-2 animate-in duration-300"
              style={{ animationDelay: '0ms' }}
            >
              <ReviewSpeedChart data={trendData?.reviewSpeed} />
            </div>
            <div
              className="fade-in-50 slide-in-from-bottom-2 animate-in duration-300"
              style={{ animationDelay: '75ms', animationFillMode: 'backwards' }}
            >
              <CycleTimeChart data={trendData?.cycleTime} />
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
              <FirstResponseChart data={trendData?.firstResponse} />
            </div>
            <div
              className="fade-in-50 slide-in-from-bottom-2 animate-in duration-300"
              style={{
                animationDelay: '225ms',
                animationFillMode: 'backwards',
              }}
            >
              <MergeTimeChart data={trendData?.mergeTime} />
            </div>
          </div>
        </TabsContent>

        {/* Volume Tab */}
        <TabsContent value="volume" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div
              className="fade-in-50 slide-in-from-bottom-2 animate-in duration-300"
              style={{ animationDelay: '0ms' }}
            >
              <PrVolumeChart data={trendData?.prVolume} />
            </div>
            <div
              className="fade-in-50 slide-in-from-bottom-2 animate-in duration-300"
              style={{ animationDelay: '75ms', animationFillMode: 'backwards' }}
            >
              <WorkloadBalanceChart data={trendData?.workloadBalance} />
            </div>
          </div>
          <div
            className="fade-in-50 slide-in-from-bottom-2 animate-in duration-300"
            style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}
          >
            <PrSizeChart data={trendData?.prSize} />
          </div>
        </TabsContent>

        {/* Quality Tab */}
        <TabsContent value="quality" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div
              className="fade-in-50 slide-in-from-bottom-2 animate-in duration-300"
              style={{ animationDelay: '0ms' }}
            >
              <SlaComplianceChart data={trendData?.slaCompliance} />
            </div>
            <div
              className="fade-in-50 slide-in-from-bottom-2 animate-in duration-300"
              style={{ animationDelay: '75ms', animationFillMode: 'backwards' }}
            >
              <ReworkRateChart data={trendData?.reworkRate} />
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
              <ApprovalRateChart data={trendData?.approvalRate} />
            </div>
            <div
              className="fade-in-50 slide-in-from-bottom-2 animate-in duration-300"
              style={{
                animationDelay: '225ms',
                animationFillMode: 'backwards',
              }}
            >
              <ReviewDepthChart data={trendData?.reviewDepth} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}
