'use client';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface ChartSkeletonProps {
  chartType?: 'line' | 'bar' | 'area' | 'radar' | 'pie';
}

export function PerformanceChartSkeleton({
  chartType = 'line',
}: ChartSkeletonProps) {
  return (
    <Card className="flex flex-col p-4 transition-all duration-200">
      <div className="flex flex-col gap-1">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex h-[200px] w-full items-end justify-between gap-1 pt-4">
        {chartType === 'line' && (
          // Line chart skeleton
          <div className="relative h-full w-full">
            <Skeleton className="absolute bottom-[40%] left-0 h-0.5 w-full opacity-30" />
            <Skeleton className="absolute bottom-[60%] left-[10%] h-0.5 w-[80%] opacity-50" />
            <Skeleton className="absolute bottom-[45%] left-[20%] h-0.5 w-[60%] opacity-40" />
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton
                key={i}
                className="absolute h-3 w-3 rounded-full"
                style={{
                  left: `${(i / 5) * 90 + 5}%`,
                  bottom: `${30 + Math.sin(i * 0.8) * 20 + 20}%`,
                }}
              />
            ))}
          </div>
        )}
        {chartType === 'bar' &&
          // Bar chart skeleton
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton
              key={i}
              className="flex-1 rounded-t"
              style={{ height: `${Math.random() * 50 + 30}%` }}
            />
          ))}
        {chartType === 'area' && (
          // Area chart skeleton
          <div className="relative h-full w-full">
            <Skeleton className="absolute bottom-0 left-0 h-[60%] w-full rounded-t-lg opacity-30" />
            <Skeleton className="absolute bottom-0 left-0 h-0.5 w-full" />
          </div>
        )}
        {chartType === 'radar' && (
          // Radar chart skeleton
          <div className="relative flex h-full w-full items-center justify-center">
            <div className="relative h-32 w-32">
              <Skeleton className="absolute inset-0 rounded-full opacity-20" />
              <Skeleton className="absolute inset-4 rounded-full opacity-30" />
              <Skeleton className="absolute inset-8 rounded-full opacity-40" />
            </div>
          </div>
        )}
        {chartType === 'pie' && (
          // Pie chart skeleton
          <div className="relative flex h-full w-full items-center justify-center">
            <Skeleton className="h-40 w-40 rounded-full" />
          </div>
        )}
      </div>
      <Skeleton className="mt-4 h-4 w-56" />
    </Card>
  );
}

export function PerformanceKpiSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-12 w-full" />
        </Card>
      ))}
    </div>
  );
}

export function PerformanceTableSkeleton() {
  return (
    <Card className="p-4">
      <div className="mb-4 flex flex-col gap-1">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-12 flex-1" />
            <Skeleton className="h-12 w-24" />
            <Skeleton className="h-12 w-24" />
            <Skeleton className="h-12 w-24" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function PerformanceSkeleton() {
  return (
    <section className="space-y-6 p-4">
      {/* Header skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Skeleton className="mb-2 h-8 w-24" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-72 rounded-md" />
      </div>

      {/* KPI Row skeleton */}
      <PerformanceKpiSkeleton />

      {/* Tabs skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-80 rounded-md" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <PerformanceChartSkeleton chartType="bar" />
          <PerformanceChartSkeleton chartType="line" />
        </div>
        <PerformanceChartSkeleton chartType="bar" />
      </div>
    </section>
  );
}
