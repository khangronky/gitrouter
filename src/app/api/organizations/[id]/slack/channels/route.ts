import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireOrgPermission } from '@/lib/organizations/permissions';
import { getOrgSlackClient, listChannels } from '@/lib/slack';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/organizations/[id]/slack/channels
 * List Slack channels the bot has access to
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
        { error: 'Slack integration not found' },
        { status: 404 }
      );
    }

    const channels = await listChannels(client);

    return NextResponse.json({ channels });
  } catch (error) {
    console.error(
      'Error in GET /api/organizations/[id]/slack/channels:',
      error
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
