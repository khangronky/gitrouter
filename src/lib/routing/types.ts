// Routing Engine Types

export interface TimeWindow {
  start: string; // HH:mm format
  end: string; // HH:mm format
  timezone: string; // e.g., 'America/New_York'
  days: number[]; // 0-6 (Sunday-Saturday)
}

export interface RuleConditions {
  file_patterns?: string[]; // Regex patterns to match against file paths
  authors?: string[]; // GitHub usernames - if PR author is in this list, rule matches
  exclude_authors?: string[]; // GitHub usernames to exclude from matching
  repositories?: string[]; // Repository full names (owner/repo)
  time_windows?: TimeWindow[]; // When this rule should apply
  min_files_changed?: number;
  max_files_changed?: number;
  title_patterns?: string[]; // Regex patterns to match against PR title
  labels?: string[]; // GitHub labels that must be present
}

export interface RoutingRule {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  priority: number;
  conditions: RuleConditions;
  reviewer_ids: string[];
  is_active: boolean;
}

export interface Reviewer {
  id: string;
  organization_id: string;
  github_username: string;
  slack_user_id?: string;
  email?: string;
  is_team_lead: boolean;
  is_active: boolean;
}

export interface RoutingContext {
  repository: string;
  author: string;
  filesChanged: string[];
  title: string;
  body?: string;
  labels?: string[];
  additions?: number;
  deletions?: number;
}

export interface RoutingResult {
  matched: boolean;
  rule?: RoutingRule;
  reviewers: Reviewer[];
  reason: string;
}

