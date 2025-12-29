/**
 * Date utility functions for time range calculations
 * Used across dashboard, performance, and trend services
 */

// =============================================
// Time Range Types
// =============================================

export type DashboardTimeRange = '7d' | '30d' | '3m';
export type PerformanceTimeRange = '7d' | '30d' | '3m';
export type TrendTimeRange = '6w' | '12w' | '6m';

// =============================================
// Dashboard/Performance Date Utilities
// =============================================

/**
 * Get the date range based on timeRange parameter
 * Returns start and end dates for the period
 */
export function getDateRange(
  timeRange: DashboardTimeRange | PerformanceTimeRange
): {
  startDate: Date;
  endDate: Date;
} {
  const endDate = new Date();
  const startDate = new Date();

  switch (timeRange) {
    case '7d':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(startDate.getDate() - 30);
      break;
    case '3m':
      startDate.setMonth(startDate.getMonth() - 3);
      break;
  }

  return { startDate, endDate };
}

/**
 * Get the previous period date range for delta calculations
 * Returns the equivalent previous period for comparison
 */
export function getPreviousPeriodRange(
  timeRange: DashboardTimeRange | PerformanceTimeRange
): {
  startDate: Date;
  endDate: Date;
} {
  const { startDate: currentStart, endDate: currentEnd } =
    getDateRange(timeRange);
  const periodLength = currentEnd.getTime() - currentStart.getTime();

  const endDate = new Date(currentStart);
  const startDate = new Date(currentStart.getTime() - periodLength);

  return { startDate, endDate };
}

/**
 * Convert time range to number of days
 */
export function getTimeRangeInDays(timeRange: PerformanceTimeRange): number {
  switch (timeRange) {
    case '7d':
      return 7;
    case '30d':
      return 30;
    case '3m':
      return 90;
  }
}

/**
 * Get just the start date based on time range
 * Convenience function for services that only need the start date
 */
export function getStartDate(timeRange: PerformanceTimeRange): Date {
  return getDateRange(timeRange).startDate;
}

// =============================================
// Trend Date Utilities
// =============================================

/**
 * Get start date for trend time range
 */
export function getTrendDateRange(timeRange: TrendTimeRange): Date {
  const startDate = new Date();
  switch (timeRange) {
    case '6w':
      startDate.setDate(startDate.getDate() - 42);
      break;
    case '12w':
      startDate.setDate(startDate.getDate() - 84);
      break;
    case '6m':
      startDate.setMonth(startDate.getMonth() - 6);
      break;
  }
  return startDate;
}

/**
 * Get number of weeks from trend time range
 */
export function getWeeksFromTimeRange(timeRange: TrendTimeRange): number {
  switch (timeRange) {
    case '6w':
      return 6;
    case '12w':
      return 12;
    case '6m':
      return 26;
  }
}

/**
 * Generate week label for trend charts
 */
export function getWeekLabel(weekIndex: number): string {
  return `Week ${weekIndex + 1}`;
}
