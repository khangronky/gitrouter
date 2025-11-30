import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetcher } from '@/lib/api';
import type {
  JiraIntegrationResponseType,
  JiraConnectionTestResponseType,
  JiraProjectListResponseType,
  JiraStatusListResponseType,
  UpsertJiraIntegrationSchema,
  TestJiraConnectionSchema,
  MessageResponseType,
} from '@/lib/schema/jira';

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

/**
 * Save Jira integration
 */
export function useSaveJiraIntegration(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpsertJiraIntegrationSchema) =>
      fetcher<
        JiraIntegrationResponseType & {
          user?: { displayName: string; email: string };
        }
      >(`/organizations/${orgId}/jira`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: jiraKeys.integration(orgId),
      });
      queryClient.invalidateQueries({
        queryKey: jiraKeys.projects(orgId),
      });
    },
  });
}

/**
 * Test Jira connection
 */
export function useTestJiraConnection(orgId: string) {
  return useMutation({
    mutationFn: (data?: TestJiraConnectionSchema) =>
      fetcher<JiraConnectionTestResponseType>(
        `/organizations/${orgId}/jira/test`,
        {
          method: 'POST',
          body: data ? JSON.stringify(data) : '{}',
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
