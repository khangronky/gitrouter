import { NextResponse } from 'next/server';
import { createClient, createDynamicAdminClient } from '@/lib/supabase/server';
import { requireOrgPermission } from '@/lib/organizations/permissions';
import { testJiraConnection, type JiraConfig } from '@/lib/jira';
import { testJiraConnectionSchema } from '@/lib/schema/jira';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/organizations/[id]/jira/test
 * Test Jira connection with provided credentials
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

    // If no body provided, test with existing credentials
    if (!body || Object.keys(body).length === 0) {
      const adminSupabase = await createDynamicAdminClient();

      const { data: integration, error } = await adminSupabase
        .from('jira_integrations')
        .select('domain, email, api_token')
        .eq('organization_id', id)
        .single();

      if (error || !integration) {
        return NextResponse.json(
          { error: 'No Jira integration configured' },
          { status: 404 }
        );
      }

      const result = await testJiraConnection({
        domain: integration.domain,
        email: integration.email,
        apiToken: integration.api_token,
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
    }

    // Test with provided credentials
    const validation = testJiraConnectionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { domain, email, api_token } = validation.data;

    const config: JiraConfig = {
      domain,
      email,
      apiToken: api_token,
    };

    const result = await testJiraConnection(config);

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
