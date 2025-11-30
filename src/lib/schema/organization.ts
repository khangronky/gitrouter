import { z } from 'zod';

// =============================================
// Organization Schemas
// =============================================

/**
 * Organization Role
 */
export const organizationRoleSchema = z.enum(['owner', 'admin', 'member']);
export type OrganizationRole = z.infer<typeof organizationRoleSchema>;

/**
 * Create Organization Schema
 */
export const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(100, 'Organization name must be at most 100 characters'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(50, 'Slug must be at most 50 characters')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug must be lowercase alphanumeric with hyphens'
    )
    .optional(),
});

export type CreateOrganizationSchema = z.infer<typeof createOrganizationSchema>;

/**
 * Update Organization Schema
 */
export const updateOrganizationSchema = z.object({
  name: z
    .string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(100, 'Organization name must be at most 100 characters')
    .optional(),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(50, 'Slug must be at most 50 characters')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug must be lowercase alphanumeric with hyphens'
    )
    .optional(),
  default_reviewer_id: z.string().uuid().nullable().optional(),
  settings: z.record(z.unknown()).optional(),
});

export type UpdateOrganizationSchema = z.infer<typeof updateOrganizationSchema>;

/**
 * Organization Response Type
 */
export interface OrganizationType {
  id: string;
  name: string;
  slug: string;
  created_by: string;
  default_reviewer_id: string | null;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Organization with Role (for user's org list)
 */
export interface OrganizationWithRoleType extends OrganizationType {
  role: OrganizationRole;
  member_count?: number;
}

// =============================================
// Organization Members Schemas
// =============================================

/**
 * Add Member Schema
 */
export const addMemberSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  role: organizationRoleSchema.default('member'),
});

export type AddMemberSchema = z.infer<typeof addMemberSchema>;

/**
 * Update Member Role Schema
 */
export const updateMemberRoleSchema = z.object({
  role: organizationRoleSchema,
});

export type UpdateMemberRoleSchema = z.infer<typeof updateMemberRoleSchema>;

/**
 * Organization Member Type
 */
export interface OrganizationMemberType {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrganizationRole;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    full_name: string | null;
    username: string | null;
  };
}

// =============================================
// Invitation Schemas
// =============================================

/**
 * Invitation Status
 */
export const invitationStatusSchema = z.enum([
  'pending',
  'accepted',
  'expired',
  'cancelled',
]);
export type InvitationStatus = z.infer<typeof invitationStatusSchema>;

/**
 * Create Invitation Schema
 */
export const createInvitationSchema = z.object({
  email: z.email('Invalid email address'),
  role: organizationRoleSchema.default('member'),
});

export type CreateInvitationSchema = z.infer<typeof createInvitationSchema>;

/**
 * Accept Invitation Schema
 */
export const acceptInvitationSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export type AcceptInvitationSchema = z.infer<typeof acceptInvitationSchema>;

/**
 * Invitation Type
 */
export interface InvitationType {
  id: string;
  organization_id: string;
  email: string;
  role: OrganizationRole;
  token: string;
  status: InvitationStatus;
  invited_by: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  organization?: {
    id: string;
    name: string;
    slug: string;
  };
  inviter?: {
    id: string;
    email: string;
    full_name: string | null;
  };
}

// =============================================
// Response Types
// =============================================

export interface OrganizationListResponseType {
  organizations: OrganizationWithRoleType[];
}

export interface OrganizationResponseType {
  organization: OrganizationType;
}

export interface MemberListResponseType {
  members: OrganizationMemberType[];
}

export interface InvitationListResponseType {
  invitations: InvitationType[];
}

export interface InvitationResponseType {
  invitation: InvitationType;
}

export interface MessageResponseType {
  message: string;
}

