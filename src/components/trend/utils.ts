import { createClient } from '@/lib/supabase/client';

export type TimeRange = '6w' | '12w' | '6m';

export interface TrendChartProps {
  timeRange: TimeRange;
  organizationId: string;
}

/**
 * Convert time range to start date
 */
export function getDateRangeFromTimeRange(timeRange: TimeRange): Date {
  const startDate = new Date();

  switch (timeRange) {
    case '6w':
      startDate.setDate(startDate.getDate() - 42); // 6 weeks
      break;
    case '12w':
      startDate.setDate(startDate.getDate() - 84); // 12 weeks
      break;
    case '6m':
      startDate.setMonth(startDate.getMonth() - 6);
      break;
  }

  return startDate;
}

/**
 * Get the number of weeks for a time range
 */
export function getWeeksFromTimeRange(timeRange: TimeRange): number {
  switch (timeRange) {
    case '6w':
      return 6;
    case '12w':
      return 12;
    case '6m':
      return 26; // ~6 months
  }
}

/**
 * Get week label (e.g., "Week 1", "Week 2")
 */
export function getWeekLabel(weekIndex: number): string {
  return `Week ${weekIndex + 1}`;
}

/**
 * Group data by week based on a date field
 */
export function groupByWeek<T>(
  data: T[],
  getDate: (item: T) => Date,
  startDate: Date,
  numWeeks: number
): Map<number, T[]> {
  const weekMap = new Map<number, T[]>();

  // Initialize all weeks
  for (let i = 0; i < numWeeks; i++) {
    weekMap.set(i, []);
  }

  const startTime = startDate.getTime();
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;

  for (const item of data) {
    const itemDate = getDate(item);
    const weekIndex = Math.floor((itemDate.getTime() - startTime) / msPerWeek);
    if (weekIndex >= 0 && weekIndex < numWeeks) {
      weekMap.get(weekIndex)?.push(item);
    }
  }

  return weekMap;
}

/**
 * Verify user has access to organization
 */
export async function verifyOrgAccess(organizationId: string): Promise<string> {
  const supabase = createClient();

  // Auth check
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Unauthorized');

  // Verify org membership
  const { data: membership, error: membershipError } = await supabase
    .from('organization_members')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .single();

  if (membershipError || !membership) {
    throw new Error('No access to organization');
  }

  return user.id;
}

/**
 * Get repository IDs for an organization
 */
export async function getOrgRepositoryIds(
  organizationId: string
): Promise<string[]> {
  const supabase = createClient();

  const { data: repos } = await supabase
    .from('repositories')
    .select('id')
    .eq('organization_id', organizationId);

  return repos?.map((r) => r.id) || [];
}
