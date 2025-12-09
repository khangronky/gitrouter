import { z } from 'zod';

// =============================================
// Reviewer Schemas
// =============================================

/**
 * Create Reviewer Schema
 * Requires a user_id - the reviewer's name comes from user.full_name.
 * github_username and slack_user_id can be provided to update the user.
 */
export const createReviewerSchema = z.object({
  user_id: z.string().uuid(), // Required - link to existing user
  github_username: z.string().max(39).nullable().optional(), // Updated on users table
  slack_user_id: z.string().nullable().optional(), // Updated on users table
  is_active: z.boolean().default(true),
});

export type CreateReviewerSchema = z.infer<typeof createReviewerSchema>;

/**
 * Update Reviewer Schema
 */
export const updateReviewerSchema = z.object({
  user_id: z.string().uuid().optional(), // Can change linked user
  github_username: z.string().max(39).nullable().optional(), // Updated on users table
  slack_user_id: z.string().nullable().optional(), // Updated on users table
  is_active: z.boolean().optional(),
});

export type UpdateReviewerSchema = z.infer<typeof updateReviewerSchema>;

/**
 * Reviewer Type
 * All user info (name, github_username, slack_user_id, email) is in the nested user object.
 */
export interface ReviewerType {
  id: string;
  organization_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    email: string;
    full_name: string | null;
    github_username: string | null;
    slack_user_id: string | null;
  };
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
