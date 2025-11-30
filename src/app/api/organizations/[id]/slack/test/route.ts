import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireOrgPermission } from '@/lib/organizations/permissions';
import { getOrgSlackClient, sendChannelMessage } from '@/lib/slack';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/organizations/[id]/slack/test
 * Send a test message to verify Slack connection
 */
export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const permission = await requireOrgPermission(
      supabase,
      id,
      'integrations:manage'
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

    // Get the default channel
    const { data: integration } = await supabase
      .from('slack_integrations')
      .select('default_channel_id, team_name')
      .eq('organization_id', id)
      .single();

    if (!integration?.default_channel_id) {
      return NextResponse.json(
        {
          error:
            'No default channel configured. Please set a default channel first.',
        },
        { status: 400 }
      );
    }

    const result = await sendChannelMessage(
      client,
      integration.default_channel_id,
      '✅ GitRouter Slack integration is working! You will receive PR notifications in this channel.',
      [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '✅ *GitRouter Slack Integration Test*\n\nYour Slack integration is configured correctly! PR review notifications will be sent to reviewers via direct message, and escalation alerts will be posted to this channel.',
          },
        },
      ]
    );

    if (!result.ok) {
      return NextResponse.json(
        { error: `Failed to send test message: ${result.error}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `Test message sent successfully to ${integration.team_name}!`,
    });
  } catch (error) {
    console.error('Error in POST /api/organizations/[id]/slack/test:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
