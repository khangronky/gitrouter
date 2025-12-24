import { z } from 'zod';

// =============================================
// Time Range
// =============================================

export type TrendTimeRange = '6w' | '12w' | '6m';

export const trendTimeRangeSchema = z.enum(['6w', '12w', '6m']);

// =============================================
// Query Schema (Zod for runtime validation)
// =============================================

export const trendQuerySchema = z.object({
  timeRange: trendTimeRangeSchema.optional(),
  organizationId: z.string().uuid().optional(),
});

export type TrendQuery = z.infer<typeof trendQuerySchema>;

// =============================================
// KPI Data Interface
// =============================================

export interface TrendKpiData {
  avgReviewSpeed: { current: number; previous: number; weekly: number[] };
  slaCompliance: { current: number; previous: number; weekly: number[] };
  cycleTime: { current: number; previous: number; weekly: number[] };
  approvalRate: { current: number; previous: number; weekly: number[] };
}

// =============================================
// Chart Data Interfaces
// =============================================

export interface ReviewSpeedData {
  date: string;
  hours: number;
}

export interface CycleTimeData {
  week: string;
  hours: number;
}

export interface FirstResponseData {
  week: string;
  minutes: number;
}

export interface PrVolumeData {
  date: string;
  count: number;
}

export interface WorkloadBalanceData {
  week: string;
  [reviewerName: string]: string | number;
}

export interface PrSizeData {
  week: string;
  small: number;
  medium: number;
  large: number;
}

export interface SlaComplianceData {
  date: string;
  percentage: number;
}

export interface ReworkRateData {
  week: string;
  percentage: number;
}

export interface ApprovalRateData {
  week: string;
  approved: number;
  rejected: number;
}

export interface MergeTimeData {
  week: string;
  hours: number;
}

export interface ReviewDepthData {
  week: string;
  linesPerPr: number;
}

// =============================================
// Complete Trend Data
// =============================================

export interface TrendData {
  kpis: TrendKpiData;
  reviewSpeed: ReviewSpeedData[];
  cycleTime: CycleTimeData[];
  firstResponse: FirstResponseData[];
  prVolume: PrVolumeData[];
  workloadBalance: WorkloadBalanceData[];
  prSize: PrSizeData[];
  slaCompliance: SlaComplianceData[];
  reworkRate: ReworkRateData[];
  approvalRate: ApprovalRateData[];
  mergeTime: MergeTimeData[];
  reviewDepth: ReviewDepthData[];
}

// =============================================
// Response Interfaces
// =============================================

export interface TrendResponse {
  success: boolean;
  data: TrendData;
  timestamp: string;
  timeRange: TrendTimeRange;
}

export interface TrendErrorResponse {
  success: false;
  error: string;
  message?: string;
  timestamp: string;
}

