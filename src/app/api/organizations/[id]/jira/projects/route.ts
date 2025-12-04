import { NextResponse } from 'next/server';
import {
  type JiraConfig,
  listProjects,
  setTokenRefreshCallback,
} from '@/lib/jira';
import { requireOrgPermission } from '@/lib/organizations/permissions';
import { createAdminClient, createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/organizations/[id]/jira/projects
 * List Jira projects accessible with current credentials
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const permission = await requireOrgPermission(
      supabase,
      id,
      'integrations:view'
    );
    if (!permission.success) {
      return NextResponse.json(
        { error: permission.error },
        { status: permission.status }
      );
    }

    const adminSupabase = await createAdminClient();

    const { data: integration, error } = await adminSupabase
      .from('jira_integrations')
      .select('cloud_id, access_token, refresh_token, token_expires_at')
      .eq('organization_id', id)
      .single();

    if (error || !integration) {
      return NextResponse.json(
        { error: 'Jira integration not found' },
        { status: 404 }
      );
    }

    // Set up token refresh callback to persist refreshed tokens
    setTokenRefreshCallback(
      async (orgId, newAccessToken, newRefreshToken, expiresAt) => {
        await adminSupabase
          .from('jira_integrations')
          .update({
            access_token: newAccessToken,
            refresh_token: newRefreshToken,
            token_expires_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('organization_id', orgId);
      }
    );

    const config: JiraConfig = {
      cloudId: integration.cloud_id,
      accessToken: integration.access_token,
      refreshToken: integration.refresh_token,
      tokenExpiresAt: integration.token_expires_at
        ? new Date(integration.token_expires_at)
        : null,
      organizationId: id,
    };

    const projects = await listProjects(config);

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error in GET /api/organizations/[id]/jira/projects:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
