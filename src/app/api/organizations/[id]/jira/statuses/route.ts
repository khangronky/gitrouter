import { NextResponse } from 'next/server';
import {
  getProjectStatuses,
  type JiraConfig,
  setTokenRefreshCallback,
} from '@/lib/jira';
import { requireOrgPermission } from '@/lib/organizations/permissions';
import { createAdminClient, createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/organizations/[id]/jira/statuses
 * Get available statuses for the configured project
 * Query: ?project_key=XXX
 */
export async function GET(request: Request, { params }: RouteParams) {
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

    const { searchParams } = new URL(request.url);
    const projectKey = searchParams.get('project_key');

    const adminSupabase = await createAdminClient();

    const { data: integration, error } = await adminSupabase
      .from('jira_integrations')
      .select(
        'cloud_id, access_token, refresh_token, token_expires_at, default_project_key'
      )
      .eq('organization_id', id)
      .single();

    if (error || !integration) {
      return NextResponse.json(
        { error: 'Jira integration not found' },
        { status: 404 }
      );
    }

    const key = projectKey || integration.default_project_key;

    if (!key) {
      return NextResponse.json(
        { error: 'No project key provided and no default project configured' },
        { status: 400 }
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

    const statuses = await getProjectStatuses(config, key);

    return NextResponse.json({ statuses, project_key: key });
  } catch (error) {
    console.error('Error in GET /api/organizations/[id]/jira/statuses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
