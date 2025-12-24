import { z } from 'zod';

// =============================================
// Time Range
// =============================================

export type PerformanceTimeRange = '7d' | '30d' | '3m';

export const performanceTimeRangeSchema = z.enum(['7d', '30d', '3m']);

// =============================================
// Query Schema (Zod for runtime validation)
// =============================================

export const performanceQuerySchema = z.object({
  timeRange: performanceTimeRangeSchema.optional(),
  organizationId: z.string().uuid().optional(),
});

export type PerformanceQuery = z.infer<typeof performanceQuerySchema>;

// =============================================
// KPI Data Interfaces
// =============================================

export interface PerformanceKpiData {
  topReviewer: {
    name: string;
    avgTime: number;
    current: number;
    previous: number;
    sparkline: number[];
  };
  teamAvgTime: {
    current: number;
    previous: number;
    sparkline: number[];
  };
  slaCompliance: {
    current: number;
    previous: number;
    sparkline: number[];
  };
  totalReviews: {
    current: number;
    previous: number;
    sparkline: number[];
  };
}

// =============================================
// Reviewer Performance Table
// =============================================

export interface ReviewerPerformance {
  reviewer: string;
  avgTime: string;
  prsReviewed: number;
  sla: string;
  trend: 'up' | 'down';
}

// =============================================
// Chart Data Interfaces
// =============================================

export interface BottleneckData {
  reviewer: string;
  frequency: number;
}

export interface RepoComparisonData {
  repo: string;
  hours: number;
}

export interface MergeSuccessData {
  repo: string;
  successRate: number;
}

export interface PrSizeByAuthorData {
  author: string;
  small: number;
  medium: number;
  large: number;
}

export interface ReviewThroughputData {
  day: string;
  reviews: number;
}

export interface WorkloadDistributionData {
  reviewer: string;
  reviewCount: number;
  percentage: number;
}

export interface TimeToFirstReviewData {
  reviewer: string;
  minutes: number;
}

// =============================================
// Complete Performance Data
// =============================================

export interface PerformanceData {
  kpis: PerformanceKpiData;
  reviewerPerformance: ReviewerPerformance[];
  bottlenecks: BottleneckData[];
  repoComparison: RepoComparisonData[];
  mergeSuccess: MergeSuccessData[];
  prSizeByAuthor: PrSizeByAuthorData[];
  reviewThroughput: ReviewThroughputData[];
  workloadDistribution: WorkloadDistributionData[];
  timeToFirstReview: TimeToFirstReviewData[];
}

// =============================================
// Response Interfaces
// =============================================

export interface PerformanceResponse {
  success: boolean;
  data: PerformanceData;
  timestamp: string;
  timeRange: PerformanceTimeRange;
}

export interface PerformanceErrorResponse {
  success: false;
  error: string;
  message?: string;
  timestamp: string;
}
