-- =============================================
-- Drop invitations table (no longer needed)
-- Members are now added directly by email
-- =============================================

-- Drop policies first
DROP POLICY IF EXISTS "Owners and admins can manage invitations" ON "public"."invitations";
DROP POLICY IF EXISTS "Users can view invitations for their email" ON "public"."invitations";

-- Drop the table
DROP TABLE IF EXISTS "public"."invitations";

-- Drop the invitation status enum type
DROP TYPE IF EXISTS "public"."invitation_status";

