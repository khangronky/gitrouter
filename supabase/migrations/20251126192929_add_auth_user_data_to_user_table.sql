-- Insert existing auth.users into public.users table
INSERT INTO public.users (id, email)
SELECT id, email
FROM auth.users
ON CONFLICT (id) DO NOTHING;
