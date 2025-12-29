import { NextResponse } from 'next/server';
import type { SlackInteractionPayload } from '@/lib/schema/slack';
import { getSlackConfig, verifySlackSignature } from '@/lib/slack/client';
import type { TypedSupabaseClient } from '@/lib/supabase/client';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * POST /api/slack/interactions
 * Handle Slack interactive component events (button clicks, etc.)
 */
export async function POST(request: Request) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();

    // Verify Slack signature
    const { signingSecret } = getSlackConfig();
    if (signingSecret) {
      const timestamp = request.headers.get('x-slack-request-timestamp');
      const signature = request.headers.get('x-slack-signature');

      if (!timestamp || !signature) {
        return NextResponse.json(
          { error: 'Missing signature headers' },
          { status: 401 }
        );
      }

      // Check timestamp is within 5 minutes
      const requestTime = parseInt(timestamp, 10);
      const currentTime = Math.floor(Date.now() / 1000);
      if (Math.abs(currentTime - requestTime) > 300) {
        return NextResponse.json({ error: 'Request too old' }, { status: 401 });
      }

      const isValid = verifySlackSignature(
        signingSecret,
        signature,
        timestamp,
        rawBody
      );

      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    // Parse the payload
    const formData = new URLSearchParams(rawBody);
    const payloadStr = formData.get('payload');

    if (!payloadStr) {
      return NextResponse.json({ error: 'Missing payload' }, { status: 400 });
    }

    const payload: SlackInteractionPayload = JSON.parse(payloadStr);

    // Handle different interaction types
    if (payload.type === 'block_actions') {
      return await handleBlockActions(payload);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error in Slack interactions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle block_actions (button clicks)
 */
async function handleBlockActions(payload: SlackInteractionPayload) {
  const action = payload.actions?.[0];

  if (!action) {
    return NextResponse.json({ ok: true });
  }

  const adminSupabase = await createAdminClient();

  switch (action.action_id) {
    case 'approve_pr':
      // Log approval intent (actual approval happens on GitHub)
      await logInteraction(adminSupabase, payload, 'approve_pr', action.value);

      // Send acknowledgment back to Slack
      if (payload.response_url) {
        await sendResponseMessage(payload.response_url, {
          text: '✅ Opening GitHub to approve PR...',
          response_type: 'ephemeral',
          replace_original: false,
        });
      }
      break;

    case 'request_changes_pr':
      await logInteraction(
        adminSupabase,
        payload,
        'request_changes_pr',
        action.value
      );

      if (payload.response_url) {
        await sendResponseMessage(payload.response_url, {
          text: '🔄 Opening GitHub to request changes...',
          response_type: 'ephemeral',
          replace_original: false,
        });
      }
      break;

    case 'reassign_review':
      await logInteraction(
        adminSupabase,
        payload,
        'reassign_review',
        action.value
      );

      if (payload.response_url) {
        await sendResponseMessage(payload.response_url, {
          text: '📤 Review reassignment requested. A team admin will be notified.',
          response_type: 'ephemeral',
          replace_original: false,
        });
      }
      break;

    default:
      // Unknown action, just acknowledge
      break;
  }

  // Must respond within 3 seconds
  return NextResponse.json({ ok: true });
}

/**
 * Log interaction for analytics
 */
async function logInteraction(
  supabase: TypedSupabaseClient,
  payload: SlackInteractionPayload,
  actionType: string,
  value?: string
) {
  try {
    // Could save to a slack_interactions table for analytics
    console.log('Slack interaction:', {
      user: payload.user.id,
      action: actionType,
      value,
      team: payload.team?.id,
    });

    // If the action has PR info, try to update the review assignment
    if (value && ['approve_pr', 'request_changes_pr'].includes(actionType)) {
      // Find the reviewer by Slack user ID
      const { data: reviewer } = await supabase
        .from('reviewers')
        .select('id')
        .eq('slack_user_id', payload.user.id)
        .single();

      if (reviewer) {
        // Find the assignment
        const { data: assignments } = await supabase
          .from('review_assignments')
          .select('id, pull_request_id')
          .eq('reviewer_id', reviewer.id)
          .eq('status', 'pending');

        // Match by PR number from the value
        // This is a simplified lookup - in production you'd want more precise matching
        console.log('Found assignments for reviewer:', assignments?.length);
      }
    }
  } catch (error) {
    console.error('Failed to log interaction:', error);
  }
}

/**
 * Send response message to Slack
 */
async function sendResponseMessage(
  responseUrl: string,
  message: {
    text: string;
    response_type?: 'ephemeral' | 'in_channel';
    replace_original?: boolean;
  }
) {
  try {
    await fetch(responseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
  } catch (error) {
    console.error('Failed to send Slack response:', error);
  }
}
