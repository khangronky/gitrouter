import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { invalidateRulesCache } from '@/lib/routing/engine';

const ruleConditionsSchema = z.object({
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
});

const createRuleSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  priority: z.number().int().min(0),
  conditions: ruleConditionsSchema,
  reviewerIds: z.array(z.string().uuid()),
  isActive: z.boolean().default(true),
});

/**
 * GET /api/rules?organizationId=xxx
 * List all routing rules for an organization
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const organizationId = url.searchParams.get('organizationId');

  if (!organizationId) {
    return NextResponse.json({ error: 'organizationId required' }, { status: 400 });
  }

  // Verify user has access
  const userSupabase = await createClient();
  const { data: { user } } = await userSupabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createAdminClient();

  // Check org membership
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Fetch rules with reviewer details
  const { data: rules, error } = await supabase
    .from('routing_rules')
    .select(`
      id,
      name,
      description,
      priority,
      conditions,
      reviewer_ids,
      is_active,
      created_at,
      updated_at
    `)
    .eq('organization_id', organizationId)
    .order('priority', { ascending: true });

  if (error) {
    console.error('Failed to fetch rules:', error);
    return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 });
  }

  return NextResponse.json({ rules });
}

/**
 * POST /api/rules
 * Create a new routing rule
 */
export async function POST(request: Request) {
  const body = await request.json();
  const validation = createRuleSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validation.error.format() },
      { status: 400 }
    );
  }

  const { organizationId, name, description, priority, conditions, reviewerIds, isActive } = validation.data;

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

  // Create the rule
  const { data: rule, error } = await supabase
    .from('routing_rules')
    .insert({
      organization_id: organizationId,
      name,
      description,
      priority,
      conditions,
      reviewer_ids: reviewerIds,
      is_active: isActive,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to create rule:', error);
    return NextResponse.json({ error: 'Failed to create rule' }, { status: 500 });
  }

  // Invalidate cache
  invalidateRulesCache(organizationId);

  return NextResponse.json({ rule }, { status: 201 });
}

