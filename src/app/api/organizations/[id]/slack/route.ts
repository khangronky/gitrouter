import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { requireOrgPermission } from '@/lib/organizations/permissions';
import { updateSlackIntegrationSchema } from '@/lib/schema/slack';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/organizations/[id]/slack
 * Get Slack integration for an organization
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

    const { data: integration, error } = await supabase
      .from('slack_integrations')
      .select(
        `
        id,
        organization_id,
        team_id,
        team_name,
        bot_user_id,
        default_channel_id,
        created_at,
        updated_at
      `
      )
      .eq('organization_id', id)
      .single();

    if (error || !integration) {
      return NextResponse.json(
        { error: 'Slack integration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ integration });
  } catch (error) {
    console.error('Error in GET /api/organizations/[id]/slack:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/organizations/[id]/slack
 * Update Slack integration settings
 */
export async function PATCH(request: Request, { params }: RouteParams) {
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
    const validation = updateSlackIntegrationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const adminSupabase = await createAdminClient();

    const { data: integration, error } = await adminSupabase
      .from('slack_integrations')
      .update({
        ...validation.data,
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', id)
      .select(
        `
        id,
        organization_id,
        team_id,
        team_name,
        bot_user_id,
        default_channel_id,
        created_at,
        updated_at
      `
      )
      .single();

    if (error || !integration) {
      return NextResponse.json(
        { error: 'Failed to update Slack integration' },
        { status: 500 }
      );
    }

    return NextResponse.json({ integration });
  } catch (error) {
    console.error('Error in PATCH /api/organizations/[id]/slack:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/organizations/[id]/slack
 * Disconnect Slack integration
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

    const adminSupabase = await createAdminClient();

    const { error } = await adminSupabase
      .from('slack_integrations')
      .delete()
      .eq('organization_id', id);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to disconnect Slack' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Slack disconnected successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/organizations/[id]/slack:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
