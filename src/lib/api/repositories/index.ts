import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetcher } from '@/lib/api';
import type {
  AddRepositorySchema,
  UpdateRepositorySchema,
  RepositoryListResponseType,
  RepositoryResponseType,
} from '@/lib/schema/repository';
import type { MessageResponseType } from '@/lib/schema/auth';

// =============================================
// Query Keys
// =============================================

export const repositoryKeys = {
  all: ['repositories'] as const,
  lists: () => [...repositoryKeys.all, 'list'] as const,
  list: (orgId: string) => [...repositoryKeys.lists(), orgId] as const,
  details: () => [...repositoryKeys.all, 'detail'] as const,
  detail: (orgId: string, repoId: string) =>
    [...repositoryKeys.details(), orgId, repoId] as const,
};

// =============================================
// Queries
// =============================================

/**
 * Get all repositories for an organization
 */
export function useRepositories(orgId: string) {
  return useQuery({
    queryKey: repositoryKeys.list(orgId),
    queryFn: () =>
      fetcher<RepositoryListResponseType>(
        `/organizations/${orgId}/repositories`
      ),
    enabled: !!orgId,
  });
}

/**
 * Get repository details
 */
export function useRepository(orgId: string, repoId: string) {
  return useQuery({
    queryKey: repositoryKeys.detail(orgId, repoId),
    queryFn: () =>
      fetcher<RepositoryResponseType>(
        `/organizations/${orgId}/repositories/${repoId}`
      ),
    enabled: !!orgId && !!repoId,
  });
}

// =============================================
// Mutations
// =============================================

/**
 * Add repository to organization
 */
export function useAddRepository(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddRepositorySchema) =>
      fetcher<RepositoryResponseType>(`/organizations/${orgId}/repositories`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: repositoryKeys.list(orgId),
      });
    },
  });
}

/**
 * Update repository
 */
export function useUpdateRepository(orgId: string, repoId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateRepositorySchema) =>
      fetcher<RepositoryResponseType>(
        `/organizations/${orgId}/repositories/${repoId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(data),
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: repositoryKeys.detail(orgId, repoId),
      });
      queryClient.invalidateQueries({
        queryKey: repositoryKeys.list(orgId),
      });
    },
  });
}

/**
 * Remove repository from organization
 */
export function useRemoveRepository(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (repoId: string) =>
      fetcher<MessageResponseType>(
        `/organizations/${orgId}/repositories/${repoId}`,
        {
          method: 'DELETE',
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: repositoryKeys.list(orgId),
      });
    },
  });
}

/**
 * Toggle repository active status
 */
export function useToggleRepositoryActive(orgId: string, repoId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (isActive: boolean) =>
      fetcher<RepositoryResponseType>(
        `/organizations/${orgId}/repositories/${repoId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ is_active: isActive }),
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: repositoryKeys.detail(orgId, repoId),
      });
      queryClient.invalidateQueries({
        queryKey: repositoryKeys.list(orgId),
      });
    },
  });
}

// =============================================
// PR Sync
// =============================================

interface SyncPRsResponse {
  success: boolean;
  summary: {
    repositoriesTotal: number;
    repositoriesSucceeded: number;
    repositoriesFailed: number;
    prsProcessed: number;
    prsInserted: number;
    prsUpdated: number;
  };
}

/**
 * Sync PRs for all repositories in an organization
 */
export function useSyncPRs(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      fetcher<SyncPRsResponse>(`/organizations/${orgId}/repositories/sync`, {
        method: 'POST',
      }),
    onSuccess: () => {
      // Invalidate repository list to refresh PR counts
      queryClient.invalidateQueries({
        queryKey: repositoryKeys.list(orgId),
      });
    },
  });
}
