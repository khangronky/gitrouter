import { NextResponse } from 'next/server';
import { createClient, createDynamicAdminClient } from '@/lib/supabase/server';
import { requireOrgPermission } from '@/lib/organizations/permissions';
import { testJiraConnection, setTokenRefreshCallback } from '@/lib/jira';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/organizations/[id]/jira/test
 * Test Jira connection with stored OAuth credentials
 */
export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const permission = await requireOrgPermission(
      supabase,
      id,
      'integrations:manage'
    );
    if (!permission.success) {
      return NextResponse.json(
        { error: permission.error },
        { status: permission.status }
      );
    }

    const adminSupabase = await createDynamicAdminClient();

    const { data: integration, error } = await adminSupabase
      .from('jira_integrations')
      .select('cloud_id, access_token, refresh_token, token_expires_at')
      .eq('organization_id', id)
      .single();

    if (error || !integration) {
      return NextResponse.json(
        { error: 'No Jira integration configured' },
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

    const result = await testJiraConnection({
      cloudId: integration.cloud_id,
      accessToken: integration.access_token,
      refreshToken: integration.refresh_token,
      tokenExpiresAt: integration.token_expires_at
        ? new Date(integration.token_expires_at)
        : null,
      organizationId: id,
    });

    return NextResponse.json({
      success: result.success,
      message: result.message,
      user: result.user
        ? {
            displayName: result.user.displayName,
            email: result.user.emailAddress,
          }
        : undefined,
    });
  } catch (error) {
    console.error('Error in POST /api/organizations/[id]/jira/test:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
