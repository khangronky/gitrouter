import { z } from 'zod';

// =============================================
// KPI Schemas
// =============================================

/**
 * KPI Data Point
 */
export const kpiDataPointSchema = z.object({
  value: z.number(),
  delta: z.number(),
  note: z.string(),
});

export type KpiDataPoint = z.infer<typeof kpiDataPointSchema>;

/**
 * KPI Row Data
 */
export const kpiRowDataSchema = z.object({
  totalPRs: kpiDataPointSchema,
  pending: kpiDataPointSchema,
  sla: kpiDataPointSchema,
  approved: kpiDataPointSchema,
});

export type KpiRowData = z.infer<typeof kpiRowDataSchema>;

// =============================================
// Latency Chart Schemas
// =============================================

/**
 * Latency Data Point
 */
export const latencyDataPointSchema = z.object({
  day: z.string(),
  hours: z.number().min(0),
});

export type LatencyDataPoint = z.infer<typeof latencyDataPointSchema>;

/**
 * Latency Series (array of latency data points)
 */
export const latencySeriesSchema = z.array(latencyDataPointSchema);

export type LatencySeries = z.infer<typeof latencySeriesSchema>;

// =============================================
// Workload Chart Schemas
// =============================================

/**
 * Reviewer Workload Data Point
 */
export const reviewerWorkloadSchema = z.object({
  name: z.string(),
  assigned: z.number().min(0),
  capacity: z.number().min(0),
});

export type ReviewerWorkload = z.infer<typeof reviewerWorkloadSchema>;

/**
 * Reviewer Workload Series (array of reviewer workload data points)
 */
export const reviewerWorkloadSeriesSchema = z.array(reviewerWorkloadSchema);

export type ReviewerWorkloadSeries = z.infer<
  typeof reviewerWorkloadSeriesSchema
>;

// =============================================
// Bottlenecks Table Schemas
// =============================================

/**
 * Bottleneck Data Point
 */
export const bottleneckSchema = z.object({
  repo: z.string(),
  avg: z.string(), // e.g., "12.5 hours"
  pending: z.number().min(0),
  sla: z.string(), // e.g., "62%"
});

export type Bottleneck = z.infer<typeof bottleneckSchema>;

/**
 * Bottlenecks List
 */
export const bottlenecksListSchema = z.array(bottleneckSchema);

export type BottlenecksList = z.infer<typeof bottlenecksListSchema>;

// =============================================
// Stale Pull Requests Schemas
// =============================================

/**
 * Stale Pull Request
 */
export const stalePullRequestSchema = z.object({
  id: z.number(),
  title: z.string(),
  age: z.string(), // e.g., "24h 15m"
});

export type StalePullRequest = z.infer<typeof stalePullRequestSchema>;

/**
 * Stale Pull Requests List
 */
export const stalePullRequestsListSchema = z.array(stalePullRequestSchema);

export type StalePullRequestsList = z.infer<typeof stalePullRequestsListSchema>;

// =============================================
// Recent Activity Schemas
// =============================================

/**
 * Recent Activity Entry
 */
export const recentActivityEntrySchema = z.object({
  time: z.string(), // e.g., "09:45PM"
  id: z.number(),
  author: z.string(),
  snippet: z.string(),
  assigned: z.array(z.string()), // array of usernames
});

export type RecentActivityEntry = z.infer<typeof recentActivityEntrySchema>;

/**
 * Recent Activity List
 */
export const recentActivityListSchema = z.array(recentActivityEntrySchema);

export type RecentActivityList = z.infer<typeof recentActivityListSchema>;

// =============================================
// Complete Dashboard Data Schemas
// =============================================

/**
 * Time Range for Dashboard
 */
export const timeRangeSchema = z.enum(['7d', '30d', '3m']);

export type TimeRange = z.infer<typeof timeRangeSchema>;

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
