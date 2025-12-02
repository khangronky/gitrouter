import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetcher } from '@/lib/api';
import type {
  CreateRoutingRuleSchema,
  UpdateRoutingRuleSchema,
  RoutingRuleListResponseType,
  RoutingRuleResponseType,
  ReorderRulesSchema,
  MessageResponseType,
} from '@/lib/schema/routing-rule';

// =============================================
// Query Keys
// =============================================

export const ruleKeys = {
  all: ['rules'] as const,
  lists: () => [...ruleKeys.all, 'list'] as const,
  list: (orgId: string, repositoryId?: string) =>
    [...ruleKeys.lists(), orgId, repositoryId] as const,
  details: () => [...ruleKeys.all, 'detail'] as const,
  detail: (orgId: string, ruleId: string) =>
    [...ruleKeys.details(), orgId, ruleId] as const,
};

// =============================================
// Queries
// =============================================

/**
 * Get all routing rules for an organization
 */
export function useRoutingRules(orgId: string, repositoryId?: string) {
  return useQuery({
    queryKey: ruleKeys.list(orgId, repositoryId),
    queryFn: () => {
      const url = repositoryId
        ? `/organizations/${orgId}/rules?repository_id=${repositoryId}`
        : `/organizations/${orgId}/rules`;
      return fetcher<RoutingRuleListResponseType>(url);
    },
    enabled: !!orgId,
  });
}

/**
 * Get a specific routing rule
 */
export function useRoutingRule(orgId: string, ruleId: string) {
  return useQuery({
    queryKey: ruleKeys.detail(orgId, ruleId),
    queryFn: () =>
      fetcher<RoutingRuleResponseType>(
        `/organizations/${orgId}/rules/${ruleId}`
      ),
    enabled: !!orgId && !!ruleId,
  });
}

// =============================================
// Mutations
// =============================================

/**
 * Create a routing rule
 */
export function useCreateRoutingRule(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRoutingRuleSchema) =>
      fetcher<RoutingRuleResponseType>(`/organizations/${orgId}/rules`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ruleKeys.lists(),
      });
    },
  });
}

/**
 * Update a routing rule
 */
export function useUpdateRoutingRule(orgId: string, ruleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateRoutingRuleSchema) =>
      fetcher<RoutingRuleResponseType>(
        `/organizations/${orgId}/rules/${ruleId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(data),
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ruleKeys.detail(orgId, ruleId),
      });
      queryClient.invalidateQueries({
        queryKey: ruleKeys.lists(),
      });
    },
  });
}

/**
 * Delete a routing rule
 */
export function useDeleteRoutingRule(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ruleId: string) =>
      fetcher<MessageResponseType>(`/organizations/${orgId}/rules/${ruleId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ruleKeys.lists(),
      });
    },
  });
}

/**
 * Toggle a rule's active status
 */
export function useToggleRuleActive(orgId: string, ruleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (isActive: boolean) =>
      fetcher<RoutingRuleResponseType>(
        `/organizations/${orgId}/rules/${ruleId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ is_active: isActive }),
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ruleKeys.detail(orgId, ruleId),
      });
      queryClient.invalidateQueries({
        queryKey: ruleKeys.lists(),
      });
    },
  });
}

/**
 * Reorder routing rules
 */
export function useReorderRules(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ReorderRulesSchema) =>
      fetcher<MessageResponseType>(`/organizations/${orgId}/rules/reorder`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ruleKeys.lists(),
      });
    },
  });
}
