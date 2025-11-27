import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { invalidateRulesCache } from '@/lib/routing/engine';

const reorderSchema = z.object({
  organizationId: z.string().uuid(),
  ruleIds: z.array(z.string().uuid()),
});

/**
 * POST /api/rules/reorder
 * Reorder rules by updating their priorities
 */
export async function POST(request: Request) {
  const body = await request.json();
  const validation = reorderSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validation.error.format() },
      { status: 400 }
    );
  }

  const { organizationId, ruleIds } = validation.data;

  // Verify user has admin access
  const userSupabase = await createClient();
  const { data: { user } } = await userSupabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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

  // Update priorities based on array order
  const updates = ruleIds.map((id, index) => ({
    id,
    priority: index,
    organization_id: organizationId,
  }));

  // Use upsert to update all at once
  for (let i = 0; i < updates.length; i++) {
    const { error } = await supabase
      .from('routing_rules')
      .update({ priority: updates[i].priority })
      .eq('id', updates[i].id)
      .eq('organization_id', organizationId);

    if (error) {
      console.error('Failed to update rule priority:', error);
      return NextResponse.json({ error: 'Failed to reorder rules' }, { status: 500 });
    }
  }

  // Invalidate cache
  invalidateRulesCache(organizationId);

  return NextResponse.json({ success: true });
}

