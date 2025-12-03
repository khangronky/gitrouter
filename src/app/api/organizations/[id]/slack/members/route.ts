import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireOrgPermission } from '@/lib/organizations/permissions';
import { getOrgSlackClient, listWorkspaceMembers } from '@/lib/slack/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/organizations/[id]/slack/members
 * List all members in the connected Slack workspace
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const permission = await requireOrgPermission(
      supabase,
      id,
      'integrations:view'
    );
    if (!permission.success) {
      return NextResponse.json(
        { error: permission.error },
        { status: permission.status }
      );
    }

    const client = await getOrgSlackClient(supabase, id);
    if (!client) {
      return NextResponse.json(
        { error: 'Slack is not connected for this organization' },
        { status: 400 }
      );
    }

    const members = await listWorkspaceMembers(client);

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Error in GET /api/organizations/[id]/slack/members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
