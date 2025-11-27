import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { testJiraConnection } from '@/lib/jira/client';

/**
 * Connect Jira using API token
 * POST /api/jira/connect
 * Body: { organizationId, email, apiToken, siteUrl }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { organizationId, email, apiToken, siteUrl } = body;

    // Validate required fields
    if (!organizationId || !email || !apiToken || !siteUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: organizationId, email, apiToken, siteUrl' },
        { status: 400 }
      );
    }

    // Verify user is authenticated
    const userSupabase = await createClient();
    const { data: { user } } = await userSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has admin access to the organization
    const supabase = await createAdminClient();
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Test the connection first
    const testResult = await testJiraConnection(email, apiToken, siteUrl);
    
    if (!testResult.success) {
      return NextResponse.json(
        { error: testResult.error || 'Failed to connect to Jira' },
        { status: 400 }
      );
    }

    // Normalize site URL for storage
    const normalizedSiteUrl = siteUrl
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '');

    // Save the integration
    const { error: saveError } = await supabase
      .from('jira_integrations')
      .upsert({
        organization_id: organizationId,
        email,
        site_url: normalizedSiteUrl,
        access_token_encrypted: apiToken, // TODO: Encrypt
        auth_type: 'api_token',
        is_active: true,
        // Set nullable OAuth fields
        cloud_id: null,
        refresh_token_encrypted: null,
        token_expires_at: null,
      }, {
        onConflict: 'organization_id',
      });

    if (saveError) {
      console.error('Failed to save Jira integration:', saveError);
      return NextResponse.json(
        { error: 'Failed to save integration' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Jira connected successfully'
    });
  } catch (error) {
    console.error('Jira connect error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Disconnect Jira integration
 * DELETE /api/jira/connect
 * Body: { organizationId }
 */
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { organizationId } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Missing organizationId' },
        { status: 400 }
      );
    }

    // Verify user is authenticated
    const userSupabase = await createClient();
    const { data: { user } } = await userSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has admin access
    const supabase = await createAdminClient();
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Deactivate the integration
    const { error: updateError } = await supabase
      .from('jira_integrations')
      .update({ is_active: false })
      .eq('organization_id', organizationId);

    if (updateError) {
      console.error('Failed to disconnect Jira:', updateError);
      return NextResponse.json(
        { error: 'Failed to disconnect' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Jira disconnected'
    });
  } catch (error) {
    console.error('Jira disconnect error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get Jira integration status
 * GET /api/jira/connect?organizationId=xxx
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Missing organizationId' },
        { status: 400 }
      );
    }

    // Verify user is authenticated
    const userSupabase = await createClient();
    const { data: { user } } = await userSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has access to the organization
    const supabase = await createAdminClient();
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get integration status
    const { data: integration } = await supabase
      .from('jira_integrations')
      .select('site_url, email, is_active, auto_transition_enabled, created_at, updated_at')
      .eq('organization_id', organizationId)
      .single();

    if (!integration) {
      return NextResponse.json({ 
        connected: false 
      });
    }

    return NextResponse.json({
      connected: integration.is_active,
      siteUrl: integration.site_url,
      email: integration.email,
      autoTransitionEnabled: integration.auto_transition_enabled,
      connectedAt: integration.created_at,
      updatedAt: integration.updated_at,
    });
  } catch (error) {
    console.error('Jira status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

