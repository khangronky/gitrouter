import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type {
  DashboardResponse,
  DashboardQuery,
  TimeRange,
} from '@/lib/schema/dashboard';

// =============================================
// Query Keys
// =============================================

export const dashboardKeys = {
  all: ['dashboard'] as const,
  data: (orgId: string, timeRange: TimeRange, repositoryId?: string) =>
    [...dashboardKeys.all, orgId, timeRange, repositoryId] as const,
};

// =============================================
// Fetcher Function
// =============================================

/**
 * Fetch dashboard data from the API
 */
export async function fetchDashboard(
  params?: DashboardQuery
): Promise<DashboardResponse> {
  const queryParams = new URLSearchParams();

  if (params?.timeRange) {
    queryParams.set('timeRange', params.timeRange);
  }
  if (params?.organizationId) {
    queryParams.set('organizationId', params.organizationId);
  }
  if (params?.repositoryId) {
    queryParams.set('repositoryId', params.repositoryId);
  }

  const queryString = queryParams.toString();
  const url = queryString ? `/dashboard?${queryString}` : '/dashboard';

  const response = await apiClient.get<DashboardResponse>(url);
  return response.data;
}

// =============================================
// TanStack Query Hooks
// =============================================

/**
 * Hook to fetch dashboard data with TanStack Query
 */
export function useDashboardData(
  orgId: string,
  timeRange: TimeRange,
  repositoryId?: string
) {
  return useQuery({
    queryKey: dashboardKeys.data(orgId, timeRange, repositoryId),
    queryFn: () =>
      fetchDashboard({
        organizationId: orgId,
        timeRange,
        repositoryId,
      }),
    enabled: !!orgId,
  });
}

/**
 * Helper type for dashboard data
 */
export type { DashboardResponse, DashboardQuery, TimeRange };
