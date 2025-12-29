-- Add prs_synced_at column to track when PRs were last synced from GitHub
ALTER TABLE "public"."repositories" 
ADD COLUMN "prs_synced_at" timestamp with time zone;

-- Add comment for documentation
COMMENT ON COLUMN "public"."repositories"."prs_synced_at" IS 'Timestamp of last PR sync from GitHub API';

