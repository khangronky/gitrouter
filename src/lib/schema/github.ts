import { z } from 'zod';

// =============================================
// GitHub Installation Schemas
// =============================================

/**
 * GitHub Installation Type
 */
export interface GitHubInstallationType {
  id: string;
  organization_id: string;
  installation_id: number;
  account_login: string;
  account_type: 'User' | 'Organization';
  created_at: string;
  updated_at: string;
}

/**
 * Installation Callback Query
 */
export const installationCallbackQuerySchema = z.object({
  installation_id: z.coerce.number().int().positive(),
  setup_action: z.enum(['install', 'update']).optional(),
  state: z.string().optional(), // org_id encoded in state
});

export type InstallationCallbackQuery = z.infer<
  typeof installationCallbackQuerySchema
>;

// =============================================
// GitHub Webhook Payload Types
// =============================================

/**
 * GitHub User (minimal)
 */
export interface GitHubUserType {
  id: number;
  login: string;
  type: 'User' | 'Organization' | 'Bot';
  avatar_url?: string;
}

/**
 * GitHub Repository (minimal)
 */
export interface GitHubRepositoryType {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  owner: GitHubUserType;
  default_branch: string;
  html_url: string;
}

/**
 * GitHub Pull Request
 */
export interface GitHubPullRequestType {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  merged: boolean;
  draft: boolean;
  user: GitHubUserType;
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
    sha: string;
  };
  html_url: string;
  additions: number;
  deletions: number;
  changed_files: number;
  created_at: string;
  updated_at: string;
  merged_at: string | null;
  closed_at: string | null;
  labels: Array<{
    id: number;
    name: string;
    color: string;
  }>;
}

/**
 * Pull Request Webhook Payload
 */
export interface PullRequestWebhookPayload {
  action:
    | 'opened'
    | 'edited'
    | 'closed'
    | 'reopened'
    | 'synchronize'
    | 'assigned'
    | 'unassigned'
    | 'labeled'
    | 'unlabeled'
    | 'ready_for_review'
    | 'converted_to_draft'
    | 'review_requested'
    | 'review_request_removed';
  number: number;
  pull_request: GitHubPullRequestType;
  repository: GitHubRepositoryType;
  sender: GitHubUserType;
  installation?: {
    id: number;
  };
}

/**
 * Pull Request Review Webhook Payload
 */
export interface PullRequestReviewWebhookPayload {
  action: 'submitted' | 'edited' | 'dismissed';
  review: {
    id: number;
    user: GitHubUserType;
    body: string | null;
    state: 'approved' | 'changes_requested' | 'commented' | 'dismissed';
    submitted_at: string;
  };
  pull_request: GitHubPullRequestType;
  repository: GitHubRepositoryType;
  sender: GitHubUserType;
  installation?: {
    id: number;
  };
}

/**
 * Installation Webhook Payload
 */
export interface InstallationWebhookPayload {
  action: 'created' | 'deleted' | 'suspend' | 'unsuspend' | 'new_permissions_accepted';
  installation: {
    id: number;
    account: GitHubUserType;
    app_id: number;
    target_type: 'User' | 'Organization';
    permissions: Record<string, string>;
    events: string[];
  };
  repositories?: Array<{
    id: number;
    name: string;
    full_name: string;
    private: boolean;
  }>;
  sender: GitHubUserType;
}

/**
 * Installation Repositories Webhook Payload
 */
export interface InstallationRepositoriesWebhookPayload {
  action: 'added' | 'removed';
  installation: {
    id: number;
    account: GitHubUserType;
  };
  repositories_added: Array<{
    id: number;
    name: string;
    full_name: string;
    private: boolean;
  }>;
  repositories_removed: Array<{
    id: number;
    name: string;
    full_name: string;
    private: boolean;
  }>;
  sender: GitHubUserType;
}

// =============================================
// Webhook Event Types Union
// =============================================

export type GitHubWebhookPayload =
  | PullRequestWebhookPayload
  | PullRequestReviewWebhookPayload
  | InstallationWebhookPayload
  | InstallationRepositoriesWebhookPayload;

// =============================================
// Response Types
// =============================================

export interface GitHubInstallationResponseType {
  installation: GitHubInstallationType;
}

export interface GitHubInstallationListResponseType {
  installations: GitHubInstallationType[];
}

export interface WebhookResponseType {
  success: boolean;
  message?: string;
}

