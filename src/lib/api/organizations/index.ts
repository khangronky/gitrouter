import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetcher } from '@/lib/api';
import type {
  CreateOrganizationSchema,
  UpdateOrganizationSchema,
  OrganizationListResponseType,
  OrganizationResponseType,
  MemberListResponseType,
  AddMemberSchema,
  AddMemberByEmailSchema,
  UpdateMemberRoleSchema,
  MessageResponseType,
  OrganizationMemberType,
  NotificationSettings,
} from '@/lib/schema/organization';

// =============================================
// Query Keys
// =============================================

export const organizationKeys = {
  all: ['organizations'] as const,
  lists: () => [...organizationKeys.all, 'list'] as const,
  list: () => [...organizationKeys.lists()] as const,
  details: () => [...organizationKeys.all, 'detail'] as const,
  detail: (id: string) => [...organizationKeys.details(), id] as const,
  members: (id: string) => [...organizationKeys.detail(id), 'members'] as const,
  notificationSettings: (id: string) =>
    [...organizationKeys.detail(id), 'notification-settings'] as const,
};

// =============================================
// Queries
// =============================================

/**
 * Get all organizations for current user
 */
export function useOrganizations() {
  return useQuery({
    queryKey: organizationKeys.list(),
    queryFn: () => fetcher<OrganizationListResponseType>('/organizations'),
  });
}

/**
 * Get organization details
 */
export function useOrganization(id: string) {
  return useQuery({
    queryKey: organizationKeys.detail(id),
    queryFn: () => fetcher<OrganizationResponseType>(`/organizations/${id}`),
    enabled: !!id,
  });
}

/**
 * Get organization members
 */
export function useOrganizationMembers(id: string) {
  return useQuery({
    queryKey: organizationKeys.members(id),
    queryFn: () =>
      fetcher<MemberListResponseType>(`/organizations/${id}/members`),
    enabled: !!id,
  });
}

// =============================================
// Mutations
// =============================================

/**
 * Create organization
 */
export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrganizationSchema) =>
      fetcher<OrganizationResponseType>('/organizations', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.lists() });
    },
  });
}

/**
 * Update organization
 */
export function useUpdateOrganization(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateOrganizationSchema) =>
      fetcher<OrganizationResponseType>(`/organizations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: organizationKeys.lists() });
    },
  });
}

/**
 * Delete organization
 */
export function useDeleteOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetcher<MessageResponseType>(`/organizations/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.lists() });
    },
  });
}

/**
 * Add member to organization (by user_id)
 */
export function useAddMember(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddMemberSchema) =>
      fetcher<{ member: OrganizationMemberType }>(
        `/organizations/${orgId}/members`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: organizationKeys.members(orgId),
      });
    },
  });
}

/**
 * Add member to organization by email
 */
export function useAddMemberByEmail(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddMemberByEmailSchema) =>
      fetcher<{ member: OrganizationMemberType }>(
        `/organizations/${orgId}/members`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: organizationKeys.members(orgId),
      });
    },
  });
}

/**
 * Update member role
 */
export function useUpdateMemberRole(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateMemberRoleSchema & { member_id: string }) =>
      fetcher<{ member: OrganizationMemberType }>(
        `/organizations/${orgId}/members`,
        {
          method: 'PATCH',
          body: JSON.stringify(data),
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: organizationKeys.members(orgId),
      });
    },
  });
}

/**
 * Remove member from organization
 */
export function useRemoveMember(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) =>
      fetcher<MessageResponseType>(
        `/organizations/${orgId}/members?member_id=${memberId}`,
        {
          method: 'DELETE',
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: organizationKeys.members(orgId),
      });
    },
  });
}

// =============================================
// Notification Settings
// =============================================

interface NotificationSettingsResponse {
  notification_settings: NotificationSettings;
}

/**
 * Get notification settings for an organization
 */
export function useNotificationSettings(orgId: string) {
  return useQuery({
    queryKey: organizationKeys.notificationSettings(orgId),
    queryFn: () =>
      fetcher<NotificationSettingsResponse>(
        `/organizations/${orgId}/notification-settings`
      ),
    enabled: !!orgId,
  });
}

/**
 * Update notification settings for an organization
 */
export function useUpdateNotificationSettings(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<NotificationSettings>) =>
      fetcher<NotificationSettingsResponse>(
        `/organizations/${orgId}/notification-settings`,
        {
          method: 'PATCH',
          body: JSON.stringify(data),
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: organizationKeys.notificationSettings(orgId),
      });
    },
  });
}
