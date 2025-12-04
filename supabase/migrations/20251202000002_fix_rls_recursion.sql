-- =============================================
-- Fix infinite recursion in RLS policies
-- =============================================

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view members of their organizations" ON "public"."organization_members";
DROP POLICY IF EXISTS "Owners and admins can manage members" ON "public"."organization_members";

-- Create a security definer function to check membership without RLS
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

-- Create a security definer function to check admin/owner role
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

-- Recreate policies using the security definer functions
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

-- Also fix organizations policy that might have similar issues
DROP POLICY IF EXISTS "Users can view their organizations" ON "public"."organizations";

CREATE POLICY "Users can view their organizations"
ON "public"."organizations"
FOR SELECT
TO authenticated
USING (public.is_org_member(id, auth.uid()));

