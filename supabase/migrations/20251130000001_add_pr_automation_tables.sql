-- =============================================
-- PR Automation System - Core Tables
-- =============================================

-- Organizations table
create table "public"."organizations" (
  "id" uuid not null default gen_random_uuid(),
  "name" text not null,
  "slug" text not null,
  "created_by" uuid not null references public.users(id) on delete cascade,
  "default_reviewer_id" uuid,
  "settings" jsonb default '{}',
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now()
);

alter table "public"."organizations" enable row level security;
create unique index organizations_pkey on public.organizations using btree (id);
create unique index organizations_slug_key on public.organizations using btree (slug);
alter table "public"."organizations" add constraint "organizations_pkey" primary key using index "organizations_pkey";

-- Organization members (many-to-many with roles)
create type "public"."organization_role" as enum ('owner', 'admin', 'member');

create table "public"."organization_members" (
  "id" uuid not null default gen_random_uuid(),
  "organization_id" uuid not null references public.organizations(id) on delete cascade,
  "user_id" uuid not null references public.users(id) on delete cascade,
  "role" organization_role not null default 'member',
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now()
);

alter table "public"."organization_members" enable row level security;
create unique index organization_members_pkey on public.organization_members using btree (id);
create unique index organization_members_org_user_key on public.organization_members using btree (organization_id, user_id);
create index organization_members_user_id_idx on public.organization_members using btree (user_id);
alter table "public"."organization_members" add constraint "organization_members_pkey" primary key using index "organization_members_pkey";

-- Invitations
create type "public"."invitation_status" as enum ('pending', 'accepted', 'expired', 'cancelled');

create table "public"."invitations" (
  "id" uuid not null default gen_random_uuid(),
  "organization_id" uuid not null references public.organizations(id) on delete cascade,
  "email" text not null,
  "role" organization_role not null default 'member',
  "token" text not null,
  "status" invitation_status not null default 'pending',
  "invited_by" uuid not null references public.users(id) on delete cascade,
  "expires_at" timestamp with time zone not null,
  "accepted_at" timestamp with time zone,
  "created_at" timestamp with time zone not null default now()
);

alter table "public"."invitations" enable row level security;
create unique index invitations_pkey on public.invitations using btree (id);
create unique index invitations_token_key on public.invitations using btree (token);
create index invitations_email_idx on public.invitations using btree (email);
create index invitations_org_status_idx on public.invitations using btree (organization_id, status);
alter table "public"."invitations" add constraint "invitations_pkey" primary key using index "invitations_pkey";

-- GitHub installations
create table "public"."github_installations" (
  "id" uuid not null default gen_random_uuid(),
  "organization_id" uuid not null references public.organizations(id) on delete cascade,
  "installation_id" bigint not null,
  "account_login" text not null,
  "account_type" text not null, -- 'User' or 'Organization'
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now()
);

alter table "public"."github_installations" enable row level security;
create unique index github_installations_pkey on public.github_installations using btree (id);
create unique index github_installations_installation_id_key on public.github_installations using btree (installation_id);
create index github_installations_org_idx on public.github_installations using btree (organization_id);
alter table "public"."github_installations" add constraint "github_installations_pkey" primary key using index "github_installations_pkey";

-- Repositories
create table "public"."repositories" (
  "id" uuid not null default gen_random_uuid(),
  "organization_id" uuid not null references public.organizations(id) on delete cascade,
  "github_installation_id" uuid not null references public.github_installations(id) on delete cascade,
  "github_repo_id" bigint not null,
  "full_name" text not null, -- e.g., "owner/repo"
  "default_branch" text default 'main',
  "default_reviewer_id" uuid,
  "is_active" boolean not null default true,
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now()
);

alter table "public"."repositories" enable row level security;
create unique index repositories_pkey on public.repositories using btree (id);
create unique index repositories_github_repo_id_key on public.repositories using btree (github_repo_id);
create index repositories_org_idx on public.repositories using btree (organization_id);
create index repositories_full_name_idx on public.repositories using btree (full_name);
alter table "public"."repositories" add constraint "repositories_pkey" primary key using index "repositories_pkey";

