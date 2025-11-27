import { WebClient, type ChatPostMessageResponse } from '@slack/web-api';

// Cache for WebClient instances
const clientCache = new Map<string, WebClient>();

/**
 * Gets or creates a Slack WebClient for the given token
 */
function getClient(token: string): WebClient {
  let client = clientCache.get(token);
  if (!client) {
    client = new WebClient(token);
    clientCache.set(token, client);
  }
  return client;
}

/**
 * Sends a direct message to a Slack user
 */
export async function sendSlackDM(
  botToken: string,
  userId: string,
  text: string,
  blocks?: object[]
): Promise<ChatPostMessageResponse> {
  const client = getClient(botToken);

  // Open a DM channel with the user
  const conversation = await client.conversations.open({
    users: userId,
  });

  if (!conversation.ok || !conversation.channel?.id) {
    throw new Error(`Failed to open DM channel with user ${userId}`);
  }

  // Send the message
  const result = await client.chat.postMessage({
    channel: conversation.channel.id,
    text,
    blocks: blocks as any,
    unfurl_links: false,
    unfurl_media: false,
  });

  if (!result.ok) {
    throw new Error(`Failed to send message: ${result.error}`);
  }

  return result;
}

/**
 * Sends a message to a Slack channel
 */
export async function sendSlackChannelMessage(
  botToken: string,
  channelId: string,
  text: string,
  blocks?: object[]
): Promise<ChatPostMessageResponse> {
  const client = getClient(botToken);

  const result = await client.chat.postMessage({
    channel: channelId,
    text,
    blocks: blocks as any,
    unfurl_links: false,
    unfurl_media: false,
  });

  if (!result.ok) {
    throw new Error(`Failed to send channel message: ${result.error}`);
  }

  return result;
}

/**
 * Updates an existing Slack message
 */
export async function updateSlackMessage(
  botToken: string,
  channelId: string,
  timestamp: string,
  text: string,
  blocks?: object[]
): Promise<void> {
  const client = getClient(botToken);

  const result = await client.chat.update({
    channel: channelId,
    ts: timestamp,
    text,
    blocks: blocks as any,
  });

  if (!result.ok) {
    throw new Error(`Failed to update message: ${result.error}`);
  }
}

/**
 * Gets user info from Slack
 */
export async function getSlackUser(
  botToken: string,
  userId: string
): Promise<{
  id: string;
  name: string;
  real_name: string;
  email?: string;
}> {
  const client = getClient(botToken);

  const result = await client.users.info({
    user: userId,
  });

  if (!result.ok || !result.user) {
    throw new Error(`Failed to get user info: ${result.error}`);
  }

  return {
    id: result.user.id!,
    name: result.user.name!,
    real_name: result.user.real_name || result.user.name!,
    email: result.user.profile?.email,
  };
}

/**
 * Looks up a Slack user by email
 */
export async function lookupSlackUserByEmail(
  botToken: string,
  email: string
): Promise<string | null> {
  const client = getClient(botToken);

  try {
    const result = await client.users.lookupByEmail({
      email,
    });

    if (result.ok && result.user?.id) {
      return result.user.id;
    }
  } catch {
    // User not found
  }

  return null;
}

/**
 * Tests if the bot token is valid
 */
export async function testSlackAuth(
  botToken: string
): Promise<{ ok: boolean; team?: string; user?: string }> {
  const client = getClient(botToken);

  try {
    const result = await client.auth.test();
    return {
      ok: result.ok || false,
      team: result.team,
      user: result.user,
    };
  } catch {
    return { ok: false };
  }
}

/**
 * Lists all channels the bot has access to
 */
export async function listSlackChannels(
  botToken: string
): Promise<Array<{ id: string; name: string; is_private: boolean }>> {
  const client = getClient(botToken);

  const channels: Array<{ id: string; name: string; is_private: boolean }> = [];
  let cursor: string | undefined;

  do {
    const result = await client.conversations.list({
      types: 'public_channel,private_channel',
      exclude_archived: true,
      limit: 200,
      cursor,
    });

    if (result.channels) {
      for (const channel of result.channels) {
        if (channel.id && channel.name) {
          channels.push({
            id: channel.id,
            name: channel.name,
            is_private: channel.is_private || false,
          });
        }
      }
    }

    cursor = result.response_metadata?.next_cursor;
  } while (cursor);

  return channels;
}

