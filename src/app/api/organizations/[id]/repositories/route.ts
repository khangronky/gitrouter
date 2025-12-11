import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { addRepositorySchema } from '@/lib/schema/repository';
import { requireOrgPermission } from '@/lib/organizations/permissions';

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

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b04a0253-89f8-4165-81d0-a7e42233853c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'repositories/route.ts:14',message:'GET /repositories starting',data:{orgId:id},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    const permission = await requireOrgPermission(supabase, id, 'repos:view');
    if (!permission.success) {
      return NextResponse.json(
        { error: permission.error },
        { status: permission.status }
      );
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b04a0253-89f8-4165-81d0-a7e42233853c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'repositories/route.ts:27',message:'About to query repositories with default_reviewer:reviewers',data:{selectColumns:'id,name'},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

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
      .order('full_name', { ascending: true });

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b04a0253-89f8-4165-81d0-a7e42233853c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'repositories/route.ts:50',message:'Query completed',data:{hasError:!!error,errorCode:error?.code,errorMessage:error?.message,dataCount:repositories?.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

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

    // Check if repository is already added (to any org)
    const { data: existingRepo } = await supabase
      .from('repositories')
      .select('id, organization_id')
      .eq('github_repo_id', github_repo_id)
      .single();

    if (existingRepo) {
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
