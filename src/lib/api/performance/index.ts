import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type {
  PerformanceResponse,
  PerformanceQuery,
  PerformanceTimeRange,
} from '@/lib/schema/performance';

// =============================================
// Query Keys
// =============================================

export const performanceKeys = {
  all: ['performance'] as const,
  data: (orgId: string, timeRange: PerformanceTimeRange) =>
    [...performanceKeys.all, orgId, timeRange] as const,
};

// =============================================
// Fetcher Function
// =============================================

/**
 * Fetch performance data from the API
 */
export async function fetchPerformance(
  params?: PerformanceQuery
): Promise<PerformanceResponse> {
  const queryParams = new URLSearchParams();

  if (params?.timeRange) {
    queryParams.set('timeRange', params.timeRange);
  }
  if (params?.organizationId) {
    queryParams.set('organizationId', params.organizationId);
  }

  const queryString = queryParams.toString();
  const url = queryString ? `/performance?${queryString}` : '/performance';

  const response = await apiClient.get<PerformanceResponse>(url);
  return response.data;
}

// =============================================
// TanStack Query Hooks
// =============================================

/**
 * Hook to fetch performance data with TanStack Query
 */
export function usePerformanceData(
  orgId: string,
  timeRange: PerformanceTimeRange
) {
  return useQuery({
    queryKey: performanceKeys.data(orgId, timeRange),
    queryFn: () =>
      fetchPerformance({
        organizationId: orgId,
        timeRange,
      }),
    enabled: !!orgId,
  });
}

/**
 * Helper type exports
 */
export type { PerformanceResponse, PerformanceQuery, PerformanceTimeRange };
