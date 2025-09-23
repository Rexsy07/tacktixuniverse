-- Check if platform_settings table exists and show its structure
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'platform_settings'
ORDER BY ordinal_position;

-- Show current platform settings data
SELECT * FROM public.platform_settings ORDER BY updated_at DESC;

-- Show RLS policies on the table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'platform_settings';