-- Advertise & Earn schema and policies
-- Run this SQL in Supabase (SQL editor or CLI). It creates the submissions table
-- with RLS so that users can submit/view their own entries and admins can review.

-- 0) Ensure required extension
create extension if not exists pgcrypto;

-- 1) Table
create table if not exists public.advertise_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null,
  url text not null,
  views integer not null default 0,
  status text not null default 'pending' check (status in ('pending','approved','rejected','paid')),
  rate_per_1000 numeric not null default 500,
  review_note text,
  reviewed_by uuid references auth.users(id),
  payout_week date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_adsub_user on public.advertise_submissions(user_id);
create index if not exists idx_adsub_status on public.advertise_submissions(status);
create index if not exists idx_adsub_created on public.advertise_submissions(created_at desc);

-- 2) Update timestamp trigger
create or replace function public.tg_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end; $$;

drop trigger if exists trg_adsub_touch_updated on public.advertise_submissions;
create trigger trg_adsub_touch_updated
before update on public.advertise_submissions
for each row execute function public.tg_touch_updated_at();

-- 3) RLS policies
alter table public.advertise_submissions enable row level security;

-- Helper: check if current user is admin based on user_roles table
-- This does not create tables; it only checks existing mapping if present.
-- If user_roles doesn't exist yet, you may need to create it separately.
-- Admins are users with role='admin'.

-- SELECT policy (owners or admins can read)
drop policy if exists adsub_select_self_or_admin on public.advertise_submissions;
create policy adsub_select_self_or_admin on public.advertise_submissions
for select using (
  user_id = auth.uid() OR exists(
    select 1 from public.user_roles r
    where r.user_id = auth.uid() and r.role = 'admin'
  )
);

-- INSERT policy (owners only)
drop policy if exists adsub_insert_self on public.advertise_submissions;
create policy adsub_insert_self on public.advertise_submissions
for insert with check (
  user_id = auth.uid()
);

-- UPDATE policy for owners (own rows while pending)
drop policy if exists adsub_update_own_pending on public.advertise_submissions;
create policy adsub_update_own_pending on public.advertise_submissions
for update using (
  user_id = auth.uid() and status = 'pending'
) with check (
  user_id = auth.uid() and status = 'pending'
);

-- UPDATE policy for admins (any row)
drop policy if exists adsub_update_admin on public.advertise_submissions;
create policy adsub_update_admin on public.advertise_submissions
for update using (
  exists(
    select 1 from public.user_roles r
    where r.user_id = auth.uid() and r.role = 'admin'
  )
) with check (true);

-- DELETE policy (admins only)
drop policy if exists adsub_delete_admin on public.advertise_submissions;
create policy adsub_delete_admin on public.advertise_submissions
for delete using (
  exists(
    select 1 from public.user_roles r
    where r.user_id = auth.uid() and r.role = 'admin'
  )
);

-- 4) Guard: prevent non-admins from changing status field (defense in depth)
create or replace function public.enforce_adsub_status_guard()
returns trigger language plpgsql as $$
begin
  if (new.status is distinct from old.status) then
    -- allow if admin
    if exists (
      select 1 from public.user_roles r
      where r.user_id = auth.uid() and r.role = 'admin'
    ) then
      return new;
    end if;
    -- otherwise, only allow status change when owner editing and keeping it same
    raise exception 'status_change_forbidden';
  end if;
  return new;
end; $$;

drop trigger if exists trg_adsub_status_guard on public.advertise_submissions;
create trigger trg_adsub_status_guard
before update on public.advertise_submissions
for each row execute function public.enforce_adsub_status_guard();
