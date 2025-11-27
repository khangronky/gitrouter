import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

const JIRA_CLIENT_ID = process.env.JIRA_CLIENT_ID;
const JIRA_CLIENT_SECRET = process.env.JIRA_CLIENT_SECRET;
const JIRA_REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/jira/oauth`
  : 'http://localhost:3000/api/jira/oauth';

/**
 * Jira OAuth callback handler
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state'); // Contains org_id
  const error = url.searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      new URL(`/integrations?error=jira_${error}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/integrations?error=jira_no_code', request.url)
    );
  }

  if (!JIRA_CLIENT_ID || !JIRA_CLIENT_SECRET) {
    console.error('Jira OAuth credentials not configured');
    return NextResponse.redirect(
      new URL('/integrations?error=jira_not_configured', request.url)
    );
  }

  // Verify user is authenticated
  const userSupabase = await createClient();
  const { data: { user } } = await userSupabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(
      new URL(`/login?redirect=/api/jira/oauth?code=${code}&state=${state}`, request.url)
    );
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://auth.atlassian.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: JIRA_CLIENT_ID,
        client_secret: JIRA_CLIENT_SECRET,
        code,
        redirect_uri: JIRA_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Jira token exchange failed:', errorData);
      return NextResponse.redirect(
        new URL('/integrations?error=jira_token_exchange', request.url)
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    // Get accessible resources (Jira sites)
    const resourcesResponse = await fetch(
      'https://api.atlassian.com/oauth/token/accessible-resources',
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          Accept: 'application/json',
        },
      }
    );

    if (!resourcesResponse.ok) {
      return NextResponse.redirect(
        new URL('/integrations?error=jira_no_resources', request.url)
      );
    }

    const resources = await resourcesResponse.json();
    
    if (resources.length === 0) {
      return NextResponse.redirect(
        new URL('/integrations?error=jira_no_sites', request.url)
      );
    }

    // Use first Jira site (or let user choose in production)
    const site = resources[0];
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    // Validate state contains org_id
    let organizationId = state;

    if (!organizationId) {
      const supabase = await createAdminClient();
      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .in('role', ['owner', 'admin'])
        .limit(1)
        .single();

      if (!membership) {
        return NextResponse.redirect(
          new URL('/integrations?error=jira_no_org', request.url)
        );
      }

      organizationId = membership.organization_id;
    }

    const supabase = await createAdminClient();

    // Store Jira integration
    const { error: saveError } = await supabase
      .from('jira_integrations')
      .upsert({
        organization_id: organizationId,
        cloud_id: site.id,
        site_url: site.url,
        access_token_encrypted: access_token, // TODO: Encrypt
        refresh_token_encrypted: refresh_token, // TODO: Encrypt
        token_expires_at: expiresAt.toISOString(),
        is_active: true,
      }, {
        onConflict: 'organization_id',
      });

    if (saveError) {
      console.error('Failed to save Jira integration:', saveError);
      return NextResponse.redirect(
        new URL('/integrations?error=jira_save_failed', request.url)
      );
    }

    return NextResponse.redirect(
      new URL('/integrations?success=jira_connected', request.url)
    );
  } catch (error) {
    console.error('Jira OAuth error:', error);
    return NextResponse.redirect(
      new URL('/integrations?error=jira_oauth_failed', request.url)
    );
  }
}

/**
 * Generate Jira OAuth URL
 */
export async function POST(request: Request) {
  if (!JIRA_CLIENT_ID) {
    return NextResponse.json(
      { error: 'Jira not configured' },
      { status: 500 }
    );
  }

  const { organizationId } = await request.json();

  // Verify user has access to the org
  const userSupabase = await createClient();
  const { data: { user } } = await userSupabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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

  // Build OAuth URL
  const scopes = [
    'read:jira-work',
    'write:jira-work',
    'read:jira-user',
    'offline_access',
  ].join(' ');

  const oauthUrl = new URL('https://auth.atlassian.com/authorize');
  oauthUrl.searchParams.set('audience', 'api.atlassian.com');
  oauthUrl.searchParams.set('client_id', JIRA_CLIENT_ID);
  oauthUrl.searchParams.set('scope', scopes);
  oauthUrl.searchParams.set('redirect_uri', JIRA_REDIRECT_URI);
  oauthUrl.searchParams.set('state', organizationId);
  oauthUrl.searchParams.set('response_type', 'code');
  oauthUrl.searchParams.set('prompt', 'consent');

  return NextResponse.json({ url: oauthUrl.toString() });
}

