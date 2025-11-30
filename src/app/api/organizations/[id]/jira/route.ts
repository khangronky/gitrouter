import { NextResponse } from 'next/server';
import { createClient, createDynamicAdminClient } from '@/lib/supabase/server';
import { requireOrgPermission } from '@/lib/organizations/permissions';
import { upsertJiraIntegrationSchema } from '@/lib/schema/jira';
import { testJiraConnection } from '@/lib/jira';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/organizations/[id]/jira
 * Get Jira integration for an organization
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

    const adminSupabase = await createDynamicAdminClient();

    const { data: integration, error } = await adminSupabase
      .from('jira_integrations')
      .select(
        `
        id,
        organization_id,
        domain,
        email,
        default_project_key,
        status_on_merge,
        created_at,
        updated_at
      `
      )
      .eq('organization_id', id)
      .single();

    if (error || !integration) {
      return NextResponse.json(
        { error: 'Jira integration not found' },
        { status: 404 }
      );
    }

    // Don't return the API token
    return NextResponse.json({ integration });
  } catch (error) {
    console.error('Error in GET /api/organizations/[id]/jira:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/organizations/[id]/jira
 * Create or update Jira integration
 */
export async function POST(request: Request, { params }: RouteParams) {
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

    const body = await request.json();
    const validation = upsertJiraIntegrationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { domain, email, api_token, default_project_key, status_on_merge } =
      validation.data;

    // Test connection before saving
    const testResult = await testJiraConnection({
      domain,
      email,
      apiToken: api_token,
    });

    if (!testResult.success) {
      return NextResponse.json(
        { error: `Connection failed: ${testResult.message}` },
        { status: 400 }
      );
    }

    const adminSupabase = await createDynamicAdminClient();

    // Check if integration already exists
    const { data: existing } = await adminSupabase
      .from('jira_integrations')
      .select('id')
      .eq('organization_id', id)
      .single();

    const integrationData = {
      organization_id: id,
      domain,
      email,
      api_token,
      default_project_key: default_project_key || null,
      status_on_merge: status_on_merge || null,
      updated_at: new Date().toISOString(),
    };

    let integration;

    if (existing) {
      // Update existing
      const { data, error } = await adminSupabase
        .from('jira_integrations')
        .update(integrationData)
        .eq('organization_id', id)
        .select(
          'id, organization_id, domain, email, default_project_key, status_on_merge, created_at, updated_at'
        )
        .single();

      if (error) {
        throw error;
      }
      integration = data;
    } else {
      // Create new
      const { data, error } = await adminSupabase
        .from('jira_integrations')
        .insert(integrationData)
        .select(
          'id, organization_id, domain, email, default_project_key, status_on_merge, created_at, updated_at'
        )
        .single();

      if (error) {
        throw error;
      }
      integration = data;
    }

    return NextResponse.json({
      integration,
      user: testResult.user
        ? {
            displayName: testResult.user.displayName,
            email: testResult.user.emailAddress,
          }
        : null,
    });
  } catch (error) {
    console.error('Error in POST /api/organizations/[id]/jira:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/organizations/[id]/jira
 * Remove Jira integration
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
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

    const { error } = await adminSupabase
      .from('jira_integrations')
      .delete()
      .eq('organization_id', id);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to remove Jira integration' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Jira integration removed successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/organizations/[id]/jira:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
