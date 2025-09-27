-- Robust role check helpers (no reset). Provides has_role() for the current user.
-- Safe to run multiple times.

create or replace function public.has_role(p_role text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role::text = lower(p_role)
  );
$$;

grant execute on function public.has_role(text) to anon, authenticated;

-- Optional: expose current role as text (first match if multiple)
create or replace function public.get_current_user_role()
returns text
language sql
security definer
set search_path = public
as $$
  select role::text
  from public.user_roles
  where user_id = auth.uid()
  order by created_at desc
  limit 1;
$$;

grant execute on function public.get_current_user_role() to anon, authenticated;
