'use client';

import { BarChart3, ShieldCheck, Zap } from 'lucide-react';
import { useState } from 'react';
import {
  ApprovalRateChart,
  CycleTimeChart,
  FirstResponseChart,
  PrSizeChart,
  PrVolumeChart,
  ReviewSpeedChart,
  ReworkRateChart,
  SlaComplianceChart,
  TrendKpiRow,
  WorkloadBalanceChart,
} from '@/components/trend';
import { TrendSkeleton } from '@/components/trend/trend-skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useCurrentOrganization } from '@/hooks/use-current-organization';

type TimeRange = '6w' | '12w' | '6m';

export default function TrendPage() {
  const { currentOrgId, isLoading: orgLoading } = useCurrentOrganization();
  const [timeRange, setTimeRange] = useState<TimeRange>('6w');

  const handleTimeRangeChange = (value: string) => {
    if (value) {
      setTimeRange(value as TimeRange);
    }
  };

  if (orgLoading || !currentOrgId) {
    return <TrendSkeleton />;
  }

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
        <ToggleGroup
          type="single"
          value={timeRange}
          onValueChange={handleTimeRangeChange}
          variant="outline"
          size="sm"
        >
          <ToggleGroupItem value="6w">6 weeks</ToggleGroupItem>
          <ToggleGroupItem value="12w">12 weeks</ToggleGroupItem>
          <ToggleGroupItem value="6m">6 months</ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Summary KPIs */}
      <TrendKpiRow timeRange={timeRange} organizationId={currentOrgId} />

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
              <ReviewSpeedChart
                timeRange={timeRange}
                organizationId={currentOrgId}
              />
            </div>
            <div
              className="fade-in-50 slide-in-from-bottom-2 animate-in duration-300"
              style={{ animationDelay: '75ms', animationFillMode: 'backwards' }}
            >
              <CycleTimeChart
                timeRange={timeRange}
                organizationId={currentOrgId}
              />
            </div>
          </div>
          <div
            className="fade-in-50 slide-in-from-bottom-2 animate-in duration-300"
            style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}
          >
            <FirstResponseChart
              timeRange={timeRange}
              organizationId={currentOrgId}
            />
          </div>
        </TabsContent>

        {/* Volume Tab */}
        <TabsContent value="volume" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div
              className="fade-in-50 slide-in-from-bottom-2 animate-in duration-300"
              style={{ animationDelay: '0ms' }}
            >
              <PrVolumeChart
                timeRange={timeRange}
                organizationId={currentOrgId}
              />
            </div>
            <div
              className="fade-in-50 slide-in-from-bottom-2 animate-in duration-300"
              style={{ animationDelay: '75ms', animationFillMode: 'backwards' }}
            >
              <WorkloadBalanceChart
                timeRange={timeRange}
                organizationId={currentOrgId}
              />
            </div>
          </div>
          <div
            className="fade-in-50 slide-in-from-bottom-2 animate-in duration-300"
            style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}
          >
            <PrSizeChart timeRange={timeRange} organizationId={currentOrgId} />
          </div>
        </TabsContent>

        {/* Quality Tab */}
        <TabsContent value="quality" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div
              className="fade-in-50 slide-in-from-bottom-2 animate-in duration-300"
              style={{ animationDelay: '0ms' }}
            >
              <SlaComplianceChart
                timeRange={timeRange}
                organizationId={currentOrgId}
              />
            </div>
            <div
              className="fade-in-50 slide-in-from-bottom-2 animate-in duration-300"
              style={{ animationDelay: '75ms', animationFillMode: 'backwards' }}
            >
              <ReworkRateChart
                timeRange={timeRange}
                organizationId={currentOrgId}
              />
            </div>
          </div>
          <div
            className="fade-in-50 slide-in-from-bottom-2 animate-in duration-300"
            style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}
          >
            <ApprovalRateChart
              timeRange={timeRange}
              organizationId={currentOrgId}
            />
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}