-- Reviewers
create table "public"."reviewers" (
  "id" uuid not null default gen_random_uuid(),
  "organization_id" uuid not null references public.organizations(id) on delete cascade,
  "user_id" uuid references public.users(id) on delete set null,
  "name" text not null,
  "github_username" text,
  "slack_user_id" text,
  "email" text,
  "is_active" boolean not null default true,
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now()
);

alter table "public"."reviewers" enable row level security;
create unique index reviewers_pkey on public.reviewers using btree (id);
create index reviewers_org_idx on public.reviewers using btree (organization_id);
create index reviewers_github_username_idx on public.reviewers using btree (github_username);
alter table "public"."reviewers" add constraint "reviewers_pkey" primary key using index "reviewers_pkey";

-- Add foreign key for default_reviewer_id in organizations
alter table "public"."organizations" 
  add constraint "organizations_default_reviewer_fkey" 
  foreign key (default_reviewer_id) references public.reviewers(id) on delete set null;

-- Add foreign key for default_reviewer_id in repositories
alter table "public"."repositories" 
  add constraint "repositories_default_reviewer_fkey" 
  foreign key (default_reviewer_id) references public.reviewers(id) on delete set null;

-- Routing rules
create table "public"."routing_rules" (
  "id" uuid not null default gen_random_uuid(),
  "organization_id" uuid not null references public.organizations(id) on delete cascade,
  "repository_id" uuid references public.repositories(id) on delete cascade, -- null = applies to all repos
  "name" text not null,
  "description" text,
  "priority" integer not null default 0, -- lower = higher priority
  "is_active" boolean not null default true,
  "conditions" jsonb not null default '{}', -- file patterns, author rules, time rules
  "reviewer_ids" uuid[] not null default '{}', -- array of reviewer IDs
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now()
);

alter table "public"."routing_rules" enable row level security;
create unique index routing_rules_pkey on public.routing_rules using btree (id);
create index routing_rules_org_priority_idx on public.routing_rules using btree (organization_id, priority);
create index routing_rules_repo_idx on public.routing_rules using btree (repository_id);
alter table "public"."routing_rules" add constraint "routing_rules_pkey" primary key using index "routing_rules_pkey";

-- Pull requests
create type "public"."pr_status" as enum ('open', 'merged', 'closed');

create table "public"."pull_requests" (
  "id" uuid not null default gen_random_uuid(),
  "repository_id" uuid not null references public.repositories(id) on delete cascade,
  "github_pr_id" bigint not null,
  "github_pr_number" integer not null,
  "title" text not null,
  "body" text,
  "author_login" text not null,
  "author_id" bigint,
  "head_branch" text not null,
  "base_branch" text not null,
  "files_changed" text[] default '{}',
  "additions" integer default 0,
  "deletions" integer default 0,
  "status" pr_status not null default 'open',
  "html_url" text not null,
  "jira_ticket_id" text, -- extracted from title/body
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now(),
  "merged_at" timestamp with time zone,
  "closed_at" timestamp with time zone
);

alter table "public"."pull_requests" enable row level security;
create unique index pull_requests_pkey on public.pull_requests using btree (id);
create unique index pull_requests_repo_pr_id_key on public.pull_requests using btree (repository_id, github_pr_id);
create index pull_requests_repo_status_idx on public.pull_requests using btree (repository_id, status);
create index pull_requests_jira_ticket_idx on public.pull_requests using btree (jira_ticket_id);
alter table "public"."pull_requests" add constraint "pull_requests_pkey" primary key using index "pull_requests_pkey";

-- Review assignments
create type "public"."review_status" as enum ('pending', 'approved', 'changes_requested', 'commented', 'dismissed');

create table "public"."review_assignments" (
  "id" uuid not null default gen_random_uuid(),
  "pull_request_id" uuid not null references public.pull_requests(id) on delete cascade,
  "reviewer_id" uuid not null references public.reviewers(id) on delete cascade,
  "routing_rule_id" uuid references public.routing_rules(id) on delete set null,
  "status" review_status not null default 'pending',
  "slack_message_ts" text, -- for updating/threading messages
  "slack_channel_id" text,
  "notified_at" timestamp with time zone,
  "reminder_sent_at" timestamp with time zone,
  "reviewed_at" timestamp with time zone,
  "assigned_at" timestamp with time zone not null default now(),
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now()
);

