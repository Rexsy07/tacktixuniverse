-- Fix recursion on user_roles policies by moving admin actions to RPCs
-- Safe: no resets, idempotent where possible

-- 1) Drop recursive policy if it exists
DROP POLICY IF EXISTS "admins can manage user roles" ON public.user_roles;

-- 2) RPC: admin_set_user_role - promote/demote via security definer
CREATE OR REPLACE FUNCTION public.admin_set_user_role(
  p_target_user_id uuid,
  p_role public.app_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow if the caller is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_target_user_id, p_role)
  ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_user_role(uuid, public.app_role) TO authenticated;

-- 3) RPC: admin_get_user_roles - fetch roles for a list of users as admin
CREATE OR REPLACE FUNCTION public.admin_get_user_roles(
  p_user_ids uuid[]
)
RETURNS SETOF public.user_roles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow if the caller is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT *
  FROM public.user_roles
  WHERE user_id = ANY(p_user_ids);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_user_roles(uuid[]) TO authenticated;
