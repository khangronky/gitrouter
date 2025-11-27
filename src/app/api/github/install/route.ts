import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { getInstallationRepositories } from '@/lib/github/client';

/**
 * GitHub App installation callback
 * This is called after a user installs the GitHub App on their org/account
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const installationId = url.searchParams.get('installation_id');
  const setupAction = url.searchParams.get('setup_action');
  const state = url.searchParams.get('state'); // Contains org_id if passed during install

  if (!installationId) {
    return NextResponse.redirect(
      new URL('/dashboard?error=missing_installation_id', request.url)
    );
  }

  // Get the current user
  const userSupabase = await createClient();
  const { data: { user } } = await userSupabase.auth.getUser();

  if (!user) {
    // Redirect to login with installation_id preserved
    return NextResponse.redirect(
      new URL(`/login?redirect=/api/github/install?installation_id=${installationId}`, request.url)
    );
  }

  const supabase = await createAdminClient();

  try {
    // Fetch repositories from this installation
    const repoData = await getInstallationRepositories(Number(installationId));
    const repositories = repoData.repositories || [];

    // Determine the account info from the first repo (if any)
    let accountLogin = 'unknown';
    let accountType: 'Organization' | 'User' = 'Organization';
    
    if (repositories.length > 0) {
      const [owner] = repositories[0].full_name.split('/');
      accountLogin = owner;
    }

    // If state contains an org_id, link to that org
    let organizationId = state;

    if (!organizationId) {
      // Check if user has any organizations
      const { data: memberships } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', user.id)
        .in('role', ['owner', 'admin']);

      if (memberships && memberships.length === 1) {
        // User has exactly one org they can manage - use it
        organizationId = memberships[0].organization_id;
      } else if (memberships && memberships.length > 1) {
        // User has multiple orgs - redirect to org selector
        return NextResponse.redirect(
          new URL(`/integrations/github/select-org?installation_id=${installationId}`, request.url)
        );
      } else {
        // User has no orgs - create one
        const { data: newOrg, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: accountLogin,
            slug: accountLogin.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          })
          .select('id')
          .single();

        if (orgError) {
          console.error('Failed to create organization:', orgError);
          return NextResponse.redirect(
            new URL('/dashboard?error=org_creation_failed', request.url)
          );
        }

        organizationId = newOrg.id;
      }
    }

    // Create or update the GitHub installation
    const { error: installError } = await supabase
      .from('github_installations')
      .upsert({
        organization_id: organizationId,
        installation_id: Number(installationId),
        account_login: accountLogin,
        account_type: accountType,
        repositories: repositories.map((r: { id: number; full_name: string; private: boolean }) => ({
          id: r.id,
          full_name: r.full_name,
          private: r.private,
        })),
      }, {
        onConflict: 'installation_id',
      });

    if (installError) {
      console.error('Failed to save installation:', installError);
      return NextResponse.redirect(
        new URL('/dashboard?error=installation_save_failed', request.url)
      );
    }

    // Redirect to success page or integrations
    const redirectUrl = setupAction === 'install' 
      ? '/integrations?success=github_installed'
      : '/integrations?success=github_updated';

    return NextResponse.redirect(new URL(redirectUrl, request.url));
  } catch (error) {
    console.error('GitHub installation error:', error);
    return NextResponse.redirect(
      new URL('/dashboard?error=github_installation_failed', request.url)
    );
  }
}

