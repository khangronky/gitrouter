-- Function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (
    new.id,
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

-- Function to handle user updates
create or replace function public.handle_user_update()
returns trigger as $$
begin
  update public.users
  set
    email = new.email
  where id = new.id;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger for user updates
create trigger on_auth_user_updated
  after update on auth.users
  for each row execute procedure public.handle_user_update();
