import { NextResponse } from 'next/server';
import { createClient, createDynamicAdminClient } from '@/lib/supabase/server';
import { requireOrgPermission } from '@/lib/organizations/permissions';
import { listProjects, type JiraConfig } from '@/lib/jira';

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
      .select('domain, email, api_token')
      .eq('organization_id', id)
      .single();

    if (error || !integration) {
      return NextResponse.json(
        { error: 'Jira integration not found' },
        { status: 404 }
      );
    }

    const config: JiraConfig = {
      domain: integration.domain,
      email: integration.email,
      apiToken: integration.api_token,
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