alter table "public"."review_assignments" enable row level security;
create unique index review_assignments_pkey on public.review_assignments using btree (id);
create unique index review_assignments_pr_reviewer_key on public.review_assignments using btree (pull_request_id, reviewer_id);
create index review_assignments_status_idx on public.review_assignments using btree (status);
create index review_assignments_assigned_at_idx on public.review_assignments using btree (assigned_at);
alter table "public"."review_assignments" add constraint "review_assignments_pkey" primary key using index "review_assignments_pkey";

-- Escalations
create type "public"."escalation_level" as enum ('reminder_24h', 'alert_48h');

create table "public"."escalations" (
  "id" uuid not null default gen_random_uuid(),
  "review_assignment_id" uuid not null references public.review_assignments(id) on delete cascade,
  "level" escalation_level not null,
  "notified_user_ids" uuid[] default '{}', -- who was notified
  "slack_message_ts" text,
  "created_at" timestamp with time zone not null default now()
);

alter table "public"."escalations" enable row level security;
create unique index escalations_pkey on public.escalations using btree (id);
create index escalations_assignment_level_idx on public.escalations using btree (review_assignment_id, level);
alter table "public"."escalations" add constraint "escalations_pkey" primary key using index "escalations_pkey";

-- Slack integrations
create table "public"."slack_integrations" (
  "id" uuid not null default gen_random_uuid(),
  "organization_id" uuid not null references public.organizations(id) on delete cascade,
  "team_id" text not null,
  "team_name" text not null,
  "access_token" text not null, -- encrypted
  "bot_user_id" text,
  "incoming_webhook_url" text,
  "default_channel_id" text, -- for escalation alerts
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now()
);

alter table "public"."slack_integrations" enable row level security;
create unique index slack_integrations_pkey on public.slack_integrations using btree (id);
create unique index slack_integrations_org_key on public.slack_integrations using btree (organization_id);
alter table "public"."slack_integrations" add constraint "slack_integrations_pkey" primary key using index "slack_integrations_pkey";

-- Jira integrations
create table "public"."jira_integrations" (
  "id" uuid not null default gen_random_uuid(),
  "organization_id" uuid not null references public.organizations(id) on delete cascade,
  "domain" text not null, -- e.g., "company.atlassian.net"
  "email" text not null, -- API token auth email
  "api_token" text not null, -- encrypted
  "default_project_key" text,
  "status_on_merge" text, -- Jira status to set when PR is merged
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now()
);

alter table "public"."jira_integrations" enable row level security;
create unique index jira_integrations_pkey on public.jira_integrations using btree (id);
create unique index jira_integrations_org_key on public.jira_integrations using btree (organization_id);
alter table "public"."jira_integrations" add constraint "jira_integrations_pkey" primary key using index "jira_integrations_pkey";

-- Webhook events (idempotency)
create table "public"."webhook_events" (
  "id" uuid not null default gen_random_uuid(),
  "event_id" text not null, -- X-GitHub-Delivery header
  "event_type" text not null, -- e.g., "pull_request"
  "action" text, -- e.g., "opened", "closed"
  "repository_id" uuid references public.repositories(id) on delete cascade,
  "payload_hash" text, -- for debugging
  "processed_at" timestamp with time zone not null default now()
);

alter table "public"."webhook_events" enable row level security;
create unique index webhook_events_pkey on public.webhook_events using btree (id);
create unique index webhook_events_event_id_key on public.webhook_events using btree (event_id);
create index webhook_events_processed_at_idx on public.webhook_events using btree (processed_at);
alter table "public"."webhook_events" add constraint "webhook_events_pkey" primary key using index "webhook_events_pkey";

-- =============================================
-- Row Level Security Policies
-- =============================================

-- Organizations: users can see orgs they belong to
create policy "Users can view their organizations"
  on "public"."organizations"
  for select
  to authenticated
  using (
    exists (
      select 1 from public.organization_members
      where organization_members.organization_id = organizations.id
      and organization_members.user_id = auth.uid()
    )
  );

create policy "Owners and admins can update their organizations"
  on "public"."organizations"
  for update
  to authenticated
  using (
    exists (
      select 1 from public.organization_members
      where organization_members.organization_id = organizations.id
      and organization_members.user_id = auth.uid()
      and organization_members.role in ('owner', 'admin')
    )
  );

