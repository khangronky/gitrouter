import { z } from 'zod';

// =============================================
// Reviewer Schemas
// =============================================

/**
 * Create Reviewer Schema
 */
export const createReviewerSchema = z.object({
  name: z
    .string()
    .min(1, 'Reviewer name is required')
    .max(100, 'Reviewer name must be at most 100 characters'),
  user_id: z.string().uuid().nullable().optional(), // link to existing user
  github_username: z.string().max(39).nullable().optional(), // GitHub max username length
  slack_user_id: z.string().nullable().optional(),
  email: z.email().nullable().optional(),
  is_active: z.boolean().default(true),
});

export type CreateReviewerSchema = z.infer<typeof createReviewerSchema>;

/**
 * Update Reviewer Schema
 */
export const updateReviewerSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  user_id: z.string().uuid().nullable().optional(),
  github_username: z.string().max(39).nullable().optional(),
  slack_user_id: z.string().nullable().optional(),
  email: z.email().nullable().optional(),
  is_active: z.boolean().optional(),
});

export type UpdateReviewerSchema = z.infer<typeof updateReviewerSchema>;

/**
 * Reviewer Type
 */
export interface ReviewerType {
  id: string;
  organization_id: string;
  user_id: string | null;
  name: string;
  github_username: string | null;
  slack_user_id: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    full_name: string | null;
  } | null;
}

/**
 * Reviewer with Stats
 */
export interface ReviewerWithStatsType extends ReviewerType {
  pending_reviews: number;
  completed_reviews: number;
  average_review_time_hours?: number;
}

// =============================================
// Response Types
// =============================================

export interface ReviewerListResponseType {
  reviewers: ReviewerType[];
}

export interface ReviewerResponseType {
  reviewer: ReviewerType;
}
