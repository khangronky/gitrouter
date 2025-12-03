import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateRepositorySchema } from '@/lib/schema/repository';
import { requireOrgPermission } from '@/lib/organizations/permissions';

interface RouteParams {
  params: Promise<{ id: string; repoId: string }>;
}

/**
 * GET /api/organizations/[id]/repositories/[repoId]
 * Get repository details
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id, repoId } = await params;
    const supabase = await createClient();

    const permission = await requireOrgPermission(supabase, id, 'repos:view');
    if (!permission.success) {
      return NextResponse.json(
        { error: permission.error },
        { status: permission.status }
      );
    }

    const { data: repository, error } = await supabase
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
          name,
          github_username
        )
      `
      )
      .eq('id', repoId)
      .eq('organization_id', id)
      .single();

    if (error || !repository) {
      return NextResponse.json(
        { error: 'Repository not found' },
        { status: 404 }
      );
    }

    // Get PR stats
    const { count: openPrCount } = await supabase
      .from('pull_requests')
      .select('*', { count: 'exact', head: true })
      .eq('repository_id', repoId)
      .eq('status', 'open');

    const { count: totalPrCount } = await supabase
      .from('pull_requests')
      .select('*', { count: 'exact', head: true })
      .eq('repository_id', repoId);

    return NextResponse.json({
      repository: {
        ...repository,
        open_pr_count: openPrCount || 0,
        total_pr_count: totalPrCount || 0,
      },
    });
  } catch (error) {
    console.error(
      'Error in GET /api/organizations/[id]/repositories/[repoId]:',
      error
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/organizations/[id]/repositories/[repoId]
 * Update repository settings
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id, repoId } = await params;
    const supabase = await createClient();

    const permission = await requireOrgPermission(supabase, id, 'repos:update');
    if (!permission.success) {
      return NextResponse.json(
        { error: permission.error },
        { status: permission.status }
      );
    }

    // Verify repository belongs to this org
    const { data: existingRepo, error: fetchError } = await supabase
      .from('repositories')
      .select('id')
      .eq('id', repoId)
      .eq('organization_id', id)
      .single();

    if (fetchError || !existingRepo) {
      return NextResponse.json(
        { error: 'Repository not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validation = updateRepositorySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const updateData = {
      ...validation.data,
      updated_at: new Date().toISOString(),
    };

    const { data: repository, error } = await supabase
      .from('repositories')
      .update(updateData)
      .eq('id', repoId)
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

    if (error) {
      console.error('Error updating repository:', error);
      return NextResponse.json(
        { error: 'Failed to update repository' },
        { status: 500 }
      );
    }

    return NextResponse.json({ repository });
  } catch (error) {
    console.error(
      'Error in PATCH /api/organizations/[id]/repositories/[repoId]:',
      error
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/organizations/[id]/repositories/[repoId]
 * Remove repository from organization
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id, repoId } = await params;
    const supabase = await createClient();

    const permission = await requireOrgPermission(supabase, id, 'repos:remove');
    if (!permission.success) {
      return NextResponse.json(
        { error: permission.error },
        { status: permission.status }
      );
    }

    // Verify repository belongs to this org
    const { data: existingRepo, error: fetchError } = await supabase
      .from('repositories')
      .select('id, full_name')
      .eq('id', repoId)
      .eq('organization_id', id)
      .single();

    if (fetchError || !existingRepo) {
      return NextResponse.json(
        { error: 'Repository not found' },
        { status: 404 }
      );
    }

    // Delete repository (cascades to PRs, rules, etc.)
    const { error } = await supabase
      .from('repositories')
      .delete()
      .eq('id', repoId);

    if (error) {
      console.error('Error deleting repository:', error);
      return NextResponse.json(
        { error: 'Failed to delete repository' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `Repository ${existingRepo.full_name} removed successfully`,
    });
  } catch (error) {
    console.error(
      'Error in DELETE /api/organizations/[id]/repositories/[repoId]:',
      error
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
