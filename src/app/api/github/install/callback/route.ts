import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/organizations/permissions';
import { createInstallationOctokit } from '@/lib/github/client';

/**
 * GET /api/github/install/callback
 * Handle GitHub App installation callback
 * Query: ?installation_id=xxx&setup_action=install&state=xxx
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const auth = await getAuthenticatedUser(supabase);
    if (!auth) {
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent(request.url);
      return NextResponse.redirect(
        new URL(`/login?returnUrl=${returnUrl}`, request.url)
      );
    }

    const { searchParams } = new URL(request.url);
    const installationIdStr = searchParams.get('installation_id');
    const setupAction = searchParams.get('setup_action');
    const stateBase64 = searchParams.get('state');

    if (!installationIdStr) {
      return NextResponse.redirect(
        new URL('/dashboard?error=missing_installation_id', request.url)
      );
    }

    const installationId = parseInt(installationIdStr, 10);
    if (isNaN(installationId)) {
      return NextResponse.redirect(
        new URL('/dashboard?error=invalid_installation_id', request.url)
      );
    }

    // Decode state to get org_id
    let orgId: string | null = null;
    if (stateBase64) {
      try {
        const state = JSON.parse(Buffer.from(stateBase64, 'base64').toString());
        orgId = state.org_id;
      } catch {
        console.error('Failed to decode state');
      }
    }

    if (!orgId) {
      return NextResponse.redirect(
        new URL('/dashboard?error=missing_org_id', request.url)
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
        new URL('/dashboard?error=unauthorized', request.url)
      );
    }

    // Get installation details from GitHub
    let accountLogin = 'unknown';
    let accountType = 'User';

    try {
      const octokit = createInstallationOctokit(installationId);
      const { data: installation } =
        await octokit.rest.apps.getInstallation({
          installation_id: installationId,
        });

      accountLogin = installation.account?.login || 'unknown';
      accountType = installation.account?.type || 'User';
    } catch (error) {
      console.error('Failed to get installation details:', error);
    }

    // Use admin client to bypass RLS for insert
    const adminSupabase = await createAdminClient();

    // Check if installation already exists
    const { data: existingInstallation } = await adminSupabase
      .from('github_installations')
      .select('id, organization_id')
      .eq('installation_id', installationId)
      .single();

    if (existingInstallation) {
      if (existingInstallation.organization_id !== orgId) {
        return NextResponse.redirect(
          new URL('/dashboard?error=installation_exists_other_org', request.url)
        );
      }
      // Already linked to this org
      return NextResponse.redirect(
        new URL(`/dashboard?success=installation_exists`, request.url)
      );
    }

    // Check if org already has an installation
    const { data: orgInstallation } = await adminSupabase
      .from('github_installations')
      .select('id')
      .eq('organization_id', orgId)
      .single();

    if (orgInstallation) {
      // Org already has a different installation - update it
      await adminSupabase
        .from('github_installations')
        .update({
          installation_id: installationId,
          account_login: accountLogin,
          account_type: accountType,
          updated_at: new Date().toISOString(),
        })
        .eq('organization_id', orgId);
    } else {
      // Create new installation record
      const { error: insertError } = await adminSupabase
        .from('github_installations')
        .insert({
          organization_id: orgId,
          installation_id: installationId,
          account_login: accountLogin,
          account_type: accountType,
        });

      if (insertError) {
        console.error('Failed to save installation:', insertError);
        return NextResponse.redirect(
          new URL('/dashboard?error=save_failed', request.url)
        );
      }
    }

    // Redirect to repository selection page
    return NextResponse.redirect(
      new URL(
        `/dashboard?success=github_installed&org=${orgId}`,
        request.url
      )
    );
  } catch (error) {
    console.error('Error in GitHub install callback:', error);
    return NextResponse.redirect(
      new URL('/dashboard?error=internal_error', request.url)
    );
  }
}

