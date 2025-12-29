-- Fix RLS policies to account for soft-deleted records

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view pull requests of their organizations" ON "public"."pull_requests";
DROP POLICY IF EXISTS "Users can view review assignments of their organizations" ON "public"."review_assignments";
DROP POLICY IF EXISTS "Users can view escalations of their organizations" ON "public"."escalations";

-- Recreate pull_requests policy with soft-delete filter
CREATE POLICY "Users can view pull requests of their organizations"
  ON "public"."pull_requests"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.repositories
      JOIN public.organization_members ON organization_members.organization_id = repositories.organization_id
      WHERE repositories.id = pull_requests.repository_id
      AND repositories.deleted_at IS NULL
      AND organization_members.user_id = auth.uid()
      AND organization_members.deleted_at IS NULL
    )
  );

-- Recreate review_assignments policy with soft-delete filter
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
      AND repositories.deleted_at IS NULL
      AND organization_members.user_id = auth.uid()
      AND organization_members.deleted_at IS NULL
    )
  );

-- Recreate escalations policy with soft-delete filter
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
      AND repositories.deleted_at IS NULL
      AND organization_members.user_id = auth.uid()
      AND organization_members.deleted_at IS NULL
    )
  );

