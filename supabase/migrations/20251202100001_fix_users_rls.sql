-- =============================================
-- Fix Users table RLS for invitation checks
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON "public"."users";
DROP POLICY IF EXISTS "Enable update for users based on their uid" ON "public"."users";

-- Recreate the read policy
CREATE POLICY "Enable read access for authenticated users"
ON "public"."users"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);

-- Recreate the update policy  
CREATE POLICY "Enable update for users based on their uid"
ON "public"."users"
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING ((auth.uid() = id))
WITH CHECK ((auth.uid() = id));

-- Ensure grants are in place
GRANT SELECT ON TABLE "public"."users" TO authenticated;
GRANT SELECT ON TABLE "public"."users" TO service_role;

