import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID;
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET;
const SLACK_REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/slack/oauth`
  : 'https://localhost:3000/api/slack/oauth';

/**
 * Slack OAuth callback handler
 * Handles the OAuth flow after user authorizes the Slack app
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state'); // Contains org_id
  const error = url.searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      new URL(`/setting?error=slack_${error}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/setting?error=slack_no_code', request.url)
    );
  }

  if (!SLACK_CLIENT_ID || !SLACK_CLIENT_SECRET) {
    console.error('Slack OAuth credentials not configured');
    return NextResponse.redirect(
      new URL('/setting?error=slack_not_configured', request.url)
    );
  }

  // Verify user is authenticated
  const userSupabase = await createClient();
  const { data: { user } } = await userSupabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(
      new URL(`/login?redirect=/api/slack/oauth?code=${code}&state=${state}`, request.url)
    );
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: SLACK_CLIENT_ID,
        client_secret: SLACK_CLIENT_SECRET,
        code,
        redirect_uri: SLACK_REDIRECT_URI,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.ok) {
      console.error('Slack OAuth error:', tokenData.error);
      return NextResponse.redirect(
        new URL(`/setting?error=slack_oauth_${tokenData.error}`, request.url)
      );
    }

    const {
      access_token: botToken,
      team: { id: teamId, name: teamName },
      bot_user_id: botUserId,
    } = tokenData;

    // Validate state contains org_id
    let organizationId = state;

    if (!organizationId) {
      // Try to get user's organization
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
          new URL('/setting?error=slack_no_org', request.url)
        );
      }

      organizationId = membership.organization_id;
    }

    const supabase = await createAdminClient();

    // Store Slack integration (upsert)
    const { error: saveError } = await supabase
      .from('slack_integrations')
      .upsert({
        organization_id: organizationId,
        team_id: teamId,
        team_name: teamName,
        bot_token_encrypted: botToken, // TODO: Implement encryption
        bot_user_id: botUserId,
        is_active: true,
      }, {
        onConflict: 'organization_id',
      });

    if (saveError) {
      console.error('Failed to save Slack integration:', saveError);
      return NextResponse.redirect(
        new URL('/setting?error=slack_save_failed', request.url)
      );
    }

    return NextResponse.redirect(
      new URL('/setting?success=slack_connected', request.url)
    );
  } catch (error) {
    console.error('Slack OAuth error:', error);
    return NextResponse.redirect(
      new URL('/setting?error=slack_oauth_failed', request.url)
    );
  }
}

/**
 * Generate Slack OAuth URL
 * POST to get the OAuth URL to redirect user to
 */
export async function POST(request: Request) {
  if (!SLACK_CLIENT_ID) {
    return NextResponse.json(
      { error: 'Slack not configured' },
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
    'chat:write',
    'im:write',
    'users:read',
    'users:read.email',
    'channels:read',
    'groups:read',
  ].join(',');

  const oauthUrl = new URL('https://slack.com/oauth/v2/authorize');
  oauthUrl.searchParams.set('client_id', SLACK_CLIENT_ID);
  oauthUrl.searchParams.set('scope', scopes);
  oauthUrl.searchParams.set('redirect_uri', SLACK_REDIRECT_URI);
  oauthUrl.searchParams.set('state', organizationId);

  return NextResponse.json({ url: oauthUrl.toString() });
}

