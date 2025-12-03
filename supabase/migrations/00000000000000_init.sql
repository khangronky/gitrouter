-- =============================================
-- GitRouter Database Initialization
-- Complete schema for PR automation system
-- =============================================
-- This file consolidates all migrations into a single initialization script.
-- Use this for fresh database setup or reference.
-- =============================================

-- =============================================
-- 1. CUSTOM TYPES (ENUMS)
-- =============================================

-- Organization member roles
CREATE TYPE "public"."organization_role" AS ENUM ('owner', 'admin', 'member');

-- Pull request status
CREATE TYPE "public"."pr_status" AS ENUM ('open', 'merged', 'closed');

-- Review assignment status
CREATE TYPE "public"."review_status" AS ENUM ('pending', 'approved', 'changes_requested', 'commented', 'dismissed');

-- Escalation levels
CREATE TYPE "public"."escalation_level" AS ENUM ('reminder_24h', 'alert_48h');


-- =============================================
-- 2. TABLES
-- =============================================

-- -----------------------------------------
-- Users table (synced with auth.users)
-- -----------------------------------------
CREATE TABLE "public"."users" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "username" text,
  "email" text NOT NULL,
  "full_name" text,
  "github_user_id" bigint,
  "github_username" text,
  "slack_user_id" text,
  "slack_username" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE INDEX users_github_user_id_idx ON public.users USING btree (github_user_id);
CREATE INDEX users_slack_user_id_idx ON public.users USING btree (slack_user_id);

COMMENT ON COLUMN public.users.github_user_id IS 'GitHub numeric user ID';
COMMENT ON COLUMN public.users.github_username IS 'GitHub username (login)';
COMMENT ON COLUMN public.users.slack_user_id IS 'Slack user ID (e.g., U12345678)';
COMMENT ON COLUMN public.users.slack_username IS 'Slack display name or username';


-- -----------------------------------------
-- Organizations table
-- -----------------------------------------
CREATE TABLE "public"."organizations" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "created_by" uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  "default_reviewer_id" uuid,
  "settings" jsonb DEFAULT '{}',
  "notification_settings" jsonb NOT NULL DEFAULT '{
    "slack_notifications": true,
    "email_notifications": false,
    "escalation_destination": "channel",
    "notification_frequency": "realtime"
  }'::jsonb,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT "organizations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "organizations_slug_key" UNIQUE ("slug")
);

COMMENT ON COLUMN "public"."organizations"."notification_settings" IS 'Notification preferences: slack_notifications, email_notifications, escalation_destination (channel/dm), notification_frequency (realtime/batched/daily)';


-- -----------------------------------------
-- Organization members (many-to-many with roles)
-- -----------------------------------------
CREATE TABLE "public"."organization_members" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  "role" organization_role NOT NULL DEFAULT 'member',
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "organization_members_org_user_key" UNIQUE ("organization_id", "user_id")
);

CREATE INDEX organization_members_user_id_idx ON public.organization_members USING btree (user_id);


-- -----------------------------------------
-- GitHub installations
-- -----------------------------------------
CREATE TABLE "public"."github_installations" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  "installation_id" bigint NOT NULL,
  "account_login" text NOT NULL,
  "account_type" text NOT NULL, -- 'User' or 'Organization'
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT "github_installations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "github_installations_installation_id_key" UNIQUE ("installation_id")
);

CREATE INDEX github_installations_org_idx ON public.github_installations USING btree (organization_id);


-- -----------------------------------------
-- Repositories
-- -----------------------------------------
CREATE TABLE "public"."repositories" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  "github_installation_id" uuid NOT NULL REFERENCES public.github_installations(id) ON DELETE CASCADE,
  "github_repo_id" bigint NOT NULL,
  "full_name" text NOT NULL, -- e.g., "owner/repo"
  "default_branch" text DEFAULT 'main',
  "default_reviewer_id" uuid,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT "repositories_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "repositories_github_repo_id_key" UNIQUE ("github_repo_id")
);

CREATE INDEX repositories_org_idx ON public.repositories USING btree (organization_id);
CREATE INDEX repositories_full_name_idx ON public.repositories USING btree (full_name);


-- -----------------------------------------
-- Reviewers
-- -----------------------------------------
CREATE TABLE "public"."reviewers" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  "user_id" uuid REFERENCES public.users(id) ON DELETE SET NULL,
  "name" text NOT NULL,
  "github_username" text,
  "slack_user_id" text,
  "email" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT "reviewers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX reviewers_org_idx ON public.reviewers USING btree (organization_id);
