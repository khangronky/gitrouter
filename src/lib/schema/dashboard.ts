import { z } from 'zod';

// =============================================
// KPI Schemas
// =============================================

/**
 * KPI Data Point
 */
export type KpiDataPoint = {
  value: number;
  delta: number;
  note: string;
};

export const kpiDataPointSchema = z.object({
  value: z.number(),
  delta: z.number(),
  note: z.string(),
}) satisfies z.ZodType<KpiDataPoint>;

/**
 * KPI Row Data
 */
export type KpiRowData = {
  totalPRs: KpiDataPoint;
  pending: KpiDataPoint;
  sla: KpiDataPoint;
  approved: KpiDataPoint;
};

export const kpiRowDataSchema = z.object({
  totalPRs: kpiDataPointSchema,
  pending: kpiDataPointSchema,
  sla: kpiDataPointSchema,
  approved: kpiDataPointSchema,
}) satisfies z.ZodType<KpiRowData>;

// =============================================
// Latency Chart Schemas
// =============================================

/**
 * Latency Data Point
 */
export type LatencyDataPoint = {
  day: string;
  hours: number;
};

export const latencyDataPointSchema = z.object({
  day: z.string(),
  hours: z.number().min(0),
}) satisfies z.ZodType<LatencyDataPoint>;

/**
 * Latency Series (array of latency data points)
 */
export type LatencySeries = LatencyDataPoint[];

export const latencySeriesSchema = z.array(latencyDataPointSchema);

// =============================================
// Workload Chart Schemas
// =============================================

/**
 * Reviewer Workload Data Point
 */
export type ReviewerWorkload = {
  name: string;
  assigned: number;
  capacity: number;
};

export const reviewerWorkloadSchema = z.object({
  name: z.string(),
  assigned: z.number().min(0),
  capacity: z.number().min(0),
}) satisfies z.ZodType<ReviewerWorkload>;

/**
 * Reviewer Workload Series (array of reviewer workload data points)
 */
export type ReviewerWorkloadSeries = ReviewerWorkload[];

export const reviewerWorkloadSeriesSchema = z.array(reviewerWorkloadSchema);

// =============================================
// Bottlenecks Table Schemas
// =============================================

/**
 * Bottleneck Data Point
 */
export type Bottleneck = {
  repo: string;
  avg: string; // e.g., "12.5 hours"
  pending: number;
  sla: string; // e.g., "62%"
};

export const bottleneckSchema = z.object({
  repo: z.string(),
  avg: z.string(),
  pending: z.number().min(0),
  sla: z.string(),
}) satisfies z.ZodType<Bottleneck>;

/**
 * Bottlenecks List
 */
export type BottlenecksList = Bottleneck[];

export const bottlenecksListSchema = z.array(bottleneckSchema);

// =============================================
// Stale Pull Requests Schemas
// =============================================

/**
 * Stale Pull Request
 */
export type StalePullRequest = {
  id: number;
  title: string;
  age: string; // e.g., "24h 15m"
};

export const stalePullRequestSchema = z.object({
  id: z.number(),
  title: z.string(),
  age: z.string(),
}) satisfies z.ZodType<StalePullRequest>;

/**
 * Stale Pull Requests List
 */
export type StalePullRequestsList = StalePullRequest[];

export const stalePullRequestsListSchema = z.array(stalePullRequestSchema);

// =============================================
// Recent Activity Schemas
// =============================================

/**
 * Recent Activity Entry
 */
export type RecentActivityEntry = {
  time: string; // e.g., "09:45PM"
  id: number;
  author: string;
  snippet: string;
  assigned: string[]; // array of usernames
};

export const recentActivityEntrySchema = z.object({
  time: z.string(),
  id: z.number(),
  author: z.string(),
  snippet: z.string(),
  assigned: z.array(z.string()),
}) satisfies z.ZodType<RecentActivityEntry>;

/**
 * Recent Activity List
 */
export type RecentActivityList = RecentActivityEntry[];

export const recentActivityListSchema = z.array(recentActivityEntrySchema);

// =============================================
// Complete Dashboard Data Schemas
// =============================================

/**
 * Time Range for Dashboard
 */
export type TimeRange = '7d' | '30d' | '3m';

export const timeRangeSchema = z.enum(['7d', '30d', '3m']);

/**
 * Complete Dashboard Data
 */
export const dashboardDataSchema = z.object({
  kpis: kpiRowDataSchema,
  latencySeries: latencySeriesSchema,
  reviewerWorkload: reviewerWorkloadSeriesSchema,
  bottlenecks: bottlenecksListSchema,
  stalePRs: stalePullRequestsListSchema,
  recentActivity: recentActivityListSchema,
  timeRange: timeRangeSchema.default('7d'),
});

export type DashboardData = z.infer<typeof dashboardDataSchema>;

// =============================================
// Query Schemas
// =============================================

/**
 * Dashboard Query Parameters
 */
export const dashboardQuerySchema = z.object({
  timeRange: timeRangeSchema.optional(),
  organizationId: z.string().uuid().optional(),
  repositoryId: z.string().uuid().optional(),
});

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;

// =============================================
// Response Schemas
// =============================================

/**
 * Dashboard Response
 */
export const dashboardResponseSchema = z.object({
  success: z.boolean(),
  data: dashboardDataSchema,
  timestamp: z.string().datetime(),
  timeRange: timeRangeSchema,
});

export type DashboardResponse = z.infer<typeof dashboardResponseSchema>;

/**
 * Dashboard Error Response
 */
export const dashboardErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  message: z.string().optional(),
  timestamp: z.string().datetime(),
});

export type DashboardErrorResponse = z.infer<
  typeof dashboardErrorResponseSchema
>;

// =============================================
// Individual Component Response Schemas
// =============================================

/**
 * KPI Response
 */
export const kpiResponseSchema = z.object({
  success: z.boolean(),
  data: kpiRowDataSchema,
  timestamp: z.string().datetime(),
});

export type KpiResponse = z.infer<typeof kpiResponseSchema>;

/**
 * Latency Chart Response
 */
export const latencyChartResponseSchema = z.object({
  success: z.boolean(),
  data: latencySeriesSchema,
  timestamp: z.string().datetime(),
});

export type LatencyChartResponse = z.infer<typeof latencyChartResponseSchema>;

/**
 * Workload Chart Response
 */
export const workloadChartResponseSchema = z.object({
  success: z.boolean(),
  data: reviewerWorkloadSeriesSchema,
  timestamp: z.string().datetime(),
});

export type WorkloadChartResponse = z.infer<typeof workloadChartResponseSchema>;

/**
 * Bottlenecks Response
 */
export const bottlenecksResponseSchema = z.object({
  success: z.boolean(),
  data: bottlenecksListSchema,
  timestamp: z.string().datetime(),
});

export type BottlenecksResponse = z.infer<typeof bottlenecksResponseSchema>;

/**
 * Stale Pull Requests Response
 */
export const stalePullRequestsResponseSchema = z.object({
  success: z.boolean(),
  data: stalePullRequestsListSchema,
  timestamp: z.string().datetime(),
});

export type StalePullRequestsResponse = z.infer<
  typeof stalePullRequestsResponseSchema
>;

/**
 * Recent Activity Response
 */
export const recentActivityResponseSchema = z.object({
  success: z.boolean(),
  data: recentActivityListSchema,
  timestamp: z.string().datetime(),
});

export type RecentActivityResponse = z.infer<
  typeof recentActivityResponseSchema
>;
