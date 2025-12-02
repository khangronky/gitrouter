-- =============================================
-- Migrate Jira integrations from API token to OAuth 2.0
-- =============================================

-- Step 1: Drop existing jira_integrations table and recreate with OAuth fields
-- Note: This will delete existing Jira integrations. Users will need to reconnect.

DROP TABLE IF EXISTS "public"."jira_integrations";

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
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE "public"."jira_integrations" ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX jira_integrations_pkey ON public.jira_integrations USING btree (id);
CREATE UNIQUE INDEX jira_integrations_org_key ON public.jira_integrations USING btree (organization_id);

ALTER TABLE "public"."jira_integrations" 
  ADD CONSTRAINT "jira_integrations_pkey" PRIMARY KEY USING INDEX "jira_integrations_pkey";

-- Row Level Security Policies
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

-- Grants
GRANT ALL ON TABLE "public"."jira_integrations" TO "service_role";
GRANT SELECT ON TABLE "public"."jira_integrations" TO "authenticated";

