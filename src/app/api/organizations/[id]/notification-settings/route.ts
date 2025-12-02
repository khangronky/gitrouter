import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  notificationSettingsSchema,
  DEFAULT_NOTIFICATION_SETTINGS,
  type NotificationSettings,
} from '@/lib/schema/organization';
import { requireOrgPermission } from '@/lib/organizations/permissions';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/organizations/[id]/notification-settings
 * Get notification settings for an organization
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const permission = await requireOrgPermission(supabase, id, 'org:view');
    if (!permission.success) {
      return NextResponse.json(
        { error: permission.error },
        { status: permission.status }
      );
    }

    const { data: org, error } = await supabase
      .from('organizations')
      .select('notification_settings')
      .eq('id', id)
      .single();

    if (error || !org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Merge with defaults in case some fields are missing
    const settings: NotificationSettings = {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      ...(org.notification_settings as Partial<NotificationSettings>),
    };

    return NextResponse.json({ notification_settings: settings });
  } catch (error) {
    console.error('Error in GET /api/organizations/[id]/notification-settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/organizations/[id]/notification-settings
 * Update notification settings for an organization
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const permission = await requireOrgPermission(supabase, id, 'org:update');
    if (!permission.success) {
      return NextResponse.json(
        { error: permission.error },
        { status: permission.status }
      );
    }

    const body = await request.json();
    const validation = notificationSettingsSchema.partial().safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    // Get current settings first
    const { data: currentOrg, error: fetchError } = await supabase
      .from('organizations')
      .select('notification_settings')
      .eq('id', id)
      .single();

    if (fetchError || !currentOrg) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Merge with existing settings
    const updatedSettings: NotificationSettings = {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      ...(currentOrg.notification_settings as Partial<NotificationSettings>),
      ...validation.data,
    };

    const { data: org, error } = await supabase
      .from('organizations')
      .update({
        notification_settings: updatedSettings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('notification_settings')
      .single();

    if (error) {
      console.error('Error updating notification settings:', error);
      return NextResponse.json(
        { error: 'Failed to update notification settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({ notification_settings: org.notification_settings });
  } catch (error) {
    console.error('Error in PATCH /api/organizations/[id]/notification-settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