CREATE INDEX reviewers_github_username_idx ON public.reviewers USING btree (github_username);


-- -----------------------------------------
-- Add foreign keys for default_reviewer_id
-- (After reviewers table exists)
-- -----------------------------------------
ALTER TABLE "public"."organizations" 
  ADD CONSTRAINT "organizations_default_reviewer_fkey" 
  FOREIGN KEY (default_reviewer_id) REFERENCES public.reviewers(id) ON DELETE SET NULL;

ALTER TABLE "public"."repositories" 
  ADD CONSTRAINT "repositories_default_reviewer_fkey" 
  FOREIGN KEY (default_reviewer_id) REFERENCES public.reviewers(id) ON DELETE SET NULL;


-- -----------------------------------------
-- Routing rules
-- -----------------------------------------
CREATE TABLE "public"."routing_rules" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  "repository_id" uuid REFERENCES public.repositories(id) ON DELETE CASCADE, -- null = applies to all repos
  "name" text NOT NULL,
  "description" text,
  "priority" integer NOT NULL DEFAULT 0, -- lower = higher priority
  "is_active" boolean NOT NULL DEFAULT true,
  "conditions" jsonb NOT NULL DEFAULT '{}', -- file patterns, author rules, time rules
  "reviewer_ids" uuid[] NOT NULL DEFAULT '{}', -- array of reviewer IDs
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT "routing_rules_pkey" PRIMARY KEY ("id")
);

CREATE INDEX routing_rules_org_priority_idx ON public.routing_rules USING btree (organization_id, priority);
CREATE INDEX routing_rules_repo_idx ON public.routing_rules USING btree (repository_id);


-- -----------------------------------------
-- Pull requests
-- -----------------------------------------
CREATE TABLE "public"."pull_requests" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "repository_id" uuid NOT NULL REFERENCES public.repositories(id) ON DELETE CASCADE,
  "github_pr_id" bigint NOT NULL,
  "github_pr_number" integer NOT NULL,
  "title" text NOT NULL,
  "body" text,
  "author_login" text NOT NULL,
  "author_id" bigint,
  "head_branch" text NOT NULL,
  "base_branch" text NOT NULL,
  "files_changed" text[] DEFAULT '{}',
  "additions" integer DEFAULT 0,
  "deletions" integer DEFAULT 0,
  "status" pr_status NOT NULL DEFAULT 'open',
  "html_url" text NOT NULL,
  "jira_ticket_id" text, -- extracted from title/body
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  "merged_at" timestamp with time zone,
  "closed_at" timestamp with time zone,
  
  CONSTRAINT "pull_requests_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "pull_requests_repo_pr_id_key" UNIQUE ("repository_id", "github_pr_id")
);

CREATE INDEX pull_requests_repo_status_idx ON public.pull_requests USING btree (repository_id, status);
CREATE INDEX pull_requests_jira_ticket_idx ON public.pull_requests USING btree (jira_ticket_id);


-- -----------------------------------------
-- Review assignments
-- -----------------------------------------
CREATE TABLE "public"."review_assignments" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "pull_request_id" uuid NOT NULL REFERENCES public.pull_requests(id) ON DELETE CASCADE,
  "reviewer_id" uuid NOT NULL REFERENCES public.reviewers(id) ON DELETE CASCADE,
  "routing_rule_id" uuid REFERENCES public.routing_rules(id) ON DELETE SET NULL,
  "status" review_status NOT NULL DEFAULT 'pending',
  "slack_message_ts" text, -- for updating/threading messages
  "slack_channel_id" text,
  "notified_at" timestamp with time zone,
  "reminder_sent_at" timestamp with time zone,
  "reviewed_at" timestamp with time zone,
  "assigned_at" timestamp with time zone NOT NULL DEFAULT now(),
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT "review_assignments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "review_assignments_pr_reviewer_key" UNIQUE ("pull_request_id", "reviewer_id")
);

CREATE INDEX review_assignments_status_idx ON public.review_assignments USING btree (status);
CREATE INDEX review_assignments_assigned_at_idx ON public.review_assignments USING btree (assigned_at);


-- -----------------------------------------
-- Escalations
-- -----------------------------------------
CREATE TABLE "public"."escalations" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "review_assignment_id" uuid NOT NULL REFERENCES public.review_assignments(id) ON DELETE CASCADE,
  "level" escalation_level NOT NULL,
  "notified_user_ids" uuid[] DEFAULT '{}', -- who was notified
  "slack_message_ts" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT "escalations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX escalations_assignment_level_idx ON public.escalations USING btree (review_assignment_id, level);


