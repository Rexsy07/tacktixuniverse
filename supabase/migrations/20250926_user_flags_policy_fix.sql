-- Fix user_flags RLS to avoid recursion/visibility issues by using has_role()
-- Safe to run multiple times.

-- Ensure function exists
CREATE OR REPLACE FUNCTION public.has_role(p_role text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role::text = lower(p_role)
  );
$$;
GRANT EXECUTE ON FUNCTION public.has_role(text) TO anon, authenticated;

-- Drop previous admin policies if they exist
DROP POLICY IF EXISTS "Admins can view all flags" ON public.user_flags;
DROP POLICY IF EXISTS "Admins can manage flags" ON public.user_flags;

-- Recreate with has_role() to avoid policy-time table scans/recursion
CREATE POLICY "Admins can view all flags"
  ON public.user_flags FOR SELECT
  USING (public.has_role('admin'));

CREATE POLICY "Admins can manage flags"
  ON public.user_flags FOR ALL
  USING (public.has_role('admin'))
  WITH CHECK (public.has_role('admin'));

-- Keep user self-read policy (idempotent)
CREATE POLICY IF NOT EXISTS "Users can view their own flags"
  ON public.user_flags FOR SELECT
  USING (auth.uid() = user_id);

-- Ensure grants (RLS still applies)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_flags TO authenticated;