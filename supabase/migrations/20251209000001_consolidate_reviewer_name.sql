-- =============================================
-- Consolidate reviewer name to use users.full_name
-- =============================================
-- This migration:
-- 1. Ensures all reviewers have a linked user (creates users if needed)
-- 2. Makes user_id NOT NULL on reviewers
-- 3. Drops the redundant name column from reviewers

-- Step 1: Create users for any reviewers that don't have one
-- Use the reviewer's name as the user's full_name and generate a placeholder email
INSERT INTO users (id, email, full_name)
SELECT 
  gen_random_uuid(),
  'reviewer-' || r.id || '@placeholder.local',
  r.name
FROM reviewers r
WHERE r.user_id IS NULL
ON CONFLICT DO NOTHING;

-- Step 2: Link orphan reviewers to their newly created users
UPDATE reviewers r
SET user_id = u.id
FROM users u
WHERE r.user_id IS NULL
  AND u.email = 'reviewer-' || r.id || '@placeholder.local';

-- Step 3: For any reviewers that still don't have a user_id, 
-- try to match by name (case-insensitive)
UPDATE reviewers r
SET user_id = (
  SELECT u.id FROM users u 
  WHERE LOWER(u.full_name) = LOWER(r.name) 
  LIMIT 1
)
WHERE r.user_id IS NULL;

-- Step 4: Make user_id NOT NULL (will fail if any NULL values remain)
ALTER TABLE reviewers ALTER COLUMN user_id SET NOT NULL;

-- Step 5: Drop the name column (now redundant with users.full_name)
ALTER TABLE reviewers DROP COLUMN name;

