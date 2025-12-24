import type { TrendTimeRange } from '@/lib/schema/trend';

// Re-export types for backwards compatibility
export type TimeRange = TrendTimeRange;

export interface TrendChartProps {
  timeRange: TimeRange;
  organizationId: string;
}

// Note: Data fetching functions have been moved to lib/trend/service.ts
// These components now receive data as props from the Trend page
