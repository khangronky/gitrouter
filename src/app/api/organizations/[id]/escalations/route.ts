import { NextResponse } from 'next/server';
import { getEscalationSummary } from '@/lib/escalation';
import { requireOrgPermission } from '@/lib/organizations/permissions';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/organizations/[id]/escalations
 * Get escalation summary for an organization
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const permission = await requireOrgPermission(supabase, id, 'org:view');
    if (!permission.success) {
      return NextResponse.json(
        { error: permission.error },
        { status: permission.status }
      );
    }

    const summary = await getEscalationSummary(supabase, id);

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error in GET /api/organizations/[id]/escalations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
