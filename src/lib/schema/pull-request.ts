import { z } from 'zod';

// =============================================
// Pull Request Schemas
// =============================================

/**
 * PR Status
 */
export const prStatusSchema = z.enum(['open', 'merged', 'closed']);
export type PrStatus = z.infer<typeof prStatusSchema>;

/**
 * Review Status
 */
export const reviewStatusSchema = z.enum([
  'pending',
  'approved',
  'changes_requested',
  'commented',
  'dismissed',
]);
export type ReviewStatus = z.infer<typeof reviewStatusSchema>;

/**
 * Escalation Level
 */
export const escalationLevelSchema = z.enum(['reminder_24h', 'alert_48h']);
export type EscalationLevel = z.infer<typeof escalationLevelSchema>;

/**
 * Pull Request Type
 */
export interface PullRequestType {
  id: string;
  repository_id: string;
  github_pr_id: number;
  github_pr_number: number;
  title: string;
  body: string | null;
  author_login: string;
  author_id: number | null;
  head_branch: string;
  base_branch: string;
  files_changed: string[];
  additions: number;
  deletions: number;
  status: PrStatus;
  html_url: string;
  jira_ticket_id: string | null;
  created_at: string;
  updated_at: string;
  merged_at: string | null;
  closed_at: string | null;
  repository?: {
    id: string;
    full_name: string;
    organization_id: string;
  };
}

/**
 * Pull Request with Assignments
 */
export interface PullRequestWithAssignmentsType extends PullRequestType {
  assignments: ReviewAssignmentType[];
  escalations: EscalationType[];
}

/**
 * Review Assignment Type
 */
export interface ReviewAssignmentType {
  id: string;
  pull_request_id: string;
  reviewer_id: string;
  routing_rule_id: string | null;
  status: ReviewStatus;
  slack_message_ts: string | null;
  slack_channel_id: string | null;
  notified_at: string | null;
  reminder_sent_at: string | null;
  reviewed_at: string | null;
  assigned_at: string;
  created_at: string;
  updated_at: string;
  reviewer?: {
    id: string;
    name: string;
    github_username: string | null;
    slack_user_id: string | null;
  };
  routing_rule?: {
    id: string;
    name: string;
  } | null;
}

/**
 * Escalation Type
 */
export interface EscalationType {
  id: string;
  review_assignment_id: string;
  level: EscalationLevel;
  notified_user_ids: string[];
  slack_message_ts: string | null;
  created_at: string;
}

// =============================================
// Query Schemas
// =============================================

/**
 * List Pull Requests Query
 */
export const listPullRequestsQuerySchema = z.object({
  repository_id: z.string().uuid().optional(),
  status: prStatusSchema.optional(),
  author_login: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ListPullRequestsQuery = z.infer<typeof listPullRequestsQuerySchema>;

/**
 * List Escalated PRs Query
 */
export const listEscalatedPrsQuerySchema = z.object({
  level: escalationLevelSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ListEscalatedPrsQuery = z.infer<typeof listEscalatedPrsQuerySchema>;

// =============================================
// Response Types
// =============================================

export interface PullRequestListResponseType {
  pull_requests: PullRequestWithAssignmentsType[];
  total: number;
}

export interface PullRequestResponseType {
  pull_request: PullRequestWithAssignmentsType;
}

export interface EscalatedPrsResponseType {
  pull_requests: PullRequestWithAssignmentsType[];
  total: number;
}

