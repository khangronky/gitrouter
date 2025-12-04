import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetcher } from '@/lib/api';
import type {
  SlackIntegrationResponseType,
  SlackChannelListResponseType,
  UpdateSlackIntegrationSchema,
} from '@/lib/schema/slack';
import type { MessageResponseType } from '@/lib/schema/auth';

// =============================================
// Query Keys
// =============================================

export const slackKeys = {
  all: ['slack'] as const,
  integration: (orgId: string) =>
    [...slackKeys.all, 'integration', orgId] as const,
  channels: (orgId: string) => [...slackKeys.all, 'channels', orgId] as const,
};

// =============================================
// Queries
// =============================================

/**
 * Get Slack integration for an organization
 */
export function useSlackIntegration(orgId: string) {
  return useQuery({
    queryKey: slackKeys.integration(orgId),
    queryFn: () =>
      fetcher<SlackIntegrationResponseType>(`/organizations/${orgId}/slack`),
    enabled: !!orgId,
    retry: false,
  });
}

/**
 * Get available Slack channels
 */
export function useSlackChannels(orgId: string) {
  return useQuery({
    queryKey: slackKeys.channels(orgId),
    queryFn: () =>
      fetcher<SlackChannelListResponseType>(
        `/organizations/${orgId}/slack/channels`
      ),
    enabled: !!orgId,
  });
}

// =============================================
// Mutations
// =============================================

/**
 * Get Slack OAuth URL
 */
export function useGetSlackOAuthUrl() {
  return useMutation({
    mutationFn: async (orgId: string) => {
      const response = await fetcher<{ url: string }>(
        `/slack/oauth?org_id=${orgId}`
      );
      return response;
    },
  });
}

/**
 * Update Slack integration settings
 */
export function useUpdateSlackIntegration(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateSlackIntegrationSchema) =>
      fetcher<SlackIntegrationResponseType>(`/organizations/${orgId}/slack`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: slackKeys.integration(orgId),
      });
    },
  });
}

/**
 * Disconnect Slack integration
 */
export function useDisconnectSlack(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      fetcher<MessageResponseType>(`/organizations/${orgId}/slack`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: slackKeys.integration(orgId),
      });
    },
  });
}

/**
 * Test Slack connection by sending a test message
 */
export function useTestSlackConnection(orgId: string) {
  return useMutation({
    mutationFn: () =>
      fetcher<MessageResponseType>(`/organizations/${orgId}/slack/test`, {
        method: 'POST',
      }),
  });
}
