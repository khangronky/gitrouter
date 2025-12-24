import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/organizations/permissions';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { getJiraConfig } from '../route';

interface AtlassianTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface AtlassianResource {
  id: string;
  url: string;
  name: string;
  scopes: string[];
  avatarUrl?: string;
}

interface JiraCurrentUser {
  accountId: string;
  emailAddress: string;
  displayName: string;
  active: boolean;
}

/**
 * GET /api/jira/oauth/callback
 * Handle Jira OAuth callback
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const auth = await getAuthenticatedUser(supabase);
    if (!auth) {
      const returnUrl = encodeURIComponent(request.url);
      return NextResponse.redirect(
        new URL(`/login?returnUrl=${returnUrl}`, request.url)
      );
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const stateBase64 = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      console.error('Jira OAuth error:', error, errorDescription);
      return NextResponse.redirect(
        new URL(`/settings?error=jira_${error}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/settings?error=jira_missing_code', request.url)
      );
    }

    // Decode state
    let orgId: string | null = null;
    let fromOnboarding = false;
    if (stateBase64) {
      try {
        const state = JSON.parse(Buffer.from(stateBase64, 'base64').toString());
        orgId = state.org_id;
        fromOnboarding = state.onboarding === true;
      } catch {
        console.error('Failed to decode state');
      }
    }

    if (!orgId) {
      return NextResponse.redirect(
        new URL('/settings?error=jira_invalid_state', request.url)
      );
    }

    // Verify user has permission
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', auth.userId)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.redirect(
        new URL('/settings?error=jira_unauthorized', request.url)
      );
    }

    // Exchange code for token
    const { clientId, clientSecret } = getJiraConfig();
    const redirectUri = `${getBaseUrl(request)}/api/jira/oauth/callback`;

    const tokenResponse = await fetch(
      'https://auth.atlassian.com/oauth/token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri,
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Jira token exchange error:', errorText);
      return NextResponse.redirect(
        new URL('/settings?error=jira_token_exchange_failed', request.url)
      );
    }

    const tokenData: AtlassianTokenResponse = await tokenResponse.json();

    // Get accessible resources (Jira sites)
    const resourcesResponse = await fetch(
      'https://api.atlassian.com/oauth/token/accessible-resources',
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: 'application/json',
        },
      }
    );

    if (!resourcesResponse.ok) {
      console.error('Failed to get accessible resources');
      return NextResponse.redirect(
        new URL('/settings?error=jira_no_resources', request.url)
      );
    }

    const resources: AtlassianResource[] = await resourcesResponse.json();

    if (resources.length === 0) {
      return NextResponse.redirect(
        new URL('/settings?error=jira_no_sites', request.url)
      );
    }

    // Use the first available Jira site
    // TODO: If user has multiple sites, we might want to let them choose
    const site = resources[0];

    // Calculate token expiration
    const tokenExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    // Use admin client to save token
    const adminSupabase = await createAdminClient();

    // Check if integration already exists
    const { data: existing } = await adminSupabase
      .from('jira_integrations')
      .select('id')
      .eq('organization_id', orgId)
      .single();

    const integrationData = {
      organization_id: orgId,
      cloud_id: site.id,
      site_url: site.url,
      site_name: site.name,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || null,
      token_expires_at: tokenExpiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      // Update existing integration
      await adminSupabase
        .from('jira_integrations')
        .update(integrationData)
        .eq('organization_id', orgId);
    } else {
      // Create new integration
      await adminSupabase.from('jira_integrations').insert(integrationData);
    }

    // Auto-capture Jira info for the installing user
    try {
      // Fetch the authenticated user's Jira account info using /myself endpoint
      const myselfResponse = await fetch(
        `https://api.atlassian.com/ex/jira/${site.id}/rest/api/3/myself`,
        {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            Accept: 'application/json',
          },
        }
      );

      if (myselfResponse.ok) {
        const jiraUser: JiraCurrentUser = await myselfResponse.json();

        // Update the user's Jira info
        await adminSupabase
          .from('users')
          .update({
            jira_account_id: jiraUser.accountId,
            jira_email: jiraUser.emailAddress,
          })
          .eq('id', auth.userId);

        console.log(
          `Linked Jira account ${jiraUser.displayName} (${jiraUser.accountId}) to user ${auth.userId}`
        );
      }
    } catch (error) {
      console.error('Failed to capture Jira user info:', error);
      // Don't fail the OAuth flow - just log the error
    }

    // Redirect based on whether user came from onboarding
    if (fromOnboarding) {
      return NextResponse.redirect(
        new URL(`/dashboard?onboarding_step=first-rule&success=jira_connected`, request.url)
      );
    }

    return NextResponse.redirect(
      new URL(`/settings?success=jira_connected&org=${orgId}`, request.url)
    );
  } catch (error) {
    console.error('Error in Jira OAuth callback:', error);
    return NextResponse.redirect(
      new URL('/settings?error=jira_internal', request.url)
    );
  }
}

function getBaseUrl(request: Request): string {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}
