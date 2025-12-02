import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  PullRequestContext,
  RoutingRule,
  ReviewerInfo,
  RoutingResult,
} from './types';
import { evaluateAllConditions } from './matchers';

/**
 * Route a pull request to reviewers based on configured rules
 *
 * Algorithm:
 * 1. Fetch all active rules for the organization, ordered by priority
 * 2. Filter rules that apply to this repository (or all repos)
 * 3. Evaluate each rule's conditions against the PR context
 * 4. First matching rule wins - get its reviewers
 * 5. If no rules match, use fallback (repo default → org default)
 * 6. Exclude PR author from reviewers
 *
 * Performance target: <100ms for 1000+ rules (uses indexed queries)
 */
export async function routePullRequest(
  supabase: SupabaseClient,
  context: PullRequestContext,
  organizationId: string
): Promise<RoutingResult> {
  const startTime = performance.now();

  // Fetch active rules for this organization
  // Ordered by priority (lower number = higher priority)
  const { data: rules, error: rulesError } = await supabase
    .from('routing_rules')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .or(`repository_id.is.null,repository_id.eq.${context.repository_id}`)
    .order('priority', { ascending: true });

  if (rulesError) {
    console.error('Failed to fetch routing rules:', rulesError);
    return createFallbackResult(supabase, context, organizationId, startTime);
  }

  // Evaluate rules in priority order
  for (const rule of rules || []) {
    const typedRule: RoutingRule = {
      id: rule.id,
      organization_id: rule.organization_id,
      repository_id: rule.repository_id,
      name: rule.name,
      priority: rule.priority,
      is_active: rule.is_active,
      conditions: rule.conditions as RoutingRule['conditions'],
      reviewer_ids: rule.reviewer_ids,
    };

    const { matched } = evaluateAllConditions(typedRule.conditions, context);

    if (matched) {
      // Get reviewers for this rule
      const reviewers = await getReviewers(
        supabase,
        typedRule.reviewer_ids,
        context.author_login
      );

      if (reviewers.length > 0) {
        return {
          matched: true,
          rule: typedRule,
          reviewers,
          fallback_used: false,
          evaluation_time_ms: performance.now() - startTime,
        };
      }
      // If rule matched but no valid reviewers, continue to next rule
    }
  }

  // No rules matched - use fallback
  return createFallbackResult(supabase, context, organizationId, startTime);
}

/**
 * Create fallback result when no rules match
 * Tries: repo default reviewer → org default reviewer
 */
async function createFallbackResult(
  supabase: SupabaseClient,
  context: PullRequestContext,
  organizationId: string,
  startTime: number
): Promise<RoutingResult> {
  // Try repository default reviewer
  const { data: repo } = await supabase
    .from('repositories')
    .select('default_reviewer_id')
    .eq('id', context.repository_id)
    .single();

  if (repo?.default_reviewer_id) {
    const reviewers = await getReviewers(
      supabase,
      [repo.default_reviewer_id],
      context.author_login
    );

    if (reviewers.length > 0) {
      return {
        matched: false,
        rule: null,
        reviewers,
        fallback_used: true,
        evaluation_time_ms: performance.now() - startTime,
      };
    }
  }

  // Try organization default reviewer
  const { data: org } = await supabase
    .from('organizations')
    .select('default_reviewer_id')
    .eq('id', organizationId)
    .single();

  if (org?.default_reviewer_id) {
    const reviewers = await getReviewers(
      supabase,
      [org.default_reviewer_id],
      context.author_login
    );

    if (reviewers.length > 0) {
      return {
        matched: false,
        rule: null,
        reviewers,
        fallback_used: true,
        evaluation_time_ms: performance.now() - startTime,
      };
    }
  }

  // No default reviewer configured
  return {
    matched: false,
    rule: null,
    reviewers: [],
    fallback_used: true,
    evaluation_time_ms: performance.now() - startTime,
  };
}

/**
 * Get reviewer details by IDs
 * Excludes the PR author from the list
 */
async function getReviewers(
  supabase: SupabaseClient,
  reviewerIds: string[],
  authorLogin: string
): Promise<ReviewerInfo[]> {
  if (reviewerIds.length === 0) {
    return [];
  }

  const { data: reviewers, error } = await supabase
    .from('reviewers')
    .select('id, name, github_username, slack_user_id, is_active')
    .in('id', reviewerIds)
    .eq('is_active', true);

  if (error || !reviewers) {
    console.error('Failed to fetch reviewers:', error);
    return [];
  }

  // Filter out the PR author
  const authorLower = authorLogin.toLowerCase();
  return reviewers.filter(
    (r) => r.github_username?.toLowerCase() !== authorLower
  );
}

/**
 * Create review assignments for a pull request
 */
export async function createReviewAssignments(
  supabase: SupabaseClient,
  pullRequestId: string,
  routingResult: RoutingResult
): Promise<void> {
  if (routingResult.reviewers.length === 0) {
    return;
  }

  const assignments = routingResult.reviewers.map((reviewer) => ({
    pull_request_id: pullRequestId,
    reviewer_id: reviewer.id,
    routing_rule_id: routingResult.rule?.id || null,
    status: 'pending',
    assigned_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('review_assignments')
    .upsert(assignments, {
      onConflict: 'pull_request_id,reviewer_id',
      ignoreDuplicates: true,
    });

  if (error) {
    console.error('Failed to create review assignments:', error);
  }
}

/**
 * Build PR context from database record
 */
export function buildPrContext(
  pr: {
    id: string;
    repository_id: string;
    github_pr_number: number;
    title: string;
    author_login: string;
    head_branch: string;
    base_branch: string;
    files_changed: string[];
    created_at: string;
  },
  labels: string[] = []
): PullRequestContext {
  return {
    id: pr.id,
    repository_id: pr.repository_id,
    github_pr_number: pr.github_pr_number,
    title: pr.title,
    author_login: pr.author_login,
    head_branch: pr.head_branch,
    base_branch: pr.base_branch,
    files_changed: pr.files_changed || [],
    labels,
    created_at: new Date(pr.created_at),
  };
}

/**
 * Full routing flow: route PR and create assignments
 */
export async function routeAndAssignReviewers(
  supabase: SupabaseClient,
  pr: {
    id: string;
    repository_id: string;
    github_pr_number: number;
    title: string;
    author_login: string;
    head_branch: string;
    base_branch: string;
    files_changed: string[];
    created_at: string;
  },
  organizationId: string,
  labels: string[] = []
): Promise<RoutingResult> {
  const context = buildPrContext(pr, labels);
  const result = await routePullRequest(supabase, context, organizationId);

  if (result.reviewers.length > 0) {
    await createReviewAssignments(supabase, pr.id, result);
  }

  return result;
}
