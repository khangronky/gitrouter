import { useQuery } from '@tanstack/react-query';
import { fetcher } from '@/lib/api';

// =============================================
// Types
// =============================================

export interface EscalationSummary {
  pending_reviews: number;
  overdue_24h: number;
  overdue_48h: number;
  assignments: Array<{
    id: string;
    hours_pending: number;
    reviewer_name: string;
    pr_title: string;
    pr_number: number;
    repo_name: string;
  }>;
}

// =============================================
// Query Keys
// =============================================

export const escalationKeys = {
  all: ['escalations'] as const,
  summary: (orgId: string) => [...escalationKeys.all, 'summary', orgId] as const,
};

// =============================================
// Queries
// =============================================

/**
 * Get escalation summary for an organization
 */
export function useEscalationSummary(orgId: string) {
  return useQuery({
    queryKey: escalationKeys.summary(orgId),
    queryFn: () =>
      fetcher<EscalationSummary>(`/organizations/${orgId}/escalations`),
    enabled: !!orgId,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

