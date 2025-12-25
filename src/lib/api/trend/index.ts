import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type {
  TrendResponse,
  TrendQuery,
  TrendTimeRange,
} from '@/lib/schema/trend';

// =============================================
// Query Keys
// =============================================

export const trendKeys = {
  all: ['trend'] as const,
  data: (orgId: string, timeRange: TrendTimeRange) =>
    [...trendKeys.all, orgId, timeRange] as const,
};

// =============================================
// Fetcher Function
// =============================================

/**
 * Fetch trend data from the API
 */
export async function fetchTrend(params?: TrendQuery): Promise<TrendResponse> {
  const queryParams = new URLSearchParams();

  if (params?.timeRange) {
    queryParams.set('timeRange', params.timeRange);
  }
  if (params?.organizationId) {
    queryParams.set('organizationId', params.organizationId);
  }

  const queryString = queryParams.toString();
  const url = queryString ? `/trend?${queryString}` : '/trend';

  const response = await apiClient.get<TrendResponse>(url);
  return response.data;
}

// =============================================
// TanStack Query Hooks
// =============================================

/**
 * Hook to fetch trend data with TanStack Query
 */
export function useTrendData(orgId: string, timeRange: TrendTimeRange) {
  return useQuery({
    queryKey: trendKeys.data(orgId, timeRange),
    queryFn: () =>
      fetchTrend({
        organizationId: orgId,
        timeRange,
      }),
    enabled: !!orgId,
  });
}

/**
 * Helper type exports
 */
export type { TrendResponse, TrendQuery, TrendTimeRange };
