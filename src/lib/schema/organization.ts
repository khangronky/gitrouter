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
 * Notification Settings Schema
 */
export const notificationSettingsSchema = z.object({
  slack_notifications: z.boolean().default(true),
  email_notifications: z.boolean().default(false),
  escalation_destination: z.enum(['channel', 'dm']).default('channel'),
  notification_frequency: z
    .enum(['realtime', 'batched', 'daily'])
    .default('realtime'),
});

export type NotificationSettings = z.infer<typeof notificationSettingsSchema>;

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  slack_notifications: true,
  email_notifications: false,
  escalation_destination: 'channel',
  notification_frequency: 'realtime',
};

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
  settings: z.record(z.string(), z.unknown()).optional(),
  notification_settings: notificationSettingsSchema.partial().optional(),
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
  notification_settings: NotificationSettings;
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
 * Add Member Schema (by user_id)
 */
export const addMemberSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  role: z.enum(['member', 'admin']).default('member'),
});

export type AddMemberSchema = z.infer<typeof addMemberSchema>;

/**
 * Add Member by Email Schema
 */
export const addMemberByEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['member', 'admin']).default('member'),
});

export type AddMemberByEmailSchema = z.infer<typeof addMemberByEmailSchema>;

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
