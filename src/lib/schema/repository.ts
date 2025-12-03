import { z } from 'zod';

// =============================================
// Repository Schemas
// =============================================

/**
 * Add Repository Schema
 */
export const addRepositorySchema = z.object({
  github_repo_id: z.number().int().positive('Invalid GitHub repository ID'),
  full_name: z
    .string()
    .min(1, 'Repository name is required')
    .regex(/^[^/]+\/[^/]+$/, 'Repository name must be in format owner/repo'),
  default_branch: z.string().default('main'),
  default_reviewer_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean().default(true),
});

export type AddRepositorySchema = z.infer<typeof addRepositorySchema>;

/**
 * Update Repository Schema
 */
export const updateRepositorySchema = z.object({
  default_branch: z.string().optional(),
  default_reviewer_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean().optional(),
});

export type UpdateRepositorySchema = z.infer<typeof updateRepositorySchema>;

/**
 * Repository Type
 */
export interface RepositoryType {
  id: string;
  organization_id: string;
  github_installation_id: string;
  github_repo_id: number;
  full_name: string;
  default_branch: string;
  default_reviewer_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Repository with Stats
 */
export interface RepositoryWithStatsType extends RepositoryType {
  open_pr_count?: number;
  total_pr_count?: number;
  default_reviewer?: {
    id: string;
    name: string;
  } | null;
}

/**
 * GitHub Available Repository (from installation)
 */
export interface GitHubAvailableRepositoryType {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  default_branch: string;
  html_url: string;
  description: string | null;
  already_added: boolean; // true if repo is already in the organization
}

// =============================================
// Response Types
// =============================================

export interface RepositoryListResponseType {
  repositories: RepositoryWithStatsType[];
}

export interface RepositoryResponseType {
  repository: RepositoryType;
}

export interface AvailableRepositoriesResponseType {
  repositories: GitHubAvailableRepositoryType[];
  installation_id: number;
}

export interface MessageResponseType {
  message: string;
}

