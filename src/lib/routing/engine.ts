import { createAdminClient } from '@/lib/supabase/server';
import { matchesConditions } from './matcher';
import type {
  RoutingRule,
  Reviewer,
  RoutingContext,
  RoutingResult,
  RuleConditions,
} from './types';
import type { ProcessedPullRequest } from '@/lib/github/types';
import { requestReviewers } from '@/lib/github/client';

// Simple in-memory cache for rules (TTL: 60 seconds)
const rulesCache = new Map<string, { rules: RoutingRule[]; timestamp: number }>();
const CACHE_TTL = 60 * 1000; // 60 seconds

/**
 * Loads routing rules for an organization, sorted by priority
 * Uses caching for performance (<100ms target)
 */
async function loadRules(organizationId: string): Promise<RoutingRule[]> {
  const cached = rulesCache.get(organizationId);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.rules;
  }

  const supabase = await createAdminClient();

  const { data: rules, error } = await supabase
    .from('routing_rules')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('priority', { ascending: true });

  if (error) {
    console.error('Failed to load routing rules:', error);
    throw error;
  }

  const typedRules: RoutingRule[] = (rules || []).map((r) => ({
    id: r.id,
    organization_id: r.organization_id,
    name: r.name,
    description: r.description,
    priority: r.priority,
    conditions: r.conditions as RuleConditions,
    reviewer_ids: r.reviewer_ids,
    is_active: r.is_active,
  }));

  rulesCache.set(organizationId, { rules: typedRules, timestamp: now });

  return typedRules;
}

/**
 * Loads reviewers by their IDs
 */
async function loadReviewers(reviewerIds: string[]): Promise<Reviewer[]> {
  if (reviewerIds.length === 0) {
    return [];
  }

  const supabase = await createAdminClient();

  const { data: reviewers, error } = await supabase
    .from('reviewers')
    .select('*')
    .in('id', reviewerIds)
    .eq('is_active', true);

  if (error) {
    console.error('Failed to load reviewers:', error);
    return [];
  }

  return (reviewers || []).map((r) => ({
    id: r.id,
    organization_id: r.organization_id,
    github_username: r.github_username,
    slack_user_id: r.slack_user_id,
    email: r.email,
    is_team_lead: r.is_team_lead,
    is_active: r.is_active,
  }));
}

/**
 * Gets the default reviewer for an organization
 */
async function getDefaultReviewer(organizationId: string): Promise<Reviewer | null> {
  const supabase = await createAdminClient();

  const { data: org } = await supabase
    .from('organizations')
    .select('default_reviewer_id')
    .eq('id', organizationId)
    .single();

  if (!org?.default_reviewer_id) {
    return null;
  }

  const reviewers = await loadReviewers([org.default_reviewer_id]);
  return reviewers[0] || null;
}

/**
 * Main routing function - finds matching reviewers for a PR
 */
export async function findReviewers(
  organizationId: string,
  context: RoutingContext
): Promise<RoutingResult> {
  const startTime = Date.now();

  try {
    const rules = await loadRules(organizationId);

    // Evaluate rules in priority order (first match wins)
    for (const rule of rules) {
      const { matches, reason } = matchesConditions(context, rule.conditions);

      if (matches) {
        // Filter out the PR author from reviewers
        let reviewerIds = rule.reviewer_ids.filter((id) => id !== context.author);

        // Load reviewer details
        let reviewers = await loadReviewers(reviewerIds);

        // Also filter by GitHub username
        reviewers = reviewers.filter(
          (r) => r.github_username.toLowerCase() !== context.author.toLowerCase()
        );

        const elapsed = Date.now() - startTime;
        console.log(`Routing completed in ${elapsed}ms, matched rule: ${rule.name}`);

        return {
          matched: true,
          rule,
          reviewers,
          reason: `Matched rule "${rule.name}": ${reason}`,
        };
      }
    }

    // No rules matched, use default reviewer
    const defaultReviewer = await getDefaultReviewer(organizationId);
    const reviewers = defaultReviewer ? [defaultReviewer] : [];

    // Filter out author from default reviewer too
    const filteredReviewers = reviewers.filter(
      (r) => r.github_username.toLowerCase() !== context.author.toLowerCase()
    );

    const elapsed = Date.now() - startTime;
    console.log(`Routing completed in ${elapsed}ms, using default reviewer`);

    return {
      matched: false,
      reviewers: filteredReviewers,
      reason: 'No rules matched, using default reviewer',
    };
  } catch (error) {
    console.error('Routing error:', error);
    return {
      matched: false,
      reviewers: [],
      reason: `Routing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Routes a pull request and creates assignments
 */
export async function routePullRequest(
  organizationId: string,
  prId: string,
  pr: ProcessedPullRequest,
  installationId: number
): Promise<void> {
  const context: RoutingContext = {
    repository: pr.repository,
    author: pr.author,
    filesChanged: pr.filesChanged,
    title: pr.title,
    body: pr.body || undefined,
    additions: pr.additions,
    deletions: pr.deletions,
  };

  const result = await findReviewers(organizationId, context);

  if (result.reviewers.length === 0) {
    console.warn('No reviewers found for PR:', { prId, repository: pr.repository });
    return;
  }

  const supabase = await createAdminClient();

  // Create review assignments
  const assignments = result.reviewers.map((reviewer) => ({
    pull_request_id: prId,
    reviewer_id: reviewer.id,
    routing_rule_id: result.rule?.id || null,
    status: 'pending',
    escalation_level: 'none',
    assigned_at: new Date().toISOString(),
  }));

  const { error: assignError } = await supabase
    .from('review_assignments')
    .insert(assignments);

  if (assignError) {
    console.error('Failed to create assignments:', assignError);
    throw assignError;
  }

  // Request reviewers on GitHub
  try {
    const [owner, repo] = pr.repository.split('/');
    const githubUsernames = result.reviewers.map((r) => r.github_username);

    await requestReviewers(
      installationId,
      owner,
      repo,
      pr.githubPrNumber,
      githubUsernames
    );
  } catch (error) {
    console.error('Failed to request GitHub reviewers:', error);
    // Don't throw - assignments are still created
  }

  // Queue notifications for each reviewer (will be handled by Trigger.dev)
  console.log('PR routed:', {
    prId,
    rule: result.rule?.name,
    reviewers: result.reviewers.map((r) => r.github_username),
  });
}

/**
 * Invalidates the rules cache for an organization
 * Call this when rules are updated
 */
export function invalidateRulesCache(organizationId: string): void {
  rulesCache.delete(organizationId);
}

/**
 * Clears the entire rules cache
 */
export function clearRulesCache(): void {
  rulesCache.clear();
}