create policy "Users can create organizations"
  on "public"."organizations"
  for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "Only owners can delete organizations"
  on "public"."organizations"
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.organization_members
      where organization_members.organization_id = organizations.id
      and organization_members.user_id = auth.uid()
      and organization_members.role = 'owner'
    )
  );

-- Organization members: users can see members of orgs they belong to
create policy "Users can view members of their organizations"
  on "public"."organization_members"
  for select
  to authenticated
  using (
    exists (
      select 1 from public.organization_members as om
      where om.organization_id = organization_members.organization_id
      and om.user_id = auth.uid()
    )
  );

create policy "Owners and admins can manage members"
  on "public"."organization_members"
  for all
  to authenticated
  using (
    exists (
      select 1 from public.organization_members as om
      where om.organization_id = organization_members.organization_id
      and om.user_id = auth.uid()
      and om.role in ('owner', 'admin')
    )
  );

-- Invitations: owners and admins can manage
create policy "Owners and admins can manage invitations"
  on "public"."invitations"
  for all
  to authenticated
  using (
    exists (
      select 1 from public.organization_members
      where organization_members.organization_id = invitations.organization_id
      and organization_members.user_id = auth.uid()
      and organization_members.role in ('owner', 'admin')
    )
  );

-- Allow users to view invitations sent to their email
create policy "Users can view invitations for their email"
  on "public"."invitations"
  for select
  to authenticated
  using (
    email = (select email from auth.users where id = auth.uid())
  );

-- Repositories: users can see repos of their orgs
create policy "Users can view repositories of their organizations"
  on "public"."repositories"
  for select
  to authenticated
  using (
    exists (
      select 1 from public.organization_members
      where organization_members.organization_id = repositories.organization_id
      and organization_members.user_id = auth.uid()
    )
  );

create policy "Owners and admins can manage repositories"
  on "public"."repositories"
  for all
  to authenticated
  using (
    exists (
      select 1 from public.organization_members
      where organization_members.organization_id = repositories.organization_id
      and organization_members.user_id = auth.uid()
      and organization_members.role in ('owner', 'admin')
    )
  );

-- GitHub installations: owners and admins can manage
create policy "Owners and admins can manage GitHub installations"
  on "public"."github_installations"
  for all
  to authenticated
  using (
    exists (
      select 1 from public.organization_members
      where organization_members.organization_id = github_installations.organization_id
      and organization_members.user_id = auth.uid()
      and organization_members.role in ('owner', 'admin')
    )
  );

create policy "Users can view GitHub installations of their organizations"
  on "public"."github_installations"
  for select
  to authenticated
  using (
    exists (
      select 1 from public.organization_members
      where organization_members.organization_id = github_installations.organization_id
      and organization_members.user_id = auth.uid()
    )
  );

-- Reviewers: users can see reviewers of their orgs
create policy "Users can view reviewers of their organizations"
  on "public"."reviewers"
  for select
  to authenticated
  using (
    exists (
      select 1 from public.organization_members
      where organization_members.organization_id = reviewers.organization_id
      and organization_members.user_id = auth.uid()
    )
  );

create policy "Owners and admins can manage reviewers"
  on "public"."reviewers"
  for all
  to authenticated
  using (
    exists (
      select 1 from public.organization_members
      where organization_members.organization_id = reviewers.organization_id
      and organization_members.user_id = auth.uid()
      and organization_members.role in ('owner', 'admin')
    )
  );

-- Routing rules: owners and admins can manage
create policy "Users can view routing rules of their organizations"
  on "public"."routing_rules"
  for select
  to authenticated
  using (
    exists (
      select 1 from public.organization_members
      where organization_members.organization_id = routing_rules.organization_id
      and organization_members.user_id = auth.uid()
    )
  );

create policy "Owners and admins can manage routing rules"
  on "public"."routing_rules"
  for all
  to authenticated
  using (
    exists (
      select 1 from public.organization_members
      where organization_members.organization_id = routing_rules.organization_id
      and organization_members.user_id = auth.uid()
      and organization_members.role in ('owner', 'admin')
    )
  );

