-- Add integration identity fields to users table
-- This allows storing GitHub and Slack usernames/IDs separately since they may differ

alter table "public"."users" 
  add column if not exists "github_user_id" bigint,
  add column if not exists "github_username" text,
  add column if not exists "slack_user_id" text,
  add column if not exists "slack_username" text;

-- Add indexes for efficient lookups
create index if not exists users_github_user_id_idx on public.users using btree (github_user_id);
create index if not exists users_slack_user_id_idx on public.users using btree (slack_user_id);

-- Add comment explaining the fields
comment on column public.users.github_user_id is 'GitHub numeric user ID';
comment on column public.users.github_username is 'GitHub username (login)';
comment on column public.users.slack_user_id is 'Slack user ID (e.g., U12345678)';
comment on column public.users.slack_username is 'Slack display name or username';

