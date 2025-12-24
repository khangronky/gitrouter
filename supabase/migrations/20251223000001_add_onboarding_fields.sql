-- Add onboarding tracking fields to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.users.onboarding_completed IS 'Whether the user has completed the onboarding wizard';
COMMENT ON COLUMN public.users.onboarding_completed_at IS 'Timestamp when the user completed onboarding';


