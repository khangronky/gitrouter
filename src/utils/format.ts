/**
 * Formatting utilities for numbers, time, and display values
 */

/**
 * Calculate percentage delta between current and previous values
 */
export function calcDelta(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Get trend information based on delta value
 * @param delta - The delta percentage
 * @param lowerIsBetter - If true, negative delta is considered positive (e.g., for response times)
 */
export function getTrendDirection(
  delta: number,
  lowerIsBetter = false
): 'up' | 'down' | 'neutral' {
  const isPositive = lowerIsBetter ? delta < 0 : delta > 0;
  const isNegative = lowerIsBetter ? delta > 0 : delta < 0;

  if (isPositive) return 'up';
  if (isNegative) return 'down';
  return 'neutral';
}

/**
 * Check if a trend is positive (good) based on delta and whether lower is better
 */
export function isTrendPositive(delta: number, lowerIsBetter = false): boolean {
  return lowerIsBetter ? delta < 0 : delta > 0;
}

/**
 * Format minutes to human-readable time string (e.g., "2h 30m" or "45m")
 */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Format hours to human-readable time string (e.g., "2.5h")
 */
export function formatHours(hours: number): string {
  return `${hours.toFixed(1)}h`;
}

/**
 * Format a number as percentage string
 */
export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

/**
 * Format delta as string with sign (e.g., "+5%" or "-3%")
 */
export function formatDelta(delta: number): string {
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${delta}%`;
}
