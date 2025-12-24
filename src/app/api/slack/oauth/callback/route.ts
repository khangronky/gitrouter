import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/organizations/permissions';
import { createSlackClient, getSlackConfig } from '@/lib/slack/client';
import { createAdminClient, createClient } from '@/lib/supabase/server';

/**
 * GET /api/slack/oauth/callback
 * Handle Slack OAuth callback
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

    if (error) {
      return NextResponse.redirect(
        new URL(`/settings?error=slack_${error}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/settings?error=slack_missing_code', request.url)
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
        new URL('/settings?error=slack_invalid_state', request.url)
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
        new URL('/settings?error=slack_unauthorized', request.url)
      );
    }

    // Exchange code for token
    const { clientId, clientSecret } = getSlackConfig();
    const redirectUri = `${getBaseUrl(request)}/api/slack/oauth/callback`;

    const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.ok) {
      console.error('Slack OAuth error:', tokenData);
      return NextResponse.redirect(
        new URL(`/settings?error=slack_token_${tokenData.error}`, request.url)
      );
    }

    // Use admin client to save token
    const adminSupabase = await createAdminClient();

    // Check if integration already exists
    const { data: existing } = await adminSupabase
      .from('slack_integrations')
      .select('id')
      .eq('organization_id', orgId)
      .single();

    const integrationData = {
      organization_id: orgId,
      team_id: tokenData.team.id,
      team_name: tokenData.team.name,
      access_token: tokenData.access_token,
      bot_user_id: tokenData.bot_user_id,
      incoming_webhook_url: tokenData.incoming_webhook?.url || null,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      // Update existing integration
      await adminSupabase
        .from('slack_integrations')
        .update(integrationData)
        .eq('organization_id', orgId);
    } else {
      // Create new integration
      await adminSupabase.from('slack_integrations').insert(integrationData);
    }

    // Auto-capture Slack info for the installing user
    const authedUserId = tokenData.authed_user?.id;
    if (authedUserId) {
      try {
        const slackClient = createSlackClient(tokenData.access_token);
        const userInfo = await slackClient.users.info({ user: authedUserId });

        if (userInfo.ok && userInfo.user) {
          const slackUsername =
            userInfo.user.profile?.display_name ||
            userInfo.user.profile?.real_name ||
            userInfo.user.name ||
            '';
          const slackEmail = userInfo.user.profile?.email;

          // Update the user's Slack info
          await adminSupabase
            .from('users')
            .update({
              slack_user_id: authedUserId,
              slack_username: slackUsername,
            })
            .eq('id', auth.userId);

          console.log(
            `Linked Slack account ${slackUsername} (${authedUserId}) to user ${auth.userId}`
          );

          // Also create/update a reviewer entry for this user
          const { data: existingReviewer } = await adminSupabase
            .from('reviewers')
            .select('id')
            .eq('organization_id', orgId)
            .eq('user_id', auth.userId)
            .single();

          if (!existingReviewer) {
            // Create new reviewer linked to user (Slack info is on users table)
            await adminSupabase.from('reviewers').insert({
              organization_id: orgId,
              user_id: auth.userId,
            });
            console.log(
              `Created reviewer for user ${auth.userId} with Slack ID ${authedUserId}`
            );
          } else {
            console.log(
              `Reviewer ${existingReviewer.id} already exists for user with Slack ID ${authedUserId}`
            );
          }
        }
      } catch (error) {
        console.error('Failed to get Slack user info:', error);
        // Don't fail the OAuth flow - just log the error
      }
    }

    // Redirect based on whether user came from onboarding
    if (fromOnboarding) {
      return NextResponse.redirect(
        new URL(`/dashboard?onboarding_step=jira&success=slack_connected`, request.url)
      );
    }

    return NextResponse.redirect(
      new URL(`/settings?success=slack_connected&org=${orgId}`, request.url)
    );
  } catch (error) {
    console.error('Error in Slack OAuth callback:', error);
    return NextResponse.redirect(
      new URL('/settings?error=slack_internal', request.url)
    );
  }
}

function getBaseUrl(request: Request): string {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}
