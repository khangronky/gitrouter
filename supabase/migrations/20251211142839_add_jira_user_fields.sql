-- =============================================
-- Add Jira integration identity fields to users table
-- This allows storing Jira account ID for direct user lookup
-- =============================================

ALTER TABLE "public"."users" 
  ADD COLUMN IF NOT EXISTS "jira_account_id" text,
  ADD COLUMN IF NOT EXISTS "jira_email" text;

-- Add index for efficient lookups by Jira account ID
CREATE INDEX IF NOT EXISTS users_jira_account_id_idx ON public.users USING btree (jira_account_id);

-- Add comments explaining the fields
COMMENT ON COLUMN public.users.jira_account_id IS 'Jira account ID (e.g., 5b10ac8d82e05b22cc7d4ef5)';
COMMENT ON COLUMN public.users.jira_email IS 'Email address associated with Jira account';

