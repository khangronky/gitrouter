import type { RoutingCondition } from '@/lib/schema/routing-rule';

/**
 * Pull request context for routing evaluation
 */
export interface PullRequestContext {
  id: string;
  repository_id: string;
  github_pr_number: number;
  title: string;
  author_login: string;
  head_branch: string;
  base_branch: string;
  files_changed: string[];
  labels: string[];
  created_at: Date;
}

/**
 * Routing rule from database
 */
export interface RoutingRule {
  id: string;
  organization_id: string;
  repository_id: string | null;
  name: string;
  priority: number;
  is_active: boolean;
  conditions: RoutingCondition[];
  reviewer_ids: string[];
}

/**
 * Reviewer info for assignment
 */
export interface ReviewerInfo {
  id: string;
  name: string;
  github_username: string | null;
  slack_user_id: string | null;
  is_active: boolean;
}

/**
 * Result of routing evaluation
 */
export interface RoutingResult {
  matched: boolean;
  rule: RoutingRule | null;
  reviewers: ReviewerInfo[];
  fallback_used: boolean;
  evaluation_time_ms: number;
}

/**
 * Condition evaluation result
 */
export interface ConditionResult {
  type: string;
  matched: boolean;
  details?: string;
}
