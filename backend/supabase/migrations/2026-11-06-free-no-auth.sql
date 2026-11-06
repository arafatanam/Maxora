-- Migrates an existing Maxora database to the free, sign-in-free version.
-- Run once in the Supabase SQL editor. Safe to re-run.
-- Existing rows keep their old e-mail/guest owner value in device_id. No device will ever match them,
-- so they stay hidden, and the daily cleanup still deletes their photos after 7 days.

do $$ begin
  if exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'user_email') then
    alter table profiles rename column user_email to device_id;
  end if;
  if exists (select 1 from information_schema.columns where table_name = 'scans' and column_name = 'user_email') then
    alter table scans rename column user_email to device_id;
  end if;
  if exists (select 1 from information_schema.columns where table_name = 'plan_items' and column_name = 'user_email') then
    alter table plan_items rename column user_email to device_id;
  end if;
  if exists (select 1 from information_schema.columns where table_name = 'chat_messages' and column_name = 'user_email') then
    alter table chat_messages rename column user_email to device_id;
  end if;
end $$;

alter table profiles drop column if exists keep_photos;
alter table scans alter column status set default 'pending';
drop table if exists subscriptions;

create index if not exists scans_device_idx on scans(device_id, created_at desc);
create index if not exists scans_created_idx on scans(created_at) where front_path is not null;

create table if not exists rate_limits(
  key text primary key,
  count int not null default 0,
  expires_at timestamptz not null
);
alter table rate_limits enable row level security;

create or replace function hit_rate_limit(p_key text, p_expires timestamptz)
returns int language sql security definer set search_path = public as $$
  insert into rate_limits(key, count, expires_at) values (p_key, 1, p_expires)
  on conflict (key) do update set count = rate_limits.count + 1
  returning count;
$$;
revoke execute on function hit_rate_limit(text, timestamptz) from public, anon, authenticated;

-- Uploads now use server-issued signed URLs, so the signed-in upload policy is no longer needed.
drop policy if exists "own uploads" on storage.objects;
