import { z } from 'zod';

// =============================================
// Slack Integration Schemas
// =============================================

/**
 * Slack Integration Type
 */
export interface SlackIntegrationType {
  id: string;
  organization_id: string;
  team_id: string;
  team_name: string;
  bot_user_id: string | null;
  incoming_webhook_url: string | null;
  default_channel_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Slack OAuth Callback Query
 */
export const slackOAuthCallbackQuerySchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().min(1, 'State is required'), // org_id encoded
  error: z.string().optional(),
  error_description: z.string().optional(),
});

export type SlackOAuthCallbackQuery = z.infer<
  typeof slackOAuthCallbackQuerySchema
>;

/**
 * Update Slack Integration Schema
 */
export const updateSlackIntegrationSchema = z.object({
  default_channel_id: z.string().nullable().optional(),
});

export type UpdateSlackIntegrationSchema = z.infer<
  typeof updateSlackIntegrationSchema
>;

// =============================================
// Slack OAuth Response Types (from Slack API)
// =============================================

export interface SlackOAuthAccessResponse {
  ok: boolean;
  access_token: string;
  token_type: 'bot';
  scope: string;
  bot_user_id: string;
  app_id: string;
  team: {
    id: string;
    name: string;
  };
  enterprise?: {
    id: string;
    name: string;
  } | null;
  authed_user: {
    id: string;
    scope: string;
    access_token: string;
    token_type: string;
  };
  incoming_webhook?: {
    channel: string;
    channel_id: string;
    configuration_url: string;
    url: string;
  };
  error?: string;
}

// =============================================
// Slack Message Types
// =============================================

/**
 * Slack Block Kit - Text Object
 */
export interface SlackTextObject {
  type: 'plain_text' | 'mrkdwn';
  text: string;
  emoji?: boolean;
}

/**
 * Slack Block Kit - Button Element
 */
export interface SlackButtonElement {
  type: 'button';
  text: SlackTextObject;
  action_id: string;
  url?: string;
  value?: string;
  style?: 'primary' | 'danger';
}

/**
 * Slack Block Kit - Section Block
 */
export interface SlackSectionBlock {
  type: 'section';
  text?: SlackTextObject;
  fields?: SlackTextObject[];
  accessory?: SlackButtonElement;
}

/**
 * Slack Block Kit - Actions Block
 */
export interface SlackActionsBlock {
  type: 'actions';
  elements: SlackButtonElement[];
}

/**
 * Slack Block Kit - Divider Block
 */
export interface SlackDividerBlock {
  type: 'divider';
}

/**
 * Slack Block Kit - Context Block
 */
export interface SlackContextBlock {
  type: 'context';
  elements: SlackTextObject[];
}

/**
 * Slack Block Kit - Header Block
 */
export interface SlackHeaderBlock {
  type: 'header';
  text: SlackTextObject;
}

/**
 * Union of Slack blocks
 */
export type SlackBlock =
  | SlackSectionBlock
  | SlackActionsBlock
  | SlackDividerBlock
  | SlackContextBlock
  | SlackHeaderBlock;

/**
 * Slack Message Payload
 */
export interface SlackMessagePayload {
  channel: string;
  text: string; // Fallback text
  blocks?: SlackBlock[];
  thread_ts?: string;
  unfurl_links?: boolean;
  unfurl_media?: boolean;
}

/**
 * Slack Post Message Response
 */
export interface SlackPostMessageResponse {
  ok: boolean;
  channel: string;
  ts: string;
  message?: {
    text: string;
    ts: string;
  };
  error?: string;
}

// =============================================
// Slack Interaction Payload
// =============================================

export interface SlackInteractionPayload {
  type: 'block_actions' | 'message_action' | 'view_submission';
  user: {
    id: string;
    username: string;
    name: string;
    team_id: string;
  };
  team: {
    id: string;
    domain: string;
  };
  channel?: {
    id: string;
    name: string;
  };
  message?: {
    ts: string;
    text: string;
  };
  actions?: Array<{
    action_id: string;
    block_id: string;
    value: string;
    type: string;
  }>;
  response_url: string;
  trigger_id: string;
}

// =============================================
// Response Types
// =============================================

export interface SlackIntegrationResponseType {
  integration: SlackIntegrationType;
}

export interface SlackChannelType {
  id: string;
  name: string;
  is_private: boolean;
}

export interface SlackChannelListResponseType {
  channels: SlackChannelType[];
}

export interface MessageResponseType {
  message: string;
}
