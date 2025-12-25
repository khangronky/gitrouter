import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getAuthenticatedUser,
  requireOrgPermission,
} from '@/lib/organizations/permissions';
import { getSlackConfig } from '@/lib/slack/client';

/**
 * GET /api/slack/oauth
 * Initiate Slack OAuth flow
 * Query: ?org_id=xxx
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const auth = await getAuthenticatedUser(supabase);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('org_id');
    const onboarding = searchParams.get('onboarding') === 'true';

    if (!orgId) {
      return NextResponse.json(
        { error: 'org_id is required' },
        { status: 400 }
      );
    }

    // Verify user has permission
    const permission = await requireOrgPermission(
      supabase,
      orgId,
      'integrations:manage'
    );
    if (!permission.success) {
      return NextResponse.json(
        { error: permission.error },
        { status: permission.status }
      );
    }

    const { clientId } = getSlackConfig();

    // Required scopes for the bot
    const scopes = [
      'chat:write',
      'chat:write.public',
      'im:write',
      'users:read',
      'users:read.email',
      'channels:read',
      'groups:read',
    ].join(',');

    // Encode state with org_id and onboarding flag
    const stateData: { org_id: string; onboarding?: boolean } = {
      org_id: orgId,
    };
    if (onboarding) {
      stateData.onboarding = true;
    }
    const state = Buffer.from(JSON.stringify(stateData)).toString('base64');

    // Get redirect URI
    const redirectUri = `${getBaseUrl(request)}/api/slack/oauth/callback`;

    // Build Slack OAuth URL
    const oauthUrl = new URL('https://slack.com/oauth/v2/authorize');
    oauthUrl.searchParams.set('client_id', clientId);
    oauthUrl.searchParams.set('scope', scopes);
    oauthUrl.searchParams.set('redirect_uri', redirectUri);
    oauthUrl.searchParams.set('state', state);

    return NextResponse.json({ url: oauthUrl.toString() });
  } catch (error) {
    console.error('Error in GET /api/slack/oauth:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getBaseUrl(request: Request): string {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}
