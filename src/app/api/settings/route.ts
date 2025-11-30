import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

interface SettingsPayload {
  slackNotifications?: boolean;
  emailNotifications?: boolean;
  escalationDestination?: 'channel' | 'dm';
  notificationFrequency?: 'realtime' | 'batched' | 'daily';
}

/**
 * Get organization settings
 * GET /api/settings?organizationId=xxx
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

    // Fetch organization settings
    const { data: org, error } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', organizationId)
      .single();

    if (error) {
      console.error('Failed to fetch settings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch settings' },
        { status: 500 }
      );
    }

    const settings = (org.settings as SettingsPayload) || {};

    return NextResponse.json({
      settings: {
        slackNotifications: settings.slackNotifications ?? false,
        emailNotifications: settings.emailNotifications ?? false,
        escalationDestination: settings.escalationDestination ?? 'channel',
        notificationFrequency: settings.notificationFrequency ?? 'realtime',
      },
    });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Update organization settings
 * PATCH /api/settings
 * Body: { organizationId: string, settings: SettingsPayload }
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { organizationId, settings } = body;

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

    // Validate settings
    const validSettings: SettingsPayload = {};

    if (typeof settings.slackNotifications === 'boolean') {
      validSettings.slackNotifications = settings.slackNotifications;
    }
    if (typeof settings.emailNotifications === 'boolean') {
      validSettings.emailNotifications = settings.emailNotifications;
    }
    if (['channel', 'dm'].includes(settings.escalationDestination)) {
      validSettings.escalationDestination = settings.escalationDestination;
    }
    if (['realtime', 'batched', 'daily'].includes(settings.notificationFrequency)) {
      validSettings.notificationFrequency = settings.notificationFrequency;
    }

    // Update settings
    const { error: updateError } = await supabase
      .from('organizations')
      .update({ settings: validSettings })
      .eq('id', organizationId);

    if (updateError) {
      console.error('Failed to update settings:', updateError);
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      settings: validSettings,
    });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

