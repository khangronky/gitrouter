import { NextResponse } from 'next/server';
import { requireOrgPermission } from '@/lib/organizations/permissions';
import { addRepositorySchema } from '@/lib/schema/repository';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/organizations/[id]/repositories
 * List all repositories for an organization
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const permission = await requireOrgPermission(supabase, id, 'repos:view');
    if (!permission.success) {
      return NextResponse.json(
        { error: permission.error },
        { status: permission.status }
      );
    }

    const { data: repositories, error } = await supabase
      .from('repositories')
      .select(
        `
        id,
        organization_id,
        github_installation_id,
        github_repo_id,
        full_name,
        default_branch,
        default_reviewer_id,
        is_active,
        created_at,
        updated_at,
        default_reviewer:reviewers (
          id,
          user:users (
            full_name,
            github_username
          )
        )
      `
      )
      .eq('organization_id', id)
      .is('deleted_at', null)
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Error fetching repositories:', error);
      return NextResponse.json(
        { error: 'Failed to fetch repositories' },
        { status: 500 }
      );
    }

    // Get open PR count for each repository
    const reposWithStats = await Promise.all(
      repositories.map(async (repo) => {
        const { count: openPrCount } = await supabase
          .from('pull_requests')
          .select('*', { count: 'exact', head: true })
          .eq('repository_id', repo.id)
          .eq('status', 'open');

        const { count: totalPrCount } = await supabase
          .from('pull_requests')
          .select('*', { count: 'exact', head: true })
          .eq('repository_id', repo.id);

        return {
          ...repo,
          open_pr_count: openPrCount || 0,
          total_pr_count: totalPrCount || 0,
        };
      })
    );

    return NextResponse.json({ repositories: reposWithStats });
  } catch (error) {
    console.error('Error in GET /api/organizations/[id]/repositories:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/organizations/[id]/repositories
 * Add a repository to the organization
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const permission = await requireOrgPermission(supabase, id, 'repos:add');
    if (!permission.success) {
      return NextResponse.json(
        { error: permission.error },
        { status: permission.status }
      );
    }

    const body = await request.json();
    const validation = addRepositorySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const {
      github_repo_id,
      full_name,
      default_branch,
      default_reviewer_id,
      is_active,
    } = validation.data;

    // Check if org has a GitHub installation
    const { data: installation, error: installError } = await supabase
      .from('github_installations')
      .select('id')
      .eq('organization_id', id)
      .is('deleted_at', null)
      .single();

    if (installError || !installation) {
      return NextResponse.json(
        {
          error:
            'No GitHub App installation found. Please install the GitHub App first.',
        },
        { status: 400 }
      );
    }

    // Check if repository is already added (to any org) - check for soft-deleted too for restore
    const { data: existingRepo } = await supabase
      .from('repositories')
      .select('id, organization_id, deleted_at')
      .eq('github_repo_id', github_repo_id)
      .single();

    if (existingRepo) {
      // If soft-deleted and belongs to this org, restore it
      if (existingRepo.deleted_at && existingRepo.organization_id === id) {
        const { data: restoredRepo, error: restoreError } = await supabase
          .from('repositories')
          .update({
            deleted_at: null,
            full_name,
            default_branch: default_branch || 'main',
            default_reviewer_id: default_reviewer_id || null,
            is_active: is_active ?? true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingRepo.id)
          .select(
            `
            id,
            organization_id,
            github_installation_id,
            github_repo_id,
            full_name,
            default_branch,
            default_reviewer_id,
            is_active,
            created_at,
            updated_at
          `
          )
          .single();

        if (restoreError) {
          console.error('Error restoring repository:', restoreError);
          return NextResponse.json(
            { error: 'Failed to restore repository' },
            { status: 500 }
          );
        }

        return NextResponse.json({ repository: restoredRepo }, { status: 201 });
      }

      // Active record exists
      if (!existingRepo.deleted_at) {
        if (existingRepo.organization_id === id) {
          return NextResponse.json(
            { error: 'Repository is already added to this organization' },
            { status: 409 }
          );
        }
        return NextResponse.json(
          { error: 'Repository is already registered with another organization' },
          { status: 409 }
        );
      }
    }

    // Add repository
    const { data: repository, error: repoError } = await supabase
      .from('repositories')
      .insert({
        organization_id: id,
        github_installation_id: installation.id,
        github_repo_id,
        full_name,
        default_branch: default_branch || 'main',
        default_reviewer_id: default_reviewer_id || null,
        is_active: is_active ?? true,
      })
      .select(
        `
        id,
        organization_id,
        github_installation_id,
        github_repo_id,
        full_name,
        default_branch,
        default_reviewer_id,
        is_active,
        created_at,
        updated_at
      `
      )
      .single();

    if (repoError) {
      console.error('Error adding repository:', repoError);
      return NextResponse.json(
        { error: 'Failed to add repository' },
        { status: 500 }
      );
    }

    return NextResponse.json({ repository }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/organizations/[id]/repositories:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
