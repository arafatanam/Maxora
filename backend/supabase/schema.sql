-- Maxora schema (fresh install). For an existing database, run migrations/2026-11-06-free-no-auth.sql instead.
-- No user accounts: every row belongs to a device id, a random UUID the app creates and keeps on the device.
-- Every table is locked by row-level security. Only the server (service role) reads or writes.

create table profiles(
  device_id text primary key,
  gender text,
  age_range text,
  main_goal text,
  age_confirmed boolean default false,
  consent_at timestamptz,
  onboarded boolean default false
);

create table scans(
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  front_path text,
  side_path text,
  status text default 'pending', -- pending until analysis succeeds, then complete
  overall numeric,
  potential numeric,
  tier text,
  psl text,
  result jsonb,
  created_at timestamptz default now()
);
create index scans_device_idx on scans(device_id, created_at desc);
create index scans_created_idx on scans(created_at) where front_path is not null;

create table plan_items(
  id uuid primary key default gen_random_uuid(),
  scan_id uuid references scans(id) on delete cascade,
  device_id text not null,
  category text, title text, reason text, effort text, impact text, time_to_result text,
  priority int,
  completed boolean default false
);

create table chat_messages(
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  scan_id uuid,
  role text,
  content text,
  created_at timestamptz default now()
);

-- Fixed-window rate limit counters. key = bucket:sha256(ip):window_start.
create table rate_limits(
  key text primary key,
  count int not null default 0,
  expires_at timestamptz not null
);

-- Atomically add one hit to a counter and return the new count.
create or replace function hit_rate_limit(p_key text, p_expires timestamptz)
returns int language sql security definer set search_path = public as $$
  insert into rate_limits(key, count, expires_at) values (p_key, 1, p_expires)
  on conflict (key) do update set count = rate_limits.count + 1
  returning count;
$$;
revoke execute on function hit_rate_limit(text, timestamptz) from public, anon, authenticated;

alter table profiles enable row level security;
alter table scans enable row level security;
alter table plan_items enable row level security;
alter table chat_messages enable row level security;
alter table rate_limits enable row level security;

-- Private photo bucket. Uploads go through one-time signed upload URLs that the server issues.
insert into storage.buckets(id, name, public) values ('photos', 'photos', false) on conflict do nothing;