-- -----------------------------------------
-- Slack integrations
-- -----------------------------------------
CREATE TABLE "public"."slack_integrations" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  "team_id" text NOT NULL,
  "team_name" text NOT NULL,
  "access_token" text NOT NULL, -- encrypted
  "bot_user_id" text,
  "incoming_webhook_url" text,
  "default_channel_id" text, -- for escalation alerts
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT "slack_integrations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "slack_integrations_org_key" UNIQUE ("organization_id")
);


-- -----------------------------------------
-- Jira integrations (OAuth 2.0)
-- -----------------------------------------
CREATE TABLE "public"."jira_integrations" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  "cloud_id" text NOT NULL,
  "site_url" text NOT NULL,
  "site_name" text,
  "access_token" text NOT NULL,
  "refresh_token" text,
  "token_expires_at" timestamp with time zone,
  "default_project_key" text,
  "status_on_merge" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT "jira_integrations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "jira_integrations_org_key" UNIQUE ("organization_id")
);


-- -----------------------------------------
-- Webhook events (idempotency tracking)
-- -----------------------------------------
CREATE TABLE "public"."webhook_events" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "event_id" text NOT NULL, -- X-GitHub-Delivery header
  "event_type" text NOT NULL, -- e.g., "pull_request"
  "action" text, -- e.g., "opened", "closed"
  "repository_id" uuid REFERENCES public.repositories(id) ON DELETE CASCADE,
  "payload_hash" text, -- for debugging
  "processed_at" timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "webhook_events_event_id_key" UNIQUE ("event_id")
);

CREATE INDEX webhook_events_processed_at_idx ON public.webhook_events USING btree (processed_at);


-- =============================================
-- 3. HELPER FUNCTIONS
-- =============================================

-- -----------------------------------------
-- Generate unique slug from text
-- -----------------------------------------
CREATE OR REPLACE FUNCTION public.generate_slug(input_text text)
RETURNS text AS $$
DECLARE
  base_slug text;
  final_slug text;
