-- =============================================
-- Backfill organizations for existing users who don't have one
-- =============================================

-- Create organizations for users who don't have any membership
DO $$
DECLARE
  user_record RECORD;
  org_name text;
  org_slug text;
  new_org_id uuid;
BEGIN
  -- Find users without any organization membership
  FOR user_record IN 
    SELECT u.id, u.email 
    FROM public.users u
    LEFT JOIN public.organization_members om ON u.id = om.user_id
    WHERE om.id IS NULL
  LOOP
    -- Generate organization name and slug
    org_name := split_part(user_record.email, '@', 1) || '''s Team';
    org_slug := lower(regexp_replace(split_part(user_record.email, '@', 1), '[^a-zA-Z0-9]', '', 'g'));
    
    -- Add random suffix for uniqueness
    org_slug := org_slug || '-' || substr(md5(random()::text), 1, 6);
    
    -- Handle empty slug
    IF org_slug = '' OR org_slug IS NULL THEN
      org_slug := 'team-' || substr(md5(random()::text), 1, 6);
    END IF;
    
    -- Create the organization
    INSERT INTO public.organizations (id, name, slug, created_by)
    VALUES (gen_random_uuid(), org_name, org_slug, user_record.id)
    RETURNING id INTO new_org_id;
    
    -- Add user as owner
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (new_org_id, user_record.id, 'owner');
    
    RAISE NOTICE 'Created organization % for user %', org_name, user_record.email;
  END LOOP;
END $$;

