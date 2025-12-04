-- =============================================
-- Auto-create organization when user registers
-- =============================================

-- Helper function to generate a unique slug from text
create or replace function public.generate_slug(input_text text)
returns text as $$
declare
  base_slug text;
  final_slug text;
  counter integer := 0;
begin
  -- Convert to lowercase, replace spaces with hyphens, remove special chars
  base_slug := lower(regexp_replace(input_text, '[^a-zA-Z0-9\s-]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  -- If empty, use 'team'
  if base_slug = '' then
    base_slug := 'team';
  end if;
  
  -- Add random suffix for uniqueness
  final_slug := base_slug || '-' || substr(md5(random()::text), 1, 6);
  
  return final_slug;
end;
$$ language plpgsql;

-- Update the handle_new_user function to also create an organization
create or replace function public.handle_new_user()
returns trigger as $$
declare
  org_name text;
  org_slug text;
  new_org_id uuid;
begin
  -- Insert into public.users
  insert into public.users (id, email)
  values (new.id, new.email);
  
  -- Generate organization name from email (use part before @)
  org_name := split_part(new.email, '@', 1) || '''s Team';
  org_slug := public.generate_slug(split_part(new.email, '@', 1));
  
  -- Create the user's default organization
  insert into public.organizations (id, name, slug, created_by)
  values (gen_random_uuid(), org_name, org_slug, new.id)
  returning id into new_org_id;
  
  -- Add user as owner of the organization
  insert into public.organization_members (organization_id, user_id, role)
  values (new_org_id, new.id, 'owner');
  
  return new;
end;
$$ language plpgsql security definer;

-- Note: The trigger on_auth_user_created already exists from previous migration
-- It will now use the updated function

