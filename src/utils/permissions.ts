/**
 * Permission utilities
 * Pure functions and constants for role-based access control
 */

import type { OrganizationRole } from '@/lib/schema/organization';

/**
 * Permission levels for different actions
 */
export const ROLE_HIERARCHY: Record<OrganizationRole, number> = {
  owner: 3,
  admin: 2,
  member: 1,
};

/**
 * Required role for each action
 */
export const ACTION_REQUIREMENTS: Record<string, OrganizationRole> = {
  // Organization
  'org:view': 'member',
  'org:update': 'admin',
  'org:delete': 'owner',

  // Members
  'members:view': 'member',
  'members:invite': 'admin',
  'members:remove': 'admin',
  'members:update_role': 'admin',

  // Repositories
  'repos:view': 'member',
  'repos:add': 'admin',
  'repos:remove': 'admin',
  'repos:update': 'admin',

  // Routing rules
  'rules:view': 'member',
  'rules:create': 'admin',
  'rules:update': 'admin',
  'rules:delete': 'admin',

  // Reviewers
  'reviewers:view': 'member',
  'reviewers:manage': 'admin',

  // Integrations
  'integrations:view': 'member',
  'integrations:manage': 'admin',
};

export type PermissionAction = keyof typeof ACTION_REQUIREMENTS;

/**
 * Check if a role has permission for an action
 */
export function hasPermission(
  userRole: OrganizationRole,
  action: PermissionAction
): boolean {
  const requiredRole = ACTION_REQUIREMENTS[action];
  if (!requiredRole) return false;

  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}
