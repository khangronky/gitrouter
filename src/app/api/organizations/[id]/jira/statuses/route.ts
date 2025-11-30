import { NextResponse } from 'next/server';
import { createClient, createDynamicAdminClient } from '@/lib/supabase/server';
import { requireOrgPermission } from '@/lib/organizations/permissions';
import { getProjectStatuses, type JiraConfig } from '@/lib/jira';

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

    const adminSupabase = await createDynamicAdminClient();

    const { data: integration, error } = await adminSupabase
      .from('jira_integrations')
      .select('domain, email, api_token, default_project_key')
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

    const config: JiraConfig = {
      domain: integration.domain,
      email: integration.email,
      apiToken: integration.api_token,
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
