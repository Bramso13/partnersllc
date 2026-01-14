-- =========================================================
-- AUTO-CREATE PROFILE ON USER SIGNUP
-- =========================================================
-- This trigger automatically creates a profile in public.profiles
-- when a new user signs up via auth.users

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, status, created_at, updated_at)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    'PENDING',
    now(),
    now()
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger on auth.users insert
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================
-- COMMENTS
-- =========================================================
comment on function public.handle_new_user() is 'Automatically creates a profile when a user signs up';
