import { apiClient } from '@/lib/api';
import type {
  DashboardResponse,
  DashboardQuery,
  TimeRange,
} from '@/lib/schema/dashboard';

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

/**
 * Helper type for dashboard data
 */
export type { DashboardResponse, DashboardQuery, TimeRange };
