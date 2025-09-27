-- Ensure user_roles upsert works on user_id and allow admins to manage roles

-- 1) Make user_id unique so ON CONFLICT (user_id) is valid
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_user_id_key ON public.user_roles(user_id);

-- 2) Ensure RLS is enabled (no-op if already enabled)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3) Allow users to read their own role (idempotent)
CREATE POLICY IF NOT EXISTS "users view their own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- 4) Allow admins to manage user roles (insert/update/delete)
CREATE POLICY IF NOT EXISTS "admins can manage user roles"
  ON public.user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- 5) Grant privileges to authenticated (RLS still applies)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
