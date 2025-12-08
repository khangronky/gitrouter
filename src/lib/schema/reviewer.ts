import { z } from 'zod';

// =============================================
// Reviewer Schemas
// =============================================

/**
 * Create Reviewer Schema
 * Note: github_username, slack_user_id, and email are stored on the users table.
 * If user_id is provided, these fields will be used to update the linked user.
 * If user_id is not provided, these fields are accepted for backwards compatibility
 * but a user will need to be linked later.
 */
export const createReviewerSchema = z.object({
  name: z
    .string()
    .min(1, 'Reviewer name is required')
    .max(100, 'Reviewer name must be at most 100 characters'),
  user_id: z.string().uuid().nullable().optional(), // link to existing user
  github_username: z.string().max(39).nullable().optional(), // Updated on users table
  slack_user_id: z.string().nullable().optional(), // Updated on users table
  email: z.string().email().nullable().optional(), // For display/lookup only
  is_active: z.boolean().default(true),
});

export type CreateReviewerSchema = z.infer<typeof createReviewerSchema>;

/**
 * Update Reviewer Schema
 */
export const updateReviewerSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  user_id: z.string().uuid().nullable().optional(),
  github_username: z.string().max(39).nullable().optional(), // Updated on users table
  slack_user_id: z.string().nullable().optional(), // Updated on users table
  email: z.string().email().nullable().optional(),
  is_active: z.boolean().optional(),
});

export type UpdateReviewerSchema = z.infer<typeof updateReviewerSchema>;

/**
 * Reviewer Type
 * User-related fields (github_username, slack_user_id, email) are in the nested user object.
 * The `name` field is kept as a fallback for reviewers without linked users.
 */
export interface ReviewerType {
  id: string;
  organization_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    full_name: string | null;
    github_username: string | null;
    slack_user_id: string | null;
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
