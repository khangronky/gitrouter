-- PR Automation System Schema
-- Multi-tenant tables for GitHub PR routing, notifications, and escalations

-- ====================
-- ENUMS
-- ====================

create type organization_role as enum ('owner', 'admin', 'member');
create type pr_status as enum ('open', 'merged', 'closed');
create type assignment_status as enum ('pending', 'approved', 'changes_requested', 'commented', 'dismissed');
create type escalation_level as enum ('none', 'reminded', 'escalated');

-- ====================
-- ORGANIZATIONS
-- ====================

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  settings jsonb not null default '{}'::jsonb,
  default_reviewer_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_organizations_slug on organizations(slug);

-- ====================
-- ORGANIZATION MEMBERS
-- ====================

create table organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role organization_role not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organization_id, user_id)
);

create index idx_org_members_org_id on organization_members(organization_id);
create index idx_org_members_user_id on organization_members(user_id);

-- ====================
-- GITHUB INSTALLATIONS
-- ====================

create table github_installations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  installation_id bigint not null unique,
  access_token_encrypted text,
  token_expires_at timestamptz,
  repositories jsonb not null default '[]'::jsonb,
  account_login text not null,
  account_type text not null default 'Organization',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_github_installations_org_id on github_installations(organization_id);
create index idx_github_installations_installation_id on github_installations(installation_id);

-- ====================
-- REVIEWERS
-- ====================

create table reviewers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  github_username text not null,
  slack_user_id text,
  email text,
  is_team_lead boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organization_id, github_username)
);

create index idx_reviewers_org_id on reviewers(organization_id);
create index idx_reviewers_github_username on reviewers(github_username);

-- Add foreign key for default_reviewer after reviewers table exists
alter table organizations 
  add constraint fk_default_reviewer 
  foreign key (default_reviewer_id) 
  references reviewers(id) on delete set null;

-- ====================
-- PULL REQUESTS
-- ====================

create table pull_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  github_pr_id bigint not null,
  github_pr_number integer not null,
  repository text not null,
  title text not null,
  body text,
  author text not null,
  author_avatar_url text,
  files_changed jsonb not null default '[]'::jsonb,
  additions integer not null default 0,
  deletions integer not null default 0,
  status pr_status not null default 'open',
  html_url text not null,
  jira_ticket_id text,
  merged_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organization_id, github_pr_id)
);

create index idx_pull_requests_org_id on pull_requests(organization_id);
create index idx_pull_requests_status on pull_requests(status);
create index idx_pull_requests_author on pull_requests(author);
create index idx_pull_requests_repository on pull_requests(repository);
create index idx_pull_requests_created_at on pull_requests(created_at);
create index idx_pull_requests_jira_ticket on pull_requests(jira_ticket_id) where jira_ticket_id is not null;

-- ====================
-- PROCESSED EVENTS (Idempotency)
-- ====================

create table processed_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  event_type text not null,
  processed_at timestamptz not null default now()
);

create index idx_processed_events_event_id on processed_events(event_id);
-- Auto-cleanup old events (older than 7 days)
create index idx_processed_events_processed_at on processed_events(processed_at);

-- ====================
-- ROUTING RULES
-- ====================

create table routing_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  description text,
  priority integer not null default 0,
  conditions jsonb not null default '{}'::jsonb,
  -- conditions structure:
  -- {
  --   "file_patterns": ["^src/.*\\.ts$", "^lib/.*"],
  --   "authors": ["username1", "username2"],
  --   "repositories": ["repo1", "repo2"],
  --   "exclude_authors": ["bot-user"],
  --   "time_windows": [{"start": "09:00", "end": "17:00", "timezone": "America/New_York", "days": [1,2,3,4,5]}]
  -- }
  reviewer_ids uuid[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_routing_rules_org_id on routing_rules(organization_id);
create index idx_routing_rules_priority on routing_rules(organization_id, priority);
create index idx_routing_rules_active on routing_rules(organization_id, is_active) where is_active = true;

-- ====================
-- REVIEW ASSIGNMENTS
-- ====================

create table review_assignments (
  id uuid primary key default gen_random_uuid(),
  pull_request_id uuid not null references pull_requests(id) on delete cascade,
  reviewer_id uuid not null references reviewers(id) on delete cascade,
  routing_rule_id uuid references routing_rules(id) on delete set null,
  status assignment_status not null default 'pending',
  escalation_level escalation_level not null default 'none',
  assigned_at timestamptz not null default now(),
  first_notified_at timestamptz,
  reminded_at timestamptz,
  escalated_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(pull_request_id, reviewer_id)
);

create index idx_review_assignments_pr_id on review_assignments(pull_request_id);
create index idx_review_assignments_reviewer_id on review_assignments(reviewer_id);
create index idx_review_assignments_status on review_assignments(status);
create index idx_review_assignments_escalation on review_assignments(escalation_level, assigned_at) 
  where status = 'pending';

-- ====================
-- SLACK INTEGRATIONS
-- ====================

create table slack_integrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade unique,
  team_id text not null,
  team_name text not null,
  bot_token_encrypted text not null,
  bot_user_id text,
  team_channel_id text,
  escalation_channel_id text,
  webhook_url_encrypted text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_slack_integrations_org_id on slack_integrations(organization_id);

-- ====================
-- JIRA INTEGRATIONS
-- ====================

create table jira_integrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade unique,
  cloud_id text not null,
  site_url text not null,
  access_token_encrypted text not null,
  refresh_token_encrypted text not null,
  token_expires_at timestamptz not null,
  project_keys text[] not null default '{}',
  auto_transition_enabled boolean not null default true,
  merge_transition_id text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_jira_integrations_org_id on jira_integrations(organization_id);

-- ====================
-- NOTIFICATIONS LOG
-- ====================

create table notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  review_assignment_id uuid references review_assignments(id) on delete cascade,
  channel text not null, -- 'slack_dm', 'slack_channel', 'email'
  recipient text not null,
  message_type text not null, -- 'new_pr', 'reminder', 'escalation'
  payload jsonb not null default '{}'::jsonb,
  external_message_id text,
  status text not null default 'pending', -- 'pending', 'sent', 'failed'
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_notifications_org_id on notifications(organization_id);
create index idx_notifications_assignment_id on notifications(review_assignment_id);
create index idx_notifications_status on notifications(status);

-- ====================
-- ROW LEVEL SECURITY
-- ====================

alter table organizations enable row level security;
alter table organization_members enable row level security;
alter table github_installations enable row level security;
alter table reviewers enable row level security;
alter table pull_requests enable row level security;
alter table routing_rules enable row level security;
alter table review_assignments enable row level security;
alter table slack_integrations enable row level security;
alter table jira_integrations enable row level security;
alter table notifications enable row level security;

-- Helper function to check org membership
create or replace function user_has_org_access(org_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from organization_members
    where organization_id = org_id
    and user_id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- Helper function to check org admin access
create or replace function user_is_org_admin(org_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from organization_members
    where organization_id = org_id
    and user_id = auth.uid()
    and role in ('owner', 'admin')
  );
end;
$$ language plpgsql security definer;

-- Organizations policies
create policy "Users can view orgs they belong to"
  on organizations for select
  to authenticated
  using (user_has_org_access(id));

create policy "Admins can update their orgs"
  on organizations for update
  to authenticated
  using (user_is_org_admin(id));

create policy "Users can create orgs"
  on organizations for insert
  to authenticated
  with check (true);

-- Organization members policies
create policy "Members can view org members"
  on organization_members for select
  to authenticated
  using (user_has_org_access(organization_id));

create policy "Admins can manage org members"
  on organization_members for all
  to authenticated
  using (user_is_org_admin(organization_id));

-- GitHub installations policies
create policy "Members can view installations"
  on github_installations for select
  to authenticated
  using (user_has_org_access(organization_id));

create policy "Admins can manage installations"
  on github_installations for all
  to authenticated
  using (user_is_org_admin(organization_id));

-- Reviewers policies
create policy "Members can view reviewers"
  on reviewers for select
  to authenticated
  using (user_has_org_access(organization_id));

create policy "Admins can manage reviewers"
  on reviewers for all
  to authenticated
  using (user_is_org_admin(organization_id));

-- Pull requests policies
create policy "Members can view PRs"
  on pull_requests for select
  to authenticated
  using (user_has_org_access(organization_id));

create policy "Service role can manage PRs"
  on pull_requests for all
  to service_role
  using (true);

-- Routing rules policies
create policy "Members can view rules"
  on routing_rules for select
  to authenticated
  using (user_has_org_access(organization_id));

create policy "Admins can manage rules"
  on routing_rules for all
  to authenticated
  using (user_is_org_admin(organization_id));

-- Review assignments policies
create policy "Members can view assignments"
  on review_assignments for select
  to authenticated
  using (
    exists (
      select 1 from pull_requests pr
      where pr.id = pull_request_id
      and user_has_org_access(pr.organization_id)
    )
  );

create policy "Service role can manage assignments"
  on review_assignments for all
  to service_role
  using (true);

-- Slack integrations policies
create policy "Members can view slack integration"
  on slack_integrations for select
  to authenticated
  using (user_has_org_access(organization_id));

create policy "Admins can manage slack integration"
  on slack_integrations for all
  to authenticated
  using (user_is_org_admin(organization_id));

-- Jira integrations policies
create policy "Members can view jira integration"
  on jira_integrations for select
  to authenticated
  using (user_has_org_access(organization_id));

create policy "Admins can manage jira integration"
  on jira_integrations for all
  to authenticated
  using (user_is_org_admin(organization_id));

-- Notifications policies
create policy "Members can view notifications"
  on notifications for select
  to authenticated
  using (user_has_org_access(organization_id));

create policy "Service role can manage notifications"
  on notifications for all
  to service_role
  using (true);

-- Processed events - service role only
alter table processed_events enable row level security;

create policy "Service role can manage processed events"
  on processed_events for all
  to service_role
  using (true);

-- ====================
-- UPDATED_AT TRIGGERS
-- ====================

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_organizations_updated_at
  before update on organizations
  for each row execute function update_updated_at_column();

create trigger update_organization_members_updated_at
  before update on organization_members
  for each row execute function update_updated_at_column();

create trigger update_github_installations_updated_at
  before update on github_installations
  for each row execute function update_updated_at_column();

create trigger update_reviewers_updated_at
  before update on reviewers
  for each row execute function update_updated_at_column();

create trigger update_pull_requests_updated_at
  before update on pull_requests
  for each row execute function update_updated_at_column();

create trigger update_routing_rules_updated_at
  before update on routing_rules
  for each row execute function update_updated_at_column();

create trigger update_review_assignments_updated_at
  before update on review_assignments
  for each row execute function update_updated_at_column();

create trigger update_slack_integrations_updated_at
  before update on slack_integrations
  for each row execute function update_updated_at_column();

create trigger update_jira_integrations_updated_at
  before update on jira_integrations
  for each row execute function update_updated_at_column();

-- ====================
-- AUTO-CREATE ORG OWNER
-- ====================

create or replace function auto_create_org_owner()
returns trigger as $$
begin
  insert into organization_members (organization_id, user_id, role)
  values (new.id, auth.uid(), 'owner');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_organization_created
  after insert on organizations
  for each row execute function auto_create_org_owner();

