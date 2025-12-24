import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getAuthenticatedUser,
  requireOrgPermission,
} from '@/lib/organizations/permissions';

/**
 * Get Jira OAuth configuration from environment
 */
function getJiraConfig() {
  const clientId = process.env.JIRA_CLIENT_ID;
  const clientSecret = process.env.JIRA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Jira OAuth credentials not configured');
  }

  return { clientId, clientSecret };
}

/**
 * GET /api/jira/oauth
 * Initiate Jira OAuth flow
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

    const { clientId } = getJiraConfig();

    // Required scopes for Jira API access
    // - read:jira-work: Read project and issue data
    // - write:jira-work: Create/update issues, transitions, comments
    // - delete:jira-work: Delete issues
    // - read:jira-user: Read user information
    // - offline_access: Get refresh token for long-lived access
    const scopes = [
      'read:jira-work',
      'write:jira-work',
      'delete:jira-work',
      'read:jira-user',
      'offline_access',
    ].join(' ');

    // Encode state with org_id and onboarding flag
    const stateData: { org_id: string; onboarding?: boolean } = {
      org_id: orgId,
    };
    if (onboarding) {
      stateData.onboarding = true;
    }
    const state = Buffer.from(JSON.stringify(stateData)).toString('base64');

    // Get redirect URI
    const redirectUri = `${getBaseUrl(request)}/api/jira/oauth/callback`;

    // Build Atlassian OAuth URL
    const oauthUrl = new URL('https://auth.atlassian.com/authorize');
    oauthUrl.searchParams.set('audience', 'api.atlassian.com');
    oauthUrl.searchParams.set('client_id', clientId);
    oauthUrl.searchParams.set('scope', scopes);
    oauthUrl.searchParams.set('redirect_uri', redirectUri);
    oauthUrl.searchParams.set('state', state);
    oauthUrl.searchParams.set('response_type', 'code');
    oauthUrl.searchParams.set('prompt', 'consent');

    return NextResponse.json({ url: oauthUrl.toString() });
  } catch (error) {
    console.error('Error in GET /api/jira/oauth:', error);
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

export { getJiraConfig };