BEGIN
  -- Convert to lowercase, replace spaces with hyphens, remove special chars
  base_slug := lower(regexp_replace(input_text, '[^a-zA-Z0-9\s-]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  -- If empty, use 'team'
  IF base_slug = '' THEN
    base_slug := 'team';
  END IF;
  
  -- Add random suffix for uniqueness
  final_slug := base_slug || '-' || substr(md5(random()::text), 1, 6);
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;


-- -----------------------------------------
-- Check organization membership (security definer to avoid RLS recursion)
-- -----------------------------------------
CREATE OR REPLACE FUNCTION public.is_org_member(org_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id AND organization_members.user_id = is_org_member.user_id
  );
$$;


-- -----------------------------------------
-- Check admin/owner role (security definer to avoid RLS recursion)
-- -----------------------------------------
CREATE OR REPLACE FUNCTION public.is_org_admin(org_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id 
    AND organization_members.user_id = is_org_admin.user_id
    AND role IN ('owner', 'admin')
  );
$$;


-- -----------------------------------------
-- Handle new user creation (syncs auth.users to public.users)
-- -----------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  org_name text;
  org_slug text;
  new_org_id uuid;
BEGIN
  -- Insert into public.users
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email);
  
  -- Generate organization name from email (use part before @)
  org_name := split_part(new.email, '@', 1) || '''s Team';
  org_slug := public.generate_slug(split_part(new.email, '@', 1));
  
  -- Create the user's default organization
  INSERT INTO public.organizations (id, name, slug, created_by)
  VALUES (gen_random_uuid(), org_name, org_slug, new.id)
  RETURNING id INTO new_org_id;
  
  -- Add user as owner of the organization
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (new_org_id, new.id, 'owner');
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- -----------------------------------------
-- Handle user updates (syncs auth.users changes to public.users)
-- -----------------------------------------
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS trigger AS $$
BEGIN
  UPDATE public.users
  SET email = new.email
  WHERE id = new.id;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =============================================
-- 4. TRIGGERS
-- =============================================

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger for user updates
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_user_update();


-- =============================================
-- 5. ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."organization_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."github_installations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."repositories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."reviewers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."routing_rules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."pull_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."review_assignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."escalations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."slack_integrations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."jira_integrations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."webhook_events" ENABLE ROW LEVEL SECURITY;


-- =============================================
-- 6. ROW LEVEL SECURITY POLICIES
-- =============================================

-- -----------------------------------------
-- Users policies
-- -----------------------------------------
CREATE POLICY "Enable read access for authenticated users"
ON "public"."users"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable update for users based on their uid"
ON "public"."users"
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING ((auth.uid() = id))
WITH CHECK ((auth.uid() = id));


-- -----------------------------------------
-- Organizations policies
-- -----------------------------------------
CREATE POLICY "Users can view their organizations"
ON "public"."organizations"
FOR SELECT
TO authenticated
USING (public.is_org_member(id, auth.uid()));

CREATE POLICY "Owners and admins can update their organizations"
ON "public"."organizations"
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_members.organization_id = organizations.id
    AND organization_members.user_id = auth.uid()
    AND organization_members.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Users can create organizations"
ON "public"."organizations"
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Only owners can delete organizations"
ON "public"."organizations"
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_members.organization_id = organizations.id
    AND organization_members.user_id = auth.uid()
    AND organization_members.role = 'owner'
  )
);


-- -----------------------------------------
-- Organization members policies
-- -----------------------------------------
CREATE POLICY "Users can view members of their organizations"
ON "public"."organization_members"
FOR SELECT
TO authenticated
USING (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY "Owners and admins can insert members"
ON "public"."organization_members"
FOR INSERT
TO authenticated
WITH CHECK (public.is_org_admin(organization_id, auth.uid()));

CREATE POLICY "Owners and admins can update members"
ON "public"."organization_members"
FOR UPDATE
TO authenticated
USING (public.is_org_admin(organization_id, auth.uid()));

CREATE POLICY "Owners and admins can delete members"
ON "public"."organization_members"
FOR DELETE
TO authenticated
USING (public.is_org_admin(organization_id, auth.uid()));


-- -----------------------------------------
-- GitHub installations policies
-- -----------------------------------------
CREATE POLICY "Users can view GitHub installations of their organizations"
ON "public"."github_installations"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_members.organization_id = github_installations.organization_id
    AND organization_members.user_id = auth.uid()
  )
);

CREATE POLICY "Owners and admins can manage GitHub installations"
ON "public"."github_installations"
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_members.organization_id = github_installations.organization_id
    AND organization_members.user_id = auth.uid()
    AND organization_members.role IN ('owner', 'admin')
  )
);


-- -----------------------------------------
-- Repositories policies
-- -----------------------------------------
CREATE POLICY "Users can view repositories of their organizations"
ON "public"."repositories"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_members.organization_id = repositories.organization_id
    AND organization_members.user_id = auth.uid()
  )
);

CREATE POLICY "Owners and admins can manage repositories"
ON "public"."repositories"
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_members.organization_id = repositories.organization_id
    AND organization_members.user_id = auth.uid()
    AND organization_members.role IN ('owner', 'admin')
  )
);


-- -----------------------------------------
-- Reviewers policies
-- -----------------------------------------
CREATE POLICY "Users can view reviewers of their organizations"
ON "public"."reviewers"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_members.organization_id = reviewers.organization_id
    AND organization_members.user_id = auth.uid()
  )
);

CREATE POLICY "Owners and admins can manage reviewers"
ON "public"."reviewers"
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_members.organization_id = reviewers.organization_id
    AND organization_members.user_id = auth.uid()
    AND organization_members.role IN ('owner', 'admin')
  )
);


-- -----------------------------------------
-- Routing rules policies
-- -----------------------------------------
CREATE POLICY "Users can view routing rules of their organizations"
ON "public"."routing_rules"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_members.organization_id = routing_rules.organization_id
    AND organization_members.user_id = auth.uid()
  )
);

CREATE POLICY "Owners and admins can manage routing rules"
ON "public"."routing_rules"
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_members.organization_id = routing_rules.organization_id
    AND organization_members.user_id = auth.uid()
    AND organization_members.role IN ('owner', 'admin')
  )
);


-- -----------------------------------------
-- Pull requests policies
-- -----------------------------------------
CREATE POLICY "Users can view pull requests of their organizations"
ON "public"."pull_requests"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.repositories
    JOIN public.organization_members ON organization_members.organization_id = repositories.organization_id
    WHERE repositories.id = pull_requests.repository_id
    AND organization_members.user_id = auth.uid()
  )
);


-- -----------------------------------------
-- Review assignments policies
-- -----------------------------------------
CREATE POLICY "Users can view review assignments of their organizations"
ON "public"."review_assignments"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pull_requests
    JOIN public.repositories ON repositories.id = pull_requests.repository_id
    JOIN public.organization_members ON organization_members.organization_id = repositories.organization_id
    WHERE pull_requests.id = review_assignments.pull_request_id
    AND organization_members.user_id = auth.uid()
  )
);


-- -----------------------------------------
-- Escalations policies
-- -----------------------------------------
CREATE POLICY "Users can view escalations of their organizations"
ON "public"."escalations"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.review_assignments
    JOIN public.pull_requests ON pull_requests.id = review_assignments.pull_request_id
    JOIN public.repositories ON repositories.id = pull_requests.repository_id
    JOIN public.organization_members ON organization_members.organization_id = repositories.organization_id
    WHERE review_assignments.id = escalations.review_assignment_id
    AND organization_members.user_id = auth.uid()
  )
);


-- -----------------------------------------
-- Slack integrations policies
-- -----------------------------------------
CREATE POLICY "Users can view Slack integrations of their organizations"
ON "public"."slack_integrations"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_members.organization_id = slack_integrations.organization_id
    AND organization_members.user_id = auth.uid()
  )
);

CREATE POLICY "Owners and admins can manage Slack integrations"
ON "public"."slack_integrations"
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_members.organization_id = slack_integrations.organization_id
    AND organization_members.user_id = auth.uid()
    AND organization_members.role IN ('owner', 'admin')
  )
);


-- -----------------------------------------
-- Jira integrations policies
-- -----------------------------------------
CREATE POLICY "Users can view Jira integrations of their organizations"
ON "public"."jira_integrations"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_members.organization_id = jira_integrations.organization_id
    AND organization_members.user_id = auth.uid()
  )
);

CREATE POLICY "Owners and admins can manage Jira integrations"
ON "public"."jira_integrations"
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_members.organization_id = jira_integrations.organization_id
    AND organization_members.user_id = auth.uid()
    AND organization_members.role IN ('owner', 'admin')
  )
);


-- =============================================
-- 7. GRANTS
-- =============================================

-- -----------------------------------------
-- service_role grants (full access for API routes)
-- -----------------------------------------
GRANT ALL ON TABLE "public"."users" TO "service_role";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";
GRANT ALL ON TABLE "public"."organization_members" TO "service_role";
GRANT ALL ON TABLE "public"."github_installations" TO "service_role";
GRANT ALL ON TABLE "public"."repositories" TO "service_role";
GRANT ALL ON TABLE "public"."reviewers" TO "service_role";
GRANT ALL ON TABLE "public"."routing_rules" TO "service_role";
GRANT ALL ON TABLE "public"."pull_requests" TO "service_role";
GRANT ALL ON TABLE "public"."review_assignments" TO "service_role";
GRANT ALL ON TABLE "public"."escalations" TO "service_role";
GRANT ALL ON TABLE "public"."slack_integrations" TO "service_role";
GRANT ALL ON TABLE "public"."jira_integrations" TO "service_role";
GRANT ALL ON TABLE "public"."webhook_events" TO "service_role";


-- -----------------------------------------
-- authenticated user grants
-- -----------------------------------------
GRANT SELECT ON TABLE "public"."users" TO "authenticated";
GRANT UPDATE ON TABLE "public"."users" TO "authenticated";

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."organizations" TO "authenticated";
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."organization_members" TO "authenticated";
GRANT SELECT ON TABLE "public"."github_installations" TO "authenticated";
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."repositories" TO "authenticated";
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."reviewers" TO "authenticated";
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."routing_rules" TO "authenticated";
GRANT SELECT ON TABLE "public"."pull_requests" TO "authenticated";
GRANT SELECT ON TABLE "public"."review_assignments" TO "authenticated";
GRANT SELECT ON TABLE "public"."escalations" TO "authenticated";
GRANT SELECT ON TABLE "public"."slack_integrations" TO "authenticated";
GRANT SELECT ON TABLE "public"."jira_integrations" TO "authenticated";


-- -----------------------------------------
-- anon grants (for public access if needed)
-- -----------------------------------------
GRANT DELETE ON TABLE "public"."users" TO "anon";
GRANT INSERT ON TABLE "public"."users" TO "anon";
GRANT REFERENCES ON TABLE "public"."users" TO "anon";
GRANT SELECT ON TABLE "public"."users" TO "anon";
GRANT TRIGGER ON TABLE "public"."users" TO "anon";
GRANT TRUNCATE ON TABLE "public"."users" TO "anon";
GRANT UPDATE ON TABLE "public"."users" TO "anon";


-- =============================================
-- END OF INITIALIZATION SCRIPT
-- =============================================


