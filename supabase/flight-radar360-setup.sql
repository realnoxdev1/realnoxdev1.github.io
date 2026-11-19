create table if not exists public.connected_aircraft (
  user_id uuid primary key references auth.users (id) on delete cascade,
  callsign text not null check (char_length(btrim(callsign)) between 1 and 24),
  departure_icao text not null check (departure_icao ~ '^[A-Z0-9]{4}$'),
  arrival_icao text not null check (arrival_icao ~ '^[A-Z0-9]{4}$'),
  squawk text check (squawk is null or squawk ~ '^[0-7]{4}$'),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  altitude_m double precision check (altitude_m is null or altitude_m between -1000 and 100000),
  updated_at timestamptz not null default now()
);

alter table public.connected_aircraft enable row level security;

revoke all on public.connected_aircraft from anon, authenticated;
grant select, insert, update, delete on public.connected_aircraft to authenticated;

drop policy if exists "Connected users read active aircraft" on public.connected_aircraft;
create policy "Connected users read active aircraft"
  on public.connected_aircraft
  for select
  to authenticated
  using (updated_at > now() - interval '45 seconds');

drop policy if exists "Users create their own aircraft record" on public.connected_aircraft;
create policy "Users create their own aircraft record"
  on public.connected_aircraft
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and updated_at > now() - interval '30 seconds'
    and updated_at <= now() + interval '30 seconds'
  );

drop policy if exists "Users update their own aircraft record" on public.connected_aircraft;
create policy "Users update their own aircraft record"
  on public.connected_aircraft
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and updated_at > now() - interval '30 seconds'
    and updated_at <= now() + interval '30 seconds'
  );

drop policy if exists "Users delete their own aircraft record" on public.connected_aircraft;
create policy "Users delete their own aircraft record"
  on public.connected_aircraft
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

create index if not exists connected_aircraft_updated_at_idx
  on public.connected_aircraft (updated_at desc);

create table if not exists public.member_activity_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  event_type text not null check (
    event_type in ('radar_open', 'connected_map_open', 'active_map_minute')
  ),
  occurred_at timestamptz not null default now()
);

create index if not exists member_activity_events_user_type_idx
  on public.member_activity_events (user_id, event_type, occurred_at desc);

alter table public.member_activity_events enable row level security;

revoke all on public.member_activity_events from anon, authenticated;
grant select on public.member_activity_events to authenticated;

drop policy if exists "Members read their own activity" on public.member_activity_events;
create policy "Members read their own activity"
  on public.member_activity_events
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    and (select auth.jwt() ->> 'is_anonymous') is distinct from 'true'
  );

create or replace function public.record_member_activity(p_event_type text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  event_cooldown interval;
begin
  if current_user_id is null
    or (select auth.jwt() ->> 'is_anonymous') = 'true' then
    raise exception 'A signed-in member account is required to record dashboard activity.';
  end if;

  if p_event_type not in ('radar_open', 'connected_map_open', 'active_map_minute') then
    raise exception 'Unsupported member activity event.';
  end if;

  event_cooldown := case
    when p_event_type = 'active_map_minute' then interval '50 seconds'
    else interval '10 seconds'
  end;

  perform pg_advisory_xact_lock(
    hashtext(current_user_id::text),
    hashtext(p_event_type)
  );

  if exists (
    select 1
    from public.member_activity_events
    where user_id = current_user_id
      and event_type = p_event_type
      and occurred_at > now() - event_cooldown
  ) then
    return false;
  end if;

  insert into public.member_activity_events (user_id, event_type)
  values (current_user_id, p_event_type);
  return true;
end;
$$;

revoke all on function public.record_member_activity(text) from public, anon;
grant execute on function public.record_member_activity(text) to authenticated;
