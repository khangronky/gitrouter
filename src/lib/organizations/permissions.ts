import type { SupabaseClient } from '@supabase/supabase-js';

// biome-ignore lint: Using any for flexibility with typed/untyped clients
type AnySupabaseClient = SupabaseClient<any>;
import type { OrganizationRole } from '@/lib/schema/organization';

/**
 * Permission levels for different actions
 */
const ROLE_HIERARCHY: Record<OrganizationRole, number> = {
  owner: 3,
  admin: 2,
  member: 1,
};

/**
 * Required role for each action
 */
const ACTION_REQUIREMENTS: Record<string, OrganizationRole> = {
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

/**
 * Get user's membership in an organization
 */
export async function getOrgMembership(
  supabase: AnySupabaseClient,
  organizationId: string,
  userId: string
): Promise<{ role: OrganizationRole } | null> {
  const { data, error } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return { role: data.role as OrganizationRole };
}

/**
 * Check if user can perform action on organization
 * Returns the user's role if allowed, null if not
 */
export async function checkOrgPermission(
  supabase: AnySupabaseClient,
  organizationId: string,
  userId: string,
  action: PermissionAction
): Promise<{ allowed: boolean; role: OrganizationRole | null }> {
  const membership = await getOrgMembership(supabase, organizationId, userId);

  if (!membership) {
    return { allowed: false, role: null };
  }

  return {
    allowed: hasPermission(membership.role, action),
    role: membership.role,
  };
}

/**
 * Verify user is authenticated and return user ID
 */
export async function getAuthenticatedUser(
  supabase: AnySupabaseClient
): Promise<{ userId: string } | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return { userId: user.id };
}

/**
 * Combined auth + permission check
 */
export async function requireOrgPermission(
  supabase: AnySupabaseClient,
  organizationId: string,
  action: PermissionAction
): Promise<
  | { success: true; userId: string; role: OrganizationRole }
  | { success: false; error: string; status: number }
> {
  const auth = await getAuthenticatedUser(supabase);
  if (!auth) {
    return { success: false, error: 'Unauthorized', status: 401 };
  }

  const permission = await checkOrgPermission(
    supabase,
    organizationId,
    auth.userId,
    action
  );

  if (!permission.allowed) {
    return {
      success: false,
      error: 'You do not have permission to perform this action',
      status: 403,
    };
  }

  return { success: true, userId: auth.userId, role: permission.role! };
}
