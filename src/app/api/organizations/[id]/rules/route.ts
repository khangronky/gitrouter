import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createRoutingRuleSchema } from '@/lib/schema/routing-rule';
import { requireOrgPermission } from '@/lib/organizations/permissions';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/organizations/[id]/rules
 * List all routing rules for an organization
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const permission = await requireOrgPermission(supabase, id, 'rules:view');
    if (!permission.success) {
      return NextResponse.json(
        { error: permission.error },
        { status: permission.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const repositoryId = searchParams.get('repository_id');

    let query = supabase
      .from('routing_rules')
      .select(
        `
        id,
        organization_id,
        repository_id,
        name,
        description,
        priority,
        is_active,
        conditions,
        reviewer_ids,
        created_at,
        updated_at,
        repository:repositories (
          id,
          full_name
        )
      `
      )
      .eq('organization_id', id)
      .order('priority', { ascending: true });

    // Filter by repository if specified
    if (repositoryId) {
      query = query.or(
        `repository_id.is.null,repository_id.eq.${repositoryId}`
      );
    }

    const { data: rules, error } = await query;

    if (error) {
      console.error('Error fetching rules:', error);
      return NextResponse.json(
        { error: 'Failed to fetch routing rules' },
        { status: 500 }
      );
    }

    // Fetch reviewer details for each rule
    const allReviewerIds = [...new Set(rules.flatMap((r) => r.reviewer_ids))];

    const { data: reviewers } = await supabase
      .from('reviewers')
      .select('id, name, github_username')
      .in('id', allReviewerIds);

    const reviewerMap = new Map(reviewers?.map((r) => [r.id, r]) || []);

    // Attach reviewer details to rules
    const rulesWithReviewers = rules.map((rule) => ({
      ...rule,
      reviewers: rule.reviewer_ids
        .map((id: string) => reviewerMap.get(id))
        .filter(Boolean),
    }));

    return NextResponse.json({ rules: rulesWithReviewers });
  } catch (error) {
    console.error('Error in GET /api/organizations/[id]/rules:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/organizations/[id]/rules
 * Create a new routing rule
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const permission = await requireOrgPermission(supabase, id, 'rules:create');
    if (!permission.success) {
      return NextResponse.json(
        { error: permission.error },
        { status: permission.status }
      );
    }

    const body = await request.json();
    const validation = createRoutingRuleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const {
      name,
      description,
      repository_id,
      priority,
      is_active,
      conditions,
      reviewer_ids,
    } = validation.data;

    // Verify repository belongs to this org (if specified)
    if (repository_id) {
      const { data: repo, error: repoError } = await supabase
        .from('repositories')
        .select('id')
        .eq('id', repository_id)
        .eq('organization_id', id)
        .single();

      if (repoError || !repo) {
        return NextResponse.json(
          { error: 'Repository not found in this organization' },
          { status: 400 }
        );
      }
    }

    // Verify all reviewers belong to this org
    if (reviewer_ids.length > 0) {
      const { data: reviewers, error: reviewerError } = await supabase
        .from('reviewers')
        .select('id')
        .in('id', reviewer_ids)
        .eq('organization_id', id);

      if (reviewerError || reviewers?.length !== reviewer_ids.length) {
        return NextResponse.json(
          { error: 'One or more reviewers not found in this organization' },
          { status: 400 }
        );
      }
    }

    const { data: rule, error: createError } = await supabase
      .from('routing_rules')
      .insert({
        organization_id: id,
        name,
        description: description || null,
        repository_id: repository_id || null,
        priority: priority ?? 0,
        is_active: is_active ?? true,
        conditions,
        reviewer_ids,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating rule:', createError);
      return NextResponse.json(
        { error: 'Failed to create routing rule' },
        { status: 500 }
      );
    }

    return NextResponse.json({ rule }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/organizations/[id]/rules:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
