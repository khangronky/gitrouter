-- Fix: Add missing columns that were added to an already-applied migration
-- These columns were in 20251127100001_jira_api_token_support.sql but added after migration was run

-- Add auto_create_tickets setting to control automatic ticket creation
alter table jira_integrations add column if not exists auto_create_tickets boolean not null default false;

-- Add default_issue_type for auto-created tickets
alter table jira_integrations add column if not exists default_issue_type text not null default 'Task';

-- Add comments for clarity
comment on column jira_integrations.auto_create_tickets is 'When true, automatically create Jira tickets for new PRs';
comment on column jira_integrations.default_issue_type is 'Issue type for auto-created tickets (e.g., Task, Story, Bug)';

-- Notify PostgREST to reload schema cache
notify pgrst, 'reload schema';

