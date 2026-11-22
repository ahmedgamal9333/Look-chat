-- LookChat initial secure schema
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  is_visible boolean not null default false,
  latitude double precision,
  longitude double precision,
  updated_at timestamptz not null default now(),
  constraint profiles_latitude_range check (latitude is null or latitude between -90 and 90),
  constraint profiles_longitude_range check (longitude is null or longitude between -180 and 180)
);
alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
drop policy if exists "profile owner can read" on public.profiles;
create policy "profile owner can read" on public.profiles for select to authenticated using ((select auth.uid()) = id);
drop policy if exists "profile owner can insert" on public.profiles;
create policy "profile owner can insert" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
drop policy if exists "profile owner can update" on public.profiles;
create policy "profile owner can update" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create or replace function public.set_my_presence(
  p_display_name text, p_is_visible boolean, p_latitude double precision default null, p_longitude double precision default null
) returns void language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if length(trim(coalesce(p_display_name,''))) < 1 or length(trim(p_display_name)) > 40 then raise exception 'Display name must be 1-40 characters'; end if;
  if p_is_visible and (p_latitude is null or p_longitude is null or p_latitude not between -90 and 90 or p_longitude not between -180 and 180) then raise exception 'Valid location required when visible'; end if;
  insert into public.profiles(id, display_name, is_visible, latitude, longitude, updated_at)
  values (v_uid, trim(p_display_name), p_is_visible, case when p_is_visible then p_latitude else null end, case when p_is_visible then p_longitude else null end, now())
  on conflict (id) do update set display_name=excluded.display_name, is_visible=excluded.is_visible,
    latitude=excluded.latitude, longitude=excluded.longitude, updated_at=now();
end; $$;

create or replace function public.nearby_people(
  p_latitude double precision, p_longitude double precision, p_radius_m integer default 10000
) returns table(user_id uuid, display_name text, avatar_url text, distance_m integer)
language plpgsql stable security definer set search_path = '' as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if p_latitude is null or p_longitude is null or p_latitude not between -90 and 90 or p_longitude not between -180 and 180 then raise exception 'Invalid coordinates'; end if;
  if p_radius_m < 1 or p_radius_m > 500000 then raise exception 'Radius must be between 1 and 500000 meters'; end if;
  return query
  select p.id, p.display_name, p.avatar_url,
    round(6371000 * 2 * asin(sqrt(
      power(sin(radians(p.latitude - p_latitude)/2),2) +
      cos(radians(p_latitude))*cos(radians(p.latitude))*
      power(sin(radians(p.longitude - p_longitude)/2),2)
    )))::integer as distance_m
  from public.profiles p
  where p.id <> v_uid and p.is_visible = true and p.latitude is not null and p.longitude is not null
    and 6371000 * 2 * asin(sqrt(
      power(sin(radians(p.latitude - p_latitude)/2),2) +
      cos(radians(p_latitude))*cos(radians(p.latitude))*
      power(sin(radians(p.longitude - p_longitude)/2),2)
    )) <= p_radius_m
  order by distance_m asc
  limit 200;
end; $$;

revoke all on function public.set_my_presence(text, boolean, double precision, double precision) from public, anon;
revoke all on function public.nearby_people(double precision, double precision, integer) from public, anon;
grant execute on function public.set_my_presence(text, boolean, double precision, double precision) to authenticated;
grant execute on function public.nearby_people(double precision, double precision, integer) to authenticated;
