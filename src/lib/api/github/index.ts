import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetcher } from '@/lib/api';
import type {
  GitHubInstallationListResponseType,
  GitHubInstallationResponseType,
} from '@/lib/schema/github';
import type { AvailableRepositoriesResponseType } from '@/lib/schema/repository';

// =============================================
// Query Keys
// =============================================

export const githubKeys = {
  all: ['github'] as const,
  installations: () => [...githubKeys.all, 'installations'] as const,
  installation: (orgId: string) =>
    [...githubKeys.installations(), orgId] as const,
  availableRepos: (orgId: string) =>
    [...githubKeys.all, 'available-repos', orgId] as const,
};

// =============================================
// Queries
// =============================================

/**
 * Get GitHub installation for an organization
 */
export function useGitHubInstallation(orgId: string) {
  return useQuery({
    queryKey: githubKeys.installation(orgId),
    queryFn: () =>
      fetcher<GitHubInstallationResponseType>(
        `/organizations/${orgId}/github-installation`
      ),
    enabled: !!orgId,
    retry: false, // Don't retry if not found
  });
}

/**
 * Get available repositories from GitHub installation
 */
export function useAvailableRepositories(orgId: string) {
  return useQuery({
    queryKey: githubKeys.availableRepos(orgId),
    queryFn: () =>
      fetcher<AvailableRepositoriesResponseType>(
        `/github/available-repos?org_id=${orgId}`
      ),
    enabled: !!orgId,
  });
}

// =============================================
// Mutations
// =============================================

interface GetInstallUrlParams {
  orgId: string;
  onboarding?: boolean;
}

/**
 * Get GitHub App installation URL
 */
export function useGetInstallUrl() {
  return useMutation({
    mutationFn: async (params: string | GetInstallUrlParams) => {
      // Support both string (orgId only) and object (with onboarding flag)
      const orgId = typeof params === 'string' ? params : params.orgId;
      const onboarding = typeof params === 'string' ? false : params.onboarding;

      const queryParams = new URLSearchParams({ org_id: orgId });
      if (onboarding) {
        queryParams.set('onboarding', 'true');
      }

      const response = await fetcher<{ url: string }>(
        `/github/install?${queryParams.toString()}`
      );
      return response;
    },
  });
}

/**
 * Add multiple repositories from GitHub
 */
export function useAddRepositoriesFromGitHub(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      repos: Array<{
        github_repo_id: number;
        full_name: string;
        default_branch: string;
      }>
    ) => {
      // Add repositories one by one
      const results = await Promise.all(
        repos.map((repo) =>
          fetcher(`/organizations/${orgId}/repositories`, {
            method: 'POST',
            body: JSON.stringify(repo),
          }).catch((error) => ({ error, repo }))
        )
      );

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: githubKeys.availableRepos(orgId),
      });
      queryClient.invalidateQueries({
        queryKey: ['repositories', 'list', orgId],
      });
    },
  });
}

/**
 * Refresh available repositories from GitHub
 */
export function useRefreshAvailableRepos(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Just invalidate the query to refetch
      await queryClient.invalidateQueries({
        queryKey: githubKeys.availableRepos(orgId),
      });
    },
  });
}
