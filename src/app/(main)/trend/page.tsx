'use client';

import { useState } from 'react';
import { Zap, BarChart3, ShieldCheck } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  TrendKpiRow,
  ReviewSpeedChart,
  SlaComplianceChart,
  PrVolumeChart,
  WorkloadBalanceChart,
  CycleTimeChart,
  FirstResponseChart,
  ReworkRateChart,
  PrSizeChart,
  ApprovalRateChart,
} from '@/components/trend';

type TimeRange = '6w' | '12w' | '6m';

export default function TrendPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('6w');

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
          <h1 className="text-2xl font-bold text-foreground">Trend</h1>
          <p className="text-sm text-muted-foreground">
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
      <TrendKpiRow />

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
            <div className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300" style={{ animationDelay: '0ms' }}>
              <ReviewSpeedChart />
            </div>
            <div className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300" style={{ animationDelay: '75ms', animationFillMode: 'backwards' }}>
              <CycleTimeChart />
            </div>
          </div>
          <div className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300" style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}>
            <FirstResponseChart />
          </div>
        </TabsContent>

        {/* Volume Tab */}
        <TabsContent value="volume" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300" style={{ animationDelay: '0ms' }}>
              <PrVolumeChart />
            </div>
            <div className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300" style={{ animationDelay: '75ms', animationFillMode: 'backwards' }}>
              <WorkloadBalanceChart />
            </div>
          </div>
          <div className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300" style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}>
            <PrSizeChart />
          </div>
        </TabsContent>

        {/* Quality Tab */}
        <TabsContent value="quality" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300" style={{ animationDelay: '0ms' }}>
              <SlaComplianceChart />
            </div>
            <div className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300" style={{ animationDelay: '75ms', animationFillMode: 'backwards' }}>
              <ReworkRateChart />
            </div>
          </div>
          <div className="animate-in fade-in-50 slide-in-from-bottom-2 duration-300" style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}>
            <ApprovalRateChart />
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}
