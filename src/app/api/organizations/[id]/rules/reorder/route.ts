import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { reorderRulesSchema } from '@/lib/schema/routing-rule';
import { requireOrgPermission } from '@/lib/organizations/permissions';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/organizations/[id]/rules/reorder
 * Reorder routing rules by updating their priorities
 * Body: { rule_ids: ['id1', 'id2', 'id3'] } - in desired order
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const permission = await requireOrgPermission(supabase, id, 'rules:update');
    if (!permission.success) {
      return NextResponse.json(
        { error: permission.error },
        { status: permission.status }
      );
    }

    const body = await request.json();
    const validation = reorderRulesSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { rule_ids } = validation.data;

    // Verify all rules belong to this org
    const { data: existingRules, error: fetchError } = await supabase
      .from('routing_rules')
      .select('id')
      .in('id', rule_ids)
      .eq('organization_id', id);

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to verify rules' },
        { status: 500 }
      );
    }

    if (existingRules?.length !== rule_ids.length) {
      return NextResponse.json(
        { error: 'One or more rules not found in this organization' },
        { status: 400 }
      );
    }

    // Update priorities based on array order
    const updates = rule_ids.map((ruleId, index) =>
      supabase
        .from('routing_rules')
        .update({ priority: index, updated_at: new Date().toISOString() })
        .eq('id', ruleId)
    );

    await Promise.all(updates);

    // Fetch updated rules
    const { data: rules, error: refetchError } = await supabase
      .from('routing_rules')
      .select('id, name, priority')
      .in('id', rule_ids)
      .order('priority', { ascending: true });

    if (refetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch updated rules' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Rules reordered successfully',
      rules,
    });
  } catch (error) {
    console.error('Error in POST /api/organizations/[id]/rules/reorder:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

