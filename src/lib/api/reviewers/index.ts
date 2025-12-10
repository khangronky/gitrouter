import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetcher } from '@/lib/api';
import type {
  CreateReviewerSchema,
  ReviewerListResponseType,
  ReviewerResponseType,
} from '@/lib/schema/reviewer';

// =============================================
// Query Keys
// =============================================

export const reviewerKeys = {
  all: ['reviewers'] as const,
  lists: () => [...reviewerKeys.all, 'list'] as const,
  list: (orgId: string) => [...reviewerKeys.lists(), orgId] as const,
};

// =============================================
// Queries
// =============================================

/**
 * Get all reviewers for an organization
 */
export function useReviewers(orgId: string) {
  return useQuery({
    queryKey: reviewerKeys.list(orgId),
    queryFn: () =>
      fetcher<ReviewerListResponseType>(`/organizations/${orgId}/reviewers`),
    enabled: !!orgId,
  });
}

// =============================================
// Mutations
// =============================================

/**
 * Create a reviewer
 */
export function useCreateReviewer(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReviewerSchema) =>
      fetcher<ReviewerResponseType>(`/organizations/${orgId}/reviewers`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: reviewerKeys.list(orgId),
      });
    },
  });
}

/**
 * Ensure current user has a reviewer entry
 * Returns existing reviewer if found, creates new one if not
 */
export function useEnsureCurrentUserReviewer(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: {
      user_id: string;
      name: string;
      email?: string;
    }) => {
      // First try to fetch existing reviewer for user
      const response = await fetcher<ReviewerListResponseType>(
        `/organizations/${orgId}/reviewers`
      );

      const existingReviewer = response.reviewers.find(
        (r) => r.user?.id === userData.user_id
      );

      if (existingReviewer) {
        return { reviewer: existingReviewer, created: false };
      }

      // Create new reviewer
      const newReviewer = await fetcher<ReviewerResponseType>(
        `/organizations/${orgId}/reviewers`,
        {
          method: 'POST',
          body: JSON.stringify({
            name: userData.name,
            user_id: userData.user_id,
            email: userData.email,
          }),
        }
      );

      return { reviewer: newReviewer.reviewer, created: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: reviewerKeys.list(orgId),
      });
    },
  });
}

// =============================================
// Slack Sync Response Type
// =============================================

interface SyncSlackResponse {
  slack_synced: number;
  github_synced: number;
  already_linked: number;
  not_found: string[];
  errors: string[];
}

/**
 * Sync reviewers with Slack and GitHub by looking up their email addresses
 */
export function useSyncReviewersSlack(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      fetcher<SyncSlackResponse>(
        `/organizations/${orgId}/reviewers/sync-slack`,
        {
          method: 'POST',
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: reviewerKeys.list(orgId),
      });
    },
  });
}

// =============================================
// GitHub Sync Response Type
// =============================================

interface SyncGitHubResponse {
  created: number;
  updated: number;
  skipped: number;
  collaborators_found: number;
}

/**
 * Sync reviewers from GitHub repository collaborators
 */
export function useSyncReviewersGitHub(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      fetcher<SyncGitHubResponse>(
        `/organizations/${orgId}/reviewers/sync-github`,
        {
          method: 'POST',
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: reviewerKeys.list(orgId),
      });
    },
  });
}
