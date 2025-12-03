import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireOrgPermission } from '@/lib/organizations/permissions';
import { listInstallationRepositories } from '@/lib/github/client';

/**
 * GET /api/github/available-repos
 * List repositories available from GitHub installation
 * Query: ?org_id=xxx
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('org_id');

    if (!orgId) {
      return NextResponse.json(
        { error: 'org_id is required' },
        { status: 400 }
      );
    }

    const permission = await requireOrgPermission(
      supabase,
      orgId,
      'repos:view'
    );
    if (!permission.success) {
      return NextResponse.json(
        { error: permission.error },
        { status: permission.status }
      );
    }

    // Get GitHub installation for this org
    const { data: installation, error: installError } = await supabase
      .from('github_installations')
      .select('installation_id')
      .eq('organization_id', orgId)
      .single();

    if (installError || !installation) {
      return NextResponse.json(
        { error: 'No GitHub App installation found for this organization' },
        { status: 404 }
      );
    }

    // Get already added repositories
    const { data: addedRepos } = await supabase
      .from('repositories')
      .select('github_repo_id')
      .eq('organization_id', orgId);

    const addedRepoIds = new Set(
      addedRepos?.map((r) => r.github_repo_id) || []
    );

    // Fetch repositories from GitHub
    const githubRepos = await listInstallationRepositories(
      installation.installation_id
    );

    // Map to our format and mark already added repos
    const repositories = githubRepos.map((repo) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      private: repo.private,
      default_branch: repo.default_branch,
      html_url: repo.html_url,
      description: repo.description,
      already_added: addedRepoIds.has(repo.id),
    }));

    return NextResponse.json({
      repositories,
      installation_id: installation.installation_id,
    });
  } catch (error) {
    console.error('Error in GET /api/github/available-repos:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
