-- =============================================
-- Add soft delete support to all deletable tables
-- =============================================

-- Add deleted_at column to all deletable tables
ALTER TABLE github_installations ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE slack_integrations ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE jira_integrations ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE repositories ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE routing_rules ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE organization_members ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN deleted_at TIMESTAMPTZ;

-- Add partial indexes for efficient filtering of non-deleted records
CREATE INDEX idx_github_installations_not_deleted ON github_installations(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_slack_integrations_not_deleted ON slack_integrations(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_jira_integrations_not_deleted ON jira_integrations(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_repositories_not_deleted ON repositories(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_routing_rules_not_deleted ON routing_rules(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_organization_members_not_deleted ON organization_members(organization_id, user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_organizations_not_deleted ON organizations(id) WHERE deleted_at IS NULL;

-- Update unique constraints to be partial (only apply to non-deleted records)
-- This allows soft-deleted records to exist alongside active ones

-- Drop existing unique constraints that conflict with soft delete
DROP INDEX IF EXISTS slack_integrations_org_key;
DROP INDEX IF EXISTS jira_integrations_org_key;

-- Recreate as partial unique indexes (only for non-deleted records)
CREATE UNIQUE INDEX slack_integrations_org_key ON slack_integrations(organization_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX jira_integrations_org_key ON jira_integrations(organization_id) WHERE deleted_at IS NULL;

