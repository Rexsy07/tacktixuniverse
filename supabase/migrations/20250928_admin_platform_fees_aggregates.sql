-- Admin platform fees aggregates and recent entries RPCs
-- File: supabase/migrations/20250928_admin_platform_fees_aggregates.sql

-- Summary: lifetime, today, last30days
CREATE OR REPLACE FUNCTION public.admin_platform_fees_summary()
RETURNS TABLE (
  lifetime numeric,
  today numeric,
  last30days numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today date := CURRENT_DATE;
  v_last30 timestamp with time zone := (now() - interval '30 days');
BEGIN
  RETURN QUERY
  SELECT
    COALESCE((SELECT SUM(fee_amount) FROM public.platform_fees), 0) AS lifetime,
    COALESCE((SELECT SUM(fee_amount) FROM public.platform_fees WHERE created_at >= v_today::timestamptz), 0) AS today,
    COALESCE((SELECT SUM(fee_amount) FROM public.platform_fees WHERE created_at >= v_last30), 0) AS last30days;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_platform_fees_summary() TO authenticated;

-- Recent entries with limit parameter (default 50)
CREATE OR REPLACE FUNCTION public.admin_platform_fees_recent(p_limit integer DEFAULT 50)
RETURNS TABLE (
  id uuid,
  match_id uuid,
  fee_amount numeric,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT id, match_id, fee_amount, created_at
  FROM public.platform_fees
  ORDER BY created_at DESC
  LIMIT COALESCE(p_limit, 50);
$$;

GRANT EXECUTE ON FUNCTION public.admin_platform_fees_recent(integer) TO authenticated;