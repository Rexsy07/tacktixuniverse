-- Create user_flags table for suspension management
CREATE TABLE IF NOT EXISTS public.user_flags (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_suspended boolean NOT NULL DEFAULT false,
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure updated_at is maintained
CREATE TRIGGER set_updated_at_user_flags BEFORE UPDATE ON public.user_flags
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS
ALTER TABLE public.user_flags ENABLE ROW LEVEL SECURITY;

-- Policies: users can view their own flag
CREATE POLICY IF NOT EXISTS "Users can view their own flags"
  ON public.user_flags FOR SELECT
  USING (auth.uid() = user_id);

-- Policies: admins can view all flags
CREATE POLICY IF NOT EXISTS "Admins can view all flags"
  ON public.user_flags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policies: admins can manage flags
CREATE POLICY IF NOT EXISTS "Admins can manage flags"
  ON public.user_flags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Grants (RLS still applies)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_flags TO authenticated;