-- Pull requests: users can see PRs of repos in their orgs
create policy "Users can view pull requests of their organizations"
  on "public"."pull_requests"
  for select
  to authenticated
  using (
    exists (
      select 1 from public.repositories
      join public.organization_members on organization_members.organization_id = repositories.organization_id
      where repositories.id = pull_requests.repository_id
      and organization_members.user_id = auth.uid()
    )
  );

-- Review assignments: users can see assignments in their orgs
create policy "Users can view review assignments of their organizations"
  on "public"."review_assignments"
  for select
  to authenticated
  using (
    exists (
      select 1 from public.pull_requests
      join public.repositories on repositories.id = pull_requests.repository_id
      join public.organization_members on organization_members.organization_id = repositories.organization_id
      where pull_requests.id = review_assignments.pull_request_id
      and organization_members.user_id = auth.uid()
    )
  );

-- Escalations: users can see escalations in their orgs
create policy "Users can view escalations of their organizations"
  on "public"."escalations"
  for select
  to authenticated
  using (
    exists (
      select 1 from public.review_assignments
      join public.pull_requests on pull_requests.id = review_assignments.pull_request_id
      join public.repositories on repositories.id = pull_requests.repository_id
      join public.organization_members on organization_members.organization_id = repositories.organization_id
      where review_assignments.id = escalations.review_assignment_id
      and organization_members.user_id = auth.uid()
    )
  );

-- Slack integrations: owners and admins can manage
create policy "Users can view Slack integrations of their organizations"
  on "public"."slack_integrations"
  for select
  to authenticated
  using (
    exists (
      select 1 from public.organization_members
      where organization_members.organization_id = slack_integrations.organization_id
      and organization_members.user_id = auth.uid()
    )
  );

create policy "Owners and admins can manage Slack integrations"
  on "public"."slack_integrations"
  for all
  to authenticated
  using (
    exists (
      select 1 from public.organization_members
      where organization_members.organization_id = slack_integrations.organization_id
      and organization_members.user_id = auth.uid()
      and organization_members.role in ('owner', 'admin')
    )
  );

-- Jira integrations: owners and admins can manage
create policy "Users can view Jira integrations of their organizations"
  on "public"."jira_integrations"
  for select
  to authenticated
  using (
    exists (
      select 1 from public.organization_members
      where organization_members.organization_id = jira_integrations.organization_id
      and organization_members.user_id = auth.uid()
    )
  );

create policy "Owners and admins can manage Jira integrations"
  on "public"."jira_integrations"
  for all
  to authenticated
  using (
    exists (
      select 1 from public.organization_members
      where organization_members.organization_id = jira_integrations.organization_id
      and organization_members.user_id = auth.uid()
      and organization_members.role in ('owner', 'admin')
    )
  );

-- Webhook events: service role only (no user access needed)
-- Using service role for webhook processing

-- =============================================
-- Grants for service_role (for API routes)
-- =============================================

grant all on table "public"."organizations" to "service_role";
grant all on table "public"."organization_members" to "service_role";
grant all on table "public"."invitations" to "service_role";
grant all on table "public"."repositories" to "service_role";
grant all on table "public"."github_installations" to "service_role";
grant all on table "public"."reviewers" to "service_role";
grant all on table "public"."routing_rules" to "service_role";
grant all on table "public"."pull_requests" to "service_role";
grant all on table "public"."review_assignments" to "service_role";
grant all on table "public"."escalations" to "service_role";
grant all on table "public"."slack_integrations" to "service_role";
grant all on table "public"."jira_integrations" to "service_role";
grant all on table "public"."webhook_events" to "service_role";

-- Grants for authenticated users
grant select, insert, update, delete on table "public"."organizations" to "authenticated";
grant select, insert, update, delete on table "public"."organization_members" to "authenticated";
grant select, insert, update, delete on table "public"."invitations" to "authenticated";
grant select, insert, update, delete on table "public"."repositories" to "authenticated";
grant select on table "public"."github_installations" to "authenticated";
grant select, insert, update, delete on table "public"."reviewers" to "authenticated";
grant select, insert, update, delete on table "public"."routing_rules" to "authenticated";
grant select on table "public"."pull_requests" to "authenticated";
grant select on table "public"."review_assignments" to "authenticated";
grant select on table "public"."escalations" to "authenticated";
grant select on table "public"."slack_integrations" to "authenticated";
grant select on table "public"."jira_integrations" to "authenticated";

