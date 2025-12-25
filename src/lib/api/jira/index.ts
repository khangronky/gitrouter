import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetcher } from '@/lib/api';
import type {
  JiraIntegrationResponseType,
  JiraConnectionTestResponseType,
  JiraProjectListResponseType,
  JiraStatusListResponseType,
  UpdateJiraIntegrationSchema,
} from '@/lib/schema/jira';
import type { MessageResponseType } from '@/lib/schema/auth';

// =============================================
// Query Keys
// =============================================

export const jiraKeys = {
  all: ['jira'] as const,
  integration: (orgId: string) =>
    [...jiraKeys.all, 'integration', orgId] as const,
  projects: (orgId: string) => [...jiraKeys.all, 'projects', orgId] as const,
  statuses: (orgId: string, projectKey?: string) =>
    [...jiraKeys.all, 'statuses', orgId, projectKey] as const,
};

// =============================================
// Queries
// =============================================

/**
 * Get Jira integration for an organization
 */
export function useJiraIntegration(orgId: string) {
  return useQuery({
    queryKey: jiraKeys.integration(orgId),
    queryFn: () =>
      fetcher<JiraIntegrationResponseType>(`/organizations/${orgId}/jira`),
    enabled: !!orgId,
    retry: false,
  });
}

/**
 * Get Jira projects
 */
export function useJiraProjects(orgId: string) {
  return useQuery({
    queryKey: jiraKeys.projects(orgId),
    queryFn: () =>
      fetcher<JiraProjectListResponseType>(
        `/organizations/${orgId}/jira/projects`
      ),
    enabled: !!orgId,
  });
}

/**
 * Get Jira statuses for a project
 */
export function useJiraStatuses(orgId: string, projectKey?: string) {
  return useQuery({
    queryKey: jiraKeys.statuses(orgId, projectKey),
    queryFn: () => {
      const url = projectKey
        ? `/organizations/${orgId}/jira/statuses?project_key=${projectKey}`
        : `/organizations/${orgId}/jira/statuses`;
      return fetcher<JiraStatusListResponseType>(url);
    },
    enabled: !!orgId,
  });
}

// =============================================
// Mutations
// =============================================

interface GetJiraOAuthUrlParams {
  orgId: string;
  onboarding?: boolean;
}

/**
 * Get Jira OAuth URL
 */
export function useGetJiraOAuthUrl() {
  return useMutation({
    mutationFn: async (params: string | GetJiraOAuthUrlParams) => {
      // Support both string (orgId only) and object (with onboarding flag)
      const orgId = typeof params === 'string' ? params : params.orgId;
      const onboarding = typeof params === 'string' ? false : params.onboarding;

      const queryParams = new URLSearchParams({ org_id: orgId });
      if (onboarding) {
        queryParams.set('onboarding', 'true');
      }

      const response = await fetcher<{ url: string }>(
        `/jira/oauth?${queryParams.toString()}`
      );
      return response;
    },
  });
}

/**
 * Update Jira integration settings
 */
export function useUpdateJiraIntegration(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateJiraIntegrationSchema) =>
      fetcher<JiraIntegrationResponseType>(`/organizations/${orgId}/jira`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: jiraKeys.integration(orgId),
      });
    },
  });
}

/**
 * Test Jira connection
 */
export function useTestJiraConnection(orgId: string) {
  return useMutation({
    mutationFn: () =>
      fetcher<JiraConnectionTestResponseType>(
        `/organizations/${orgId}/jira/test`,
        {
          method: 'POST',
          body: '{}',
        }
      ),
  });
}

/**
 * Remove Jira integration
 */
export function useRemoveJiraIntegration(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      fetcher<MessageResponseType>(`/organizations/${orgId}/jira`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: jiraKeys.integration(orgId),
      });
    },
  });
}
