import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getAuthenticatedUser, requireOrgPermission } from '@/lib/organizations/permissions';
import { createInstallationOctokit } from '@/lib/github/client';

/**
 * POST /api/github/install/link
 * Manually link an existing GitHub App installation to an organization
 * Body: { org_id: string, installation_id: number }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const auth = await getAuthenticatedUser(supabase);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { org_id: orgId, installation_id: installationId } = body;

    if (!orgId || !installationId) {
      return NextResponse.json(
        { error: 'org_id and installation_id are required' },
        { status: 400 }
      );
    }

    // Verify user has permission
    const permission = await requireOrgPermission(supabase, orgId, 'integrations:manage');
    if (!permission.success) {
      return NextResponse.json(
        { error: permission.error },
        { status: permission.status }
      );
    }

    // Verify the installation exists and get details from GitHub
    let accountLogin = 'unknown';
    let accountType = 'User';

    try {
      const octokit = createInstallationOctokit(installationId);
      const { data: installation } = await octokit.rest.apps.getInstallation({
        installation_id: installationId,
      });

      accountLogin = installation.account?.login || 'unknown';
      accountType = installation.account?.type || 'User';
    } catch (error: unknown) {
      console.error('Failed to verify installation:', error);
      
      // Provide more specific error message
      let errorMessage = 'Invalid installation ID or GitHub App does not have access to this installation';
      
      if (error instanceof Error) {
        if (error.message.includes('Bad credentials')) {
          errorMessage = 'GitHub App credentials are invalid. Check GITHUB_APP_ID and GITHUB_PRIVATE_KEY in your environment variables.';
        } else if (error.message.includes('Not Found')) {
          errorMessage = 'Installation not found. Make sure the installation ID is correct and belongs to your GitHub App.';
        } else if (error.message.includes('private key')) {
          errorMessage = 'GitHub private key is malformed. Make sure newlines are properly formatted (use \\n or actual newlines).';
        } else {
          errorMessage = `GitHub API error: ${error.message}`;
        }
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    // Use admin client to bypass RLS
    const adminSupabase = await createAdminClient();

    // Check if installation is already linked to another org
    const { data: existingInstallation } = await adminSupabase
      .from('github_installations')
      .select('id, organization_id')
      .eq('installation_id', installationId)
      .single();

    if (existingInstallation) {
      if (existingInstallation.organization_id !== orgId) {
        return NextResponse.json(
          { error: 'This installation is already linked to another organization' },
          { status: 409 }
        );
      }
      // Already linked to this org
      return NextResponse.json({
        message: 'Installation already linked to this organization',
        installation: existingInstallation,
      });
    }

    // Check if org already has an installation
    const { data: orgInstallation } = await adminSupabase
      .from('github_installations')
      .select('id')
      .eq('organization_id', orgId)
      .single();

    if (orgInstallation) {
      // Update existing record
      const { error: updateError } = await adminSupabase
        .from('github_installations')
        .update({
          installation_id: installationId,
          account_login: accountLogin,
          account_type: accountType,
          updated_at: new Date().toISOString(),
        })
        .eq('organization_id', orgId);

      if (updateError) {
        console.error('Failed to update installation:', updateError);
        return NextResponse.json(
          { error: 'Failed to update installation' },
          { status: 500 }
        );
      }
    } else {
      // Create new record
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
        return NextResponse.json(
          { error: 'Failed to save installation' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      message: 'GitHub installation linked successfully',
      account_login: accountLogin,
      account_type: accountType,
    });
  } catch (error) {
    console.error('Error in POST /api/github/install/link:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

