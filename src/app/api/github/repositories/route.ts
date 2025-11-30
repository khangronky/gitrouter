import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

interface RepoData {
  id: string;
  name: string;
  full_name: string;
  private?: boolean;
}

/**
 * Add a repository to the team's tracked repos
 * POST /api/github/repositories
 * Body: { organizationId, repositoryUrl }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { organizationId, repositoryUrl } = body;

    if (!organizationId || !repositoryUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: organizationId, repositoryUrl' },
        { status: 400 }
      );
    }

    // Verify user is authenticated
    const userSupabase = await createClient();
    const { data: { user } } = await userSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has admin/owner access to the organization
    const supabase = await createAdminClient();
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Forbidden - Only admins and owners can add repositories' }, { status: 403 });
    }

    // Parse the repository URL to get owner/repo
    // Supports formats: 
    // - https://github.com/owner/repo
    // - github.com/owner/repo
    // - owner/repo
    let fullName = repositoryUrl.trim();
    
    // Remove trailing slashes and .git
    fullName = fullName.replace(/\/$/, '').replace(/\.git$/, '');
    
    // Extract owner/repo from URL
    const githubUrlMatch = fullName.match(/(?:github\.com[\/:])?([^\/]+\/[^\/]+)$/);
    if (githubUrlMatch) {
      fullName = githubUrlMatch[1];
    }

    // Validate format
    if (!fullName.match(/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/)) {
      return NextResponse.json(
        { error: 'Invalid repository format. Use owner/repo or GitHub URL.' },
        { status: 400 }
      );
    }

    const [owner, repoName] = fullName.split('/');

    // Get current github_installations for this organization
    const { data: installation, error: fetchError } = await supabase
      .from('github_installations')
      .select('id, repositories')
      .eq('organization_id', organizationId)
      .single();

    // Generate a unique ID for the repo
    const repoId = `manual-${Date.now()}`;
    const newRepo: RepoData = {
      id: repoId,
      name: repoName,
      full_name: fullName,
      private: false, // Assume public by default for manually added repos
    };

    if (!installation) {
      // Create a new github_installations entry for manual repos
      // Use a placeholder installation_id for manually added repos
      const placeholderInstallationId = Math.floor(Date.now() / 1000) * -1; // Negative to distinguish from real installations
      
      const { error: insertError } = await supabase
        .from('github_installations')
        .insert({
          organization_id: organizationId,
          installation_id: placeholderInstallationId,
          account_login: owner,
          account_type: 'Manual',
          repositories: [newRepo],
        });

      if (insertError) {
        console.error('Failed to create github_installations:', insertError);
        return NextResponse.json(
          { error: 'Failed to add repository' },
          { status: 500 }
        );
      }
    } else {
      // Add to existing repositories
      const currentRepos = (installation.repositories as RepoData[]) || [];
      
      // Check if repo already exists
      if (currentRepos.some((r) => r.full_name.toLowerCase() === fullName.toLowerCase())) {
        return NextResponse.json(
          { error: 'Repository already exists in your team' },
          { status: 400 }
        );
      }

      const updatedRepos = [...currentRepos, newRepo];

      const { error: updateError } = await supabase
        .from('github_installations')
        .update({ repositories: updatedRepos })
        .eq('id', installation.id);

      if (updateError) {
        console.error('Failed to update repositories:', updateError);
        return NextResponse.json(
          { error: 'Failed to add repository' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      repository: newRepo,
      message: 'Repository added successfully',
    });
  } catch (error) {
    console.error('Add repository error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Remove a repository from the team's tracked repos
 * DELETE /api/github/repositories
 * Body: { organizationId, repositoryId }
 */
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { organizationId, repositoryId } = body;

    if (!organizationId || !repositoryId) {
      return NextResponse.json(
        { error: 'Missing required fields: organizationId, repositoryId' },
        { status: 400 }
      );
    }

    // Verify user is authenticated
    const userSupabase = await createClient();
    const { data: { user } } = await userSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has admin/owner access
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

    // Get current installation
    const { data: installation } = await supabase
      .from('github_installations')
      .select('id, repositories')
      .eq('organization_id', organizationId)
      .single();

    if (!installation) {
      return NextResponse.json(
        { error: 'No repositories found' },
        { status: 404 }
      );
    }

    const currentRepos = (installation.repositories as RepoData[]) || [];
    const updatedRepos = currentRepos.filter(
      (r) => r.id?.toString() !== repositoryId && r.full_name !== repositoryId
    );

    if (currentRepos.length === updatedRepos.length) {
      return NextResponse.json(
        { error: 'Repository not found' },
        { status: 404 }
      );
    }

    const { error: updateError } = await supabase
      .from('github_installations')
      .update({ repositories: updatedRepos })
      .eq('id', installation.id);

    if (updateError) {
      console.error('Failed to remove repository:', updateError);
      return NextResponse.json(
        { error: 'Failed to remove repository' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Repository removed successfully',
    });
  } catch (error) {
    console.error('Remove repository error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get all repositories for the organization
 * GET /api/github/repositories?organizationId=xxx
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Missing organizationId parameter' },
        { status: 400 }
      );
    }

    // Verify user is authenticated
    const userSupabase = await createClient();
    const { data: { user } } = await userSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has access to the organization
    const supabase = await createAdminClient();
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get repositories
    const { data: installation } = await supabase
      .from('github_installations')
      .select('repositories')
      .eq('organization_id', organizationId)
      .single();

    const repositories = (installation?.repositories as RepoData[]) || [];

    return NextResponse.json({
      repositories: repositories.map((r) => ({
        id: r.id?.toString() || r.full_name,
        name: r.name || r.full_name.split('/')[1],
        full_name: r.full_name,
      })),
    });
  } catch (error) {
    console.error('Get repositories error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

