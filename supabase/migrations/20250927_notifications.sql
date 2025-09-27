-- Create notifications table to support broadcast (all users) and individual notifications
-- Use simple RLS policies: users can read audience='all' or their own targeted notifications; only admins can insert

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  title text not null,
  message text not null,
  audience text not null check (audience in ('all','user')),
  target_user_id uuid null references auth.users(id)
);

alter table public.notifications enable row level security;

-- Select policy: allow users to read broadcast or their own
create policy if not exists notifications_select_self_or_all
  on public.notifications for select
  using (
    audience = 'all' or (auth.uid() is not null and target_user_id = auth.uid())
  );

-- Insert policy: admins only
create policy if not exists notifications_insert_admin_only
  on public.notifications for insert
  with check (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  );

-- Optional: allow admins to select all (already allowed via select policy if admin isn't target). Add an explicit policy
create policy if not exists notifications_select_admin
  on public.notifications for select
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  );
