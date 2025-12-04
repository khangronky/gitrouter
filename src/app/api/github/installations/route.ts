import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/organizations/permissions';
import { createAppOctokit } from '@/lib/github/client';

/**
 * GET /api/github/installations
 * List all installations of this GitHub App
 * Useful for finding the correct installation ID
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const auth = await getAuthenticatedUser(supabase);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create app-level octokit (not installation-level)
    const octokit = createAppOctokit();

    // List all installations of this GitHub App
    const { data: installations } = await octokit.rest.apps.listInstallations({
      per_page: 100,
    });

    // Map to simpler format
    const installationList = installations.map((installation) => ({
      id: installation.id,
      account_login: installation.account?.login || 'unknown',
      account_type: installation.account?.type || 'Unknown',
      repository_selection: installation.repository_selection,
      created_at: installation.created_at,
      html_url: `https://github.com/settings/installations/${installation.id}`,
    }));

    return NextResponse.json({
      installations: installationList,
      total: installationList.length,
    });
  } catch (error) {
    console.error('Error listing GitHub installations:', error);
    return NextResponse.json(
      {
        error:
          'Failed to list installations. Check your GITHUB_APP_ID and GITHUB_PRIVATE_KEY configuration.',
      },
      { status: 500 }
    );
  }
}
