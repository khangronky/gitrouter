-- Migration: Switch Jira integration from OAuth to API token support
-- API tokens are simpler: just email + token + site URL

-- Add email column for API token auth
alter table jira_integrations add column if not exists email text;

-- Make OAuth-specific columns nullable (not needed for API tokens)
alter table jira_integrations alter column refresh_token_encrypted drop not null;
alter table jira_integrations alter column token_expires_at drop not null;
alter table jira_integrations alter column cloud_id drop not null;

-- Add auth_type to differentiate between OAuth and API token
alter table jira_integrations add column if not exists auth_type text not null default 'api_token';

-- Add comment for clarity
comment on column jira_integrations.email is 'Atlassian email for API token authentication';
comment on column jira_integrations.access_token_encrypted is 'API token (for api_token auth) or access token (for oauth auth)';
comment on column jira_integrations.auth_type is 'Authentication type: api_token or oauth';

