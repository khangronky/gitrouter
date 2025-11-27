import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { invalidateRulesCache } from '@/lib/routing/engine';

const updateRuleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  priority: z.number().int().min(0).optional(),
  conditions: z.object({
    file_patterns: z.array(z.string()).optional(),
    authors: z.array(z.string()).optional(),
    exclude_authors: z.array(z.string()).optional(),
    repositories: z.array(z.string()).optional(),
    time_windows: z.array(z.object({
      start: z.string(),
      end: z.string(),
      timezone: z.string(),
      days: z.array(z.number()),
    })).optional(),
    min_files_changed: z.number().optional(),
    max_files_changed: z.number().optional(),
    title_patterns: z.array(z.string()).optional(),
  }).optional(),
  reviewerIds: z.array(z.string().uuid()).optional(),
  isActive: z.boolean().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/rules/[id]
 * Get a single routing rule
 */
export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;

  const userSupabase = await createClient();
  const { data: { user } } = await userSupabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createAdminClient();

  const { data: rule, error } = await supabase
    .from('routing_rules')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !rule) {
    return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
  }

  // Verify user has access to the org
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', rule.organization_id)
    .eq('user_id', user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ rule });
}

/**
 * PATCH /api/rules/[id]
 * Update a routing rule
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json();
  const validation = updateRuleSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validation.error.format() },
      { status: 400 }
    );
  }

  const userSupabase = await createClient();
  const { data: { user } } = await userSupabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createAdminClient();

  // Get the rule first
  const { data: existingRule } = await supabase
    .from('routing_rules')
    .select('organization_id')
    .eq('id', id)
    .single();

  if (!existingRule) {
    return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
  }

  // Verify admin access
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', existingRule.organization_id)
    .eq('user_id', user.id)
    .single();

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Build update object
  const updates: Record<string, unknown> = {};
  if (validation.data.name !== undefined) updates.name = validation.data.name;
  if (validation.data.description !== undefined) updates.description = validation.data.description;
  if (validation.data.priority !== undefined) updates.priority = validation.data.priority;
  if (validation.data.conditions !== undefined) updates.conditions = validation.data.conditions;
  if (validation.data.reviewerIds !== undefined) updates.reviewer_ids = validation.data.reviewerIds;
  if (validation.data.isActive !== undefined) updates.is_active = validation.data.isActive;

  const { error } = await supabase
    .from('routing_rules')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Failed to update rule:', error);
    return NextResponse.json({ error: 'Failed to update rule' }, { status: 500 });
  }

  // Invalidate cache
  invalidateRulesCache(existingRule.organization_id);

  return NextResponse.json({ success: true });
}

/**
 * DELETE /api/rules/[id]
 * Delete a routing rule
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  const { id } = await params;

  const userSupabase = await createClient();
  const { data: { user } } = await userSupabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createAdminClient();

  // Get the rule first
  const { data: existingRule } = await supabase
    .from('routing_rules')
    .select('organization_id')
    .eq('id', id)
    .single();

  if (!existingRule) {
    return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
  }

  // Verify admin access
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', existingRule.organization_id)
    .eq('user_id', user.id)
    .single();

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error } = await supabase
    .from('routing_rules')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Failed to delete rule:', error);
    return NextResponse.json({ error: 'Failed to delete rule' }, { status: 500 });
  }

  // Invalidate cache
  invalidateRulesCache(existingRule.organization_id);

  return NextResponse.json({ success: true });
}

