import { z } from 'zod';

// =============================================
// Routing Rule Condition Schemas
// =============================================

/**
 * File Pattern Condition
 * Matches files changed in PR against regex patterns
 */
export const filePatternConditionSchema = z.object({
  type: z.literal('file_pattern'),
  patterns: z.array(z.string()).min(1, 'At least one pattern is required'),
  match_mode: z.enum(['any', 'all']).default('any'), // any = OR, all = AND
});

/**
 * Author Condition
 * Match or exclude specific PR authors
 */
export const authorConditionSchema = z.object({
  type: z.literal('author'),
  usernames: z.array(z.string()).min(1, 'At least one username is required'),
  mode: z.enum(['include', 'exclude']).default('exclude'), // typically exclude author from review
});

/**
 * Time Window Condition
 * Only apply rule during specific hours (for time-based routing)
 */
export const timeWindowConditionSchema = z.object({
  type: z.literal('time_window'),
  timezone: z.string().default('UTC'),
  days: z
    .array(z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']))
    .min(1),
  start_hour: z.number().min(0).max(23),
  end_hour: z.number().min(0).max(23),
});

/**
 * Branch Condition
 * Match PRs targeting specific branches
 */
export const branchConditionSchema = z.object({
  type: z.literal('branch'),
  patterns: z.array(z.string()).min(1, 'At least one pattern is required'),
  branch_type: z.enum(['base', 'head']).default('base'), // base = target branch
});

/**
 * Label Condition
 * Match PRs with specific labels
 */
export const labelConditionSchema = z.object({
  type: z.literal('label'),
  labels: z.array(z.string()).min(1, 'At least one label is required'),
  match_mode: z.enum(['any', 'all']).default('any'),
});

/**
 * Union of all condition types
 */
export const routingConditionSchema = z.discriminatedUnion('type', [
  filePatternConditionSchema,
  authorConditionSchema,
  timeWindowConditionSchema,
  branchConditionSchema,
  labelConditionSchema,
]);

export type RoutingCondition = z.infer<typeof routingConditionSchema>;

// =============================================
// Routing Rule Schemas
// =============================================

/**
 * Create Routing Rule Schema
 */
export const createRoutingRuleSchema = z.object({
  name: z
    .string()
    .min(1, 'Rule name is required')
    .max(100, 'Rule name must be at most 100 characters'),
  description: z.string().max(500).optional(),
  repository_id: z.string().uuid().nullable().optional(), // null = applies to all repos
  priority: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
  conditions: z
    .array(routingConditionSchema)
    .min(1, 'At least one condition is required'),
  reviewer_ids: z
    .array(z.string().uuid())
    .min(1, 'At least one reviewer is required'),
});

export type CreateRoutingRuleSchema = z.infer<typeof createRoutingRuleSchema>;

/**
 * Update Routing Rule Schema
 */
export const updateRoutingRuleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  repository_id: z.string().uuid().nullable().optional(),
  priority: z.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
  conditions: z.array(routingConditionSchema).optional(),
  reviewer_ids: z.array(z.string().uuid()).optional(),
});

export type UpdateRoutingRuleSchema = z.infer<typeof updateRoutingRuleSchema>;

/**
 * Reorder Rules Schema (update priorities)
 */
export const reorderRulesSchema = z.object({
  rule_ids: z
    .array(z.string().uuid())
    .min(1, 'At least one rule ID is required'),
});

export type ReorderRulesSchema = z.infer<typeof reorderRulesSchema>;

/**
 * Routing Rule Type
 */
export interface RoutingRuleType {
  id: string;
  organization_id: string;
  repository_id: string | null;
  name: string;
  description: string | null;
  priority: number;
  is_active: boolean;
  conditions: RoutingCondition[];
  reviewer_ids: string[];
  created_at: string;
  updated_at: string;
  repository?: {
    id: string;
    full_name: string;
  } | null;
  reviewers?: {
    id: string;
    name: string;
    github_username: string | null;
  }[];
}

// =============================================
// Response Types
// =============================================

export interface RoutingRuleListResponseType {
  rules: RoutingRuleType[];
}

export interface RoutingRuleResponseType {
  rule: RoutingRuleType;
}

