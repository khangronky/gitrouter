import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateRoutingRuleSchema } from '@/lib/schema/routing-rule';
import { requireOrgPermission } from '@/lib/organizations/permissions';

interface RouteParams {
  params: Promise<{ id: string; ruleId: string }>;
}

/**
 * GET /api/organizations/[id]/rules/[ruleId]
 * Get a specific routing rule
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id, ruleId } = await params;
    const supabase = await createClient();

    const permission = await requireOrgPermission(supabase, id, 'rules:view');
    if (!permission.success) {
      return NextResponse.json(
        { error: permission.error },
        { status: permission.status }
      );
    }

    const { data: rule, error } = await supabase
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
      .eq('id', ruleId)
      .eq('organization_id', id)
      .single();

    if (error || !rule) {
      return NextResponse.json(
        { error: 'Routing rule not found' },
        { status: 404 }
      );
    }

    // Fetch reviewer details
    const { data: reviewers } = await supabase
      .from('reviewers')
      .select('id, name, github_username')
      .in('id', rule.reviewer_ids);

    return NextResponse.json({
      rule: {
        ...rule,
        reviewers: reviewers || [],
      },
    });
  } catch (error) {
    console.error('Error in GET /api/organizations/[id]/rules/[ruleId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/organizations/[id]/rules/[ruleId]
 * Update a routing rule
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id, ruleId } = await params;
    const supabase = await createClient();

    const permission = await requireOrgPermission(supabase, id, 'rules:update');
    if (!permission.success) {
      return NextResponse.json(
        { error: permission.error },
        { status: permission.status }
      );
    }

    // Verify rule exists and belongs to this org
    const { data: existingRule, error: fetchError } = await supabase
      .from('routing_rules')
      .select('id')
      .eq('id', ruleId)
      .eq('organization_id', id)
      .single();

    if (fetchError || !existingRule) {
      return NextResponse.json(
        { error: 'Routing rule not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validation = updateRoutingRuleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { repository_id, reviewer_ids, ...rest } = validation.data;

    // Verify repository belongs to this org (if specified)
    if (repository_id !== undefined && repository_id !== null) {
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
    if (reviewer_ids && reviewer_ids.length > 0) {
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

    const updateData: Record<string, unknown> = {
      ...rest,
      updated_at: new Date().toISOString(),
    };

    if (repository_id !== undefined) {
      updateData.repository_id = repository_id;
    }
    if (reviewer_ids !== undefined) {
      updateData.reviewer_ids = reviewer_ids;
    }

    const { data: rule, error: updateError } = await supabase
      .from('routing_rules')
      .update(updateData)
      .eq('id', ruleId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating rule:', updateError);
      return NextResponse.json(
        { error: 'Failed to update routing rule' },
        { status: 500 }
      );
    }

    return NextResponse.json({ rule });
  } catch (error) {
    console.error('Error in PATCH /api/organizations/[id]/rules/[ruleId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/organizations/[id]/rules/[ruleId]
 * Delete a routing rule
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id, ruleId } = await params;
    const supabase = await createClient();

    const permission = await requireOrgPermission(supabase, id, 'rules:delete');
    if (!permission.success) {
      return NextResponse.json(
        { error: permission.error },
        { status: permission.status }
      );
    }

    // Verify rule exists and belongs to this org
    const { data: existingRule, error: fetchError } = await supabase
      .from('routing_rules')
      .select('id, name')
      .eq('id', ruleId)
      .eq('organization_id', id)
      .single();

    if (fetchError || !existingRule) {
      return NextResponse.json(
        { error: 'Routing rule not found' },
        { status: 404 }
      );
    }

    const { error: deleteError } = await supabase
      .from('routing_rules')
      .delete()
      .eq('id', ruleId);

    if (deleteError) {
      console.error('Error deleting rule:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete routing rule' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `Routing rule "${existingRule.name}" deleted successfully`,
    });
  } catch (error) {
    console.error('Error in DELETE /api/organizations/[id]/rules/[ruleId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

