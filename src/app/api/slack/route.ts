import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

/**
 * Get Slack integration status
 * GET /api/slack?organizationId=xxx
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Verify user is authenticated
    const userSupabase = await createClient();
    const { data: { user } } = await userSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createAdminClient();

    // Verify user has access to this organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch Slack integration
    const { data: slack } = await supabase
      .from('slack_integrations')
      .select('team_name, team_channel_id, is_active')
      .eq('organization_id', organizationId)
      .single();

    if (!slack || !slack.is_active) {
      return NextResponse.json({
        connected: false,
      });
    }

    return NextResponse.json({
      connected: true,
      teamName: slack.team_name,
      teamChannelId: slack.team_channel_id,
      teamChannelName: slack.team_channel_id ? `#${slack.team_channel_id}` : undefined,
    });
  } catch (error) {
    console.error('Get Slack status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Disconnect Slack integration
 * DELETE /api/slack
 * Body: { organizationId: string }
 */
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { organizationId } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Verify user is authenticated
    const userSupabase = await createClient();
    const { data: { user } } = await userSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createAdminClient();

    // Verify user has admin/owner access
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Disconnect (set inactive)
    const { error: updateError } = await supabase
      .from('slack_integrations')
      .update({ is_active: false })
      .eq('organization_id', organizationId);

    if (updateError) {
      console.error('Failed to disconnect Slack:', updateError);
      return NextResponse.json(
        { error: 'Failed to disconnect Slack' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Disconnect Slack error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

