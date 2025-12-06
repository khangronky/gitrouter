'use client';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function KpiRowSkeleton() {
  return (
    <div className="mb-4 h-full max-h-[200px] grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="p-4 flex flex-col justify-between gap-4">
          <div>
            <div className="flex flex-row justify-between items-center w-full">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-10 w-24 mt-2" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-32" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function LatencyChartSkeleton({ className }: { className?: string }) {
  return (
    <Card className={`h-full p-4 flex flex-col justify-between ${className}`}>
      <div className="flex flex-col gap-1">
        <Skeleton className="h-5 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="h-[225px] w-full flex items-end justify-between gap-1 pt-4">
        {/* Simulated bar chart skeleton */}
        {Array.from({ length: 14 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-t"
            style={{ height: `${Math.random() * 60 + 40}%` }}
          />
        ))}
      </div>
      <Skeleton className="h-4 w-56 mt-4" />
    </Card>
  );
}

export function WorkloadChartSkeleton() {
  return (
    <Card className="p-4 flex flex-col">
      <div className="flex flex-col gap-1">
        <Skeleton className="h-5 w-56" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="mt-4 h-[220px] w-full flex flex-col justify-between gap-2">
        {/* Simulated horizontal bar chart skeleton */}
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton
              className="h-7 rounded"
              style={{ width: `${Math.random() * 40 + 30}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-center gap-4">
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-3 w-3 rounded-sm" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </Card>
  );
}

export function BottlenecksTableSkeleton({ className }: { className?: string }) {
  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex flex-col gap-1 mb-4">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="rounded-md border">
        {/* Table header */}
        <div className="flex border-b p-3 gap-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-28 ml-auto" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        {/* Table rows */}
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="flex border-b last:border-0 p-3 gap-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20 ml-auto" />
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function StalePRsSkeleton({ className }: { className?: string }) {
  return (
    <Card className={`flex flex-col p-4 gap-1 ${className}`}>
      <div className="mb-4 flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-36" />
        </div>
        <Skeleton className="h-6 w-12 rounded-full" />
      </div>

      <div className="space-y-2 flex-1">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-lg border p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <Skeleton className="h-4 w-12 mb-2" />
                <Skeleton className="h-4 w-full max-w-[200px]" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t pt-4">
        <Skeleton className="h-9 w-full rounded-md" />
      </div>
    </Card>
  );
}

export function RecentActivitySkeleton({ className }: { className?: string }) {
  return (
    <Card className={`flex flex-col p-4 gap-1 ${className}`}>
      <div className="mb-4 flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-6 w-10 rounded-full" />
      </div>

      <div className="relative space-y-4 flex-1">
        {/* Timeline line skeleton */}
        <div className="absolute left-[19px] top-2 bottom-2 w-px bg-border" />

        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="relative flex gap-3">
            {/* Avatar skeleton */}
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />

            {/* Content skeleton */}
            <div className="flex-1 rounded-lg border p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-full max-w-[180px]" />
                </div>
                <Skeleton className="h-3 w-14" />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Skeleton className="h-3 w-3" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function DashboardSkeleton() {
  return (
    <section className="p-4">
      {/* Header skeleton */}
      <div className="flex flex-row justify-between items-center mb-4">
        <div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-72 rounded-md" />
      </div>

      {/* KPI Row */}
      <KpiRowSkeleton />

      {/* Charts Row */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <LatencyChartSkeleton className="lg:col-span-2" />
        <WorkloadChartSkeleton />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <BottlenecksTableSkeleton className="lg:col-span-3" />
        <StalePRsSkeleton className="lg:col-span-1" />
        <RecentActivitySkeleton className="lg:col-span-1" />
      </div>
    </section>
  );
}

