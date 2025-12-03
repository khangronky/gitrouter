import { WebClient, type Block, type KnownBlock } from '@slack/web-api';
import type { SupabaseClient } from '@supabase/supabase-js';

// biome-ignore lint: Using any for flexibility with typed/untyped clients
type AnySupabaseClient = SupabaseClient<any>;

/**
 * Get Slack configuration from environment
 */
export function getSlackConfig() {
  const clientId = process.env.SLACK_CLIENT_ID;
  const clientSecret = process.env.SLACK_CLIENT_SECRET;
  const signingSecret = process.env.SLACK_SIGNING_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('SLACK_CLIENT_ID and SLACK_CLIENT_SECRET must be configured');
  }

  return { clientId, clientSecret, signingSecret };
}

/**
 * Create a Slack WebClient with bot token
 */
export function createSlackClient(botToken: string): WebClient {
  return new WebClient(botToken);
}

/**
 * Get Slack client for an organization
 */
export async function getOrgSlackClient(
  supabase: AnySupabaseClient,
  organizationId: string
): Promise<WebClient | null> {
  const { data: integration, error } = await supabase
    .from('slack_integrations')
    .select('access_token')
    .eq('organization_id', organizationId)
    .single();

  if (error || !integration) {
    return null;
  }

  return createSlackClient(integration.access_token);
}

/**
 * Send a direct message to a Slack user
 */
export async function sendDirectMessage(
  client: WebClient,
  userId: string,
  text: string,
  blocks?: (Block | KnownBlock)[]
): Promise<{ ok: boolean; ts?: string; channel?: string; error?: string }> {
  try {
    // Open a DM channel with the user
    const dmResult = await client.conversations.open({
      users: userId,
    });

    if (!dmResult.ok || !dmResult.channel?.id) {
      return { ok: false, error: 'Failed to open DM channel' };
    }

    // Send the message
    const result = await client.chat.postMessage({
      channel: dmResult.channel.id,
      text,
      blocks,
      unfurl_links: false,
      unfurl_media: false,
    });

    return {
      ok: result.ok ?? false,
      ts: result.ts,
      channel: dmResult.channel.id,
      error: result.error,
    };
  } catch (error) {
    console.error('Failed to send Slack DM:', error);
    return { ok: false, error: String(error) };
  }
}

/**
 * Send a message to a channel
 */
export async function sendChannelMessage(
  client: WebClient,
  channelId: string,
  text: string,
  blocks?: (Block | KnownBlock)[]
): Promise<{ ok: boolean; ts?: string; error?: string }> {
  try {
    const result = await client.chat.postMessage({
      channel: channelId,
      text,
      blocks,
      unfurl_links: false,
      unfurl_media: false,
    });

    return {
      ok: result.ok ?? false,
      ts: result.ts,
      error: result.error,
    };
  } catch (error) {
    console.error('Failed to send Slack message:', error);
    return { ok: false, error: String(error) };
  }
}

/**
 * Update an existing message
 */
export async function updateMessage(
  client: WebClient,
  channelId: string,
  ts: string,
  text: string,
  blocks?: (Block | KnownBlock)[]
): Promise<{ ok: boolean; error?: string }> {
  try {
    const result = await client.chat.update({
      channel: channelId,
      ts,
      text,
      blocks,
    });

    return {
      ok: result.ok ?? false,
      error: result.error,
    };
  } catch (error) {
    console.error('Failed to update Slack message:', error);
    return { ok: false, error: String(error) };
  }
}

/**
 * Look up a Slack user by email
 */
export async function lookupUserByEmail(
  client: WebClient,
  email: string
): Promise<string | null> {
  try {
    const result = await client.users.lookupByEmail({ email });
    return result.user?.id || null;
  } catch {
    return null;
  }
}

/**
 * List all members in the Slack workspace
 */
export async function listWorkspaceMembers(
  client: WebClient
): Promise<Array<{ id: string; name: string; real_name: string; display_name: string; email?: string }>> {
  try {
    const result = await client.users.list({
      limit: 500,
    });

    return (
      result.members
        ?.filter((m) => !m.is_bot && !m.deleted && m.id !== 'USLACKBOT')
        .map((m) => ({
          id: m.id || '',
          name: m.name || '',
          real_name: m.real_name || m.profile?.real_name || '',
          display_name: m.profile?.display_name || m.name || '',
          email: m.profile?.email,
        })) || []
    );
  } catch (error) {
    console.error('Failed to list Slack workspace members:', error);
    return [];
  }
}

/**
 * List channels the bot has access to
 */
export async function listChannels(
  client: WebClient
): Promise<Array<{ id: string; name: string; is_private: boolean }>> {
  try {
    const result = await client.conversations.list({
      types: 'public_channel,private_channel',
      exclude_archived: true,
      limit: 200,
    });

    return (
      result.channels?.map((c) => ({
        id: c.id || '',
        name: c.name || '',
        is_private: c.is_private || false,
      })) || []
    );
  } catch (error) {
    console.error('Failed to list Slack channels:', error);
    return [];
  }
}

/**
 * Verify Slack request signature
 */
export function verifySlackSignature(
  signingSecret: string,
  signature: string,
  timestamp: string,
  body: string
): boolean {
  const crypto = require('crypto');
  const baseString = `v0:${timestamp}:${body}`;
  const hmac = crypto.createHmac('sha256', signingSecret);
  hmac.update(baseString);
  const expectedSignature = `v0=${hmac.digest('hex')}`;

  // Use timing-safe comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

