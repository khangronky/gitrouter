import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetcher } from '@/lib/api';
import type {
  CreateOrganizationSchema,
  UpdateOrganizationSchema,
  OrganizationListResponseType,
  OrganizationResponseType,
  MemberListResponseType,
  InvitationListResponseType,
  InvitationResponseType,
  CreateInvitationSchema,
  AddMemberSchema,
  UpdateMemberRoleSchema,
  MessageResponseType,
  OrganizationMemberType,
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
  invitations: (id: string) =>
    [...organizationKeys.detail(id), 'invitations'] as const,
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

/**
 * Get organization invitations
 */
export function useOrganizationInvitations(id: string) {
  return useQuery({
    queryKey: organizationKeys.invitations(id),
    queryFn: () =>
      fetcher<InvitationListResponseType>(`/organizations/${id}/invitations`),
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
 * Add member to organization
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

/**
 * Create invitation
 */
export function useCreateInvitation(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInvitationSchema) =>
      fetcher<InvitationResponseType>(`/organizations/${orgId}/invitations`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: organizationKeys.invitations(orgId),
      });
    },
  });
}

/**
 * Cancel invitation
 */
export function useCancelInvitation(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: string) =>
      fetcher<MessageResponseType>(
        `/organizations/${orgId}/invitations?invitation_id=${invitationId}`,
        {
          method: 'DELETE',
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: organizationKeys.invitations(orgId),
      });
    },
  });
}

/**
 * Accept invitation
 */
export function useAcceptInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) =>
      fetcher<MessageResponseType & { organization?: unknown }>(
        `/invitations/${token}/accept`,
        {
          method: 'POST',
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.lists() });
    },
  });
}

/**
 * Get invitation details (for accept page)
 */
export function useInvitationDetails(token: string) {
  return useQuery({
    queryKey: ['invitation', token],
    queryFn: () =>
      fetcher<InvitationResponseType>(`/invitations/${token}/accept`),
    enabled: !!token,
  });
}
