-- Create platform_settings table with all required columns
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_percentage numeric(5,2) NOT NULL DEFAULT 5.00,
  maintenance_mode boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add maintenance_mode column if it doesn't exist (for existing installations)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'platform_settings' 
    AND column_name = 'maintenance_mode'
  ) THEN
    ALTER TABLE public.platform_settings ADD COLUMN maintenance_mode boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Add created_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'platform_settings' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.platform_settings ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "admins manage settings" ON public.platform_settings;
DROP POLICY IF EXISTS "admins read settings" ON public.platform_settings;

-- Create policies for admin access
CREATE POLICY "admins manage settings"
ON public.platform_settings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Allow authenticated users to read settings (for maintenance mode checks)
CREATE POLICY "authenticated read settings"
ON public.platform_settings FOR SELECT
USING (auth.role() = 'authenticated');

-- Create or update trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language plpgsql;

DROP TRIGGER IF EXISTS platform_settings_updated_at ON public.platform_settings;
CREATE TRIGGER platform_settings_updated_at
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Seed initial settings if table is empty
INSERT INTO public.platform_settings (fee_percentage, maintenance_mode)
SELECT 5.00, false
WHERE NOT EXISTS (SELECT 1 FROM public.platform_settings);