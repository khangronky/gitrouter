-- =============================================
-- Database Schema Optimization
-- =============================================
-- This migration:
-- 1. Adds missing indexes for performance
-- 2. Adds unique constraints for data integrity
-- 3. Removes duplicate columns from reviewers (now sourced from users)
-- 4. Drops unused processed_events table

-- =============================================
-- 1. Add Missing Indexes
-- =============================================

-- Index for looking up review assignments by reviewer and status
CREATE INDEX IF NOT EXISTS review_assignments_reviewer_status_idx 
  ON review_assignments(reviewer_id, status);

-- Index for looking up reviewers by user_id (partial - only non-null)
CREATE INDEX IF NOT EXISTS reviewers_user_id_idx 
  ON reviewers(user_id) WHERE user_id IS NOT NULL;

-- Index for looking up notifications by org and status
CREATE INDEX IF NOT EXISTS notifications_org_status_idx 
  ON notifications(organization_id, status);

-- Index for looking up PRs by author
CREATE INDEX IF NOT EXISTS pull_requests_author_login_idx 
  ON pull_requests(author_login);

-- =============================================
-- 2. Add Unique Constraints
-- =============================================

-- Prevent duplicate reviewers per org for the same user
CREATE UNIQUE INDEX IF NOT EXISTS reviewers_org_user_key 
  ON reviewers(organization_id, user_id) WHERE user_id IS NOT NULL;

-- =============================================
-- 3. Drop Duplicate Columns from Reviewers
-- =============================================
-- These fields are now sourced from the linked users table via user_id

ALTER TABLE reviewers DROP COLUMN IF EXISTS github_username;
ALTER TABLE reviewers DROP COLUMN IF EXISTS slack_user_id;
ALTER TABLE reviewers DROP COLUMN IF EXISTS email;

-- Drop the old index on github_username if it exists
DROP INDEX IF EXISTS reviewers_github_username_idx;

-- =============================================
-- 4. Drop Unused Tables
-- =============================================
-- processed_events is not used; webhook_events handles idempotency

DROP TABLE IF EXISTS processed_events;

