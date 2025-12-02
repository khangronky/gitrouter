import { NextResponse } from 'next/server';
import { createClient, createDynamicAdminClient } from '@/lib/supabase/server';
import { requireOrgPermission } from '@/lib/organizations/permissions';
import { updateJiraIntegrationSchema } from '@/lib/schema/jira';

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

    const permission = await requireOrgPermission(supabase, id, 'integrations:view');
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
        cloud_id,
        site_url,
        site_name,
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

    // Don't return access_token or refresh_token
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
 * PATCH /api/organizations/[id]/jira
 * Update Jira integration settings (project, status on merge)
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const permission = await requireOrgPermission(supabase, id, 'integrations:manage');
    if (!permission.success) {
      return NextResponse.json(
        { error: permission.error },
        { status: permission.status }
      );
    }

    const body = await request.json();
    const validation = updateJiraIntegrationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const adminSupabase = await createDynamicAdminClient();

    // Check if integration exists
    const { data: existing, error: existingError } = await adminSupabase
      .from('jira_integrations')
      .select('id')
      .eq('organization_id', id)
      .single();

    if (existingError || !existing) {
      return NextResponse.json(
        { error: 'Jira integration not found' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (validation.data.default_project_key !== undefined) {
      updateData.default_project_key = validation.data.default_project_key;
    }

    if (validation.data.status_on_merge !== undefined) {
      updateData.status_on_merge = validation.data.status_on_merge;
    }

    const { data: integration, error } = await adminSupabase
      .from('jira_integrations')
      .update(updateData)
      .eq('organization_id', id)
      .select(
        'id, organization_id, cloud_id, site_url, site_name, default_project_key, status_on_merge, created_at, updated_at'
      )
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ integration });
  } catch (error) {
    console.error('Error in PATCH /api/organizations/[id]/jira:', error);
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

    const permission = await requireOrgPermission(supabase, id, 'integrations:manage');
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

    return NextResponse.json({ message: 'Jira integration removed successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/organizations/[id]/jira:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
