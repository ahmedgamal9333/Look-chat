-- LookChat uses the existing Supabase schema provisioned for this project:
-- profiles, location_presence, conversations, conversation_members, messages,
-- plus nearby_people(radius_m), set_my_presence(lat, lon, visible), and
-- open_conversation(target_user_id).
-- This migration adds the missing least-privilege permission for a signed-in
-- user to create their own profile row on first use.
grant insert on table public.profiles to authenticated;
drop policy if exists "users insert own profile" on public.profiles;
create policy "users insert own profile"
on public.profiles for insert to authenticated
with check ((select auth.uid()) = id);
