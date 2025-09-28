-- Admin tournament revenue helpers
-- File: supabase/migrations/20250928_admin_tournament_revenue.sql

-- Lifetime tournament revenue: sum(GREATEST(0, participants * entry_fee - prize_pool)) across all tournaments
CREATE OR REPLACE FUNCTION public.admin_tournament_revenue_lifetime()
RETURNS numeric
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH tp AS (
    SELECT
      t.id,
      COALESCE(t.current_participants, (
        SELECT COUNT(*) FROM public.tournament_participants p WHERE p.tournament_id = t.id
      ))::numeric AS participants,
      COALESCE(t.entry_fee, 0)::numeric AS entry_fee,
      COALESCE(t.prize_pool, 0)::numeric AS prize_pool
    FROM public.tournaments t
  )
  SELECT COALESCE(SUM(GREATEST(0, participants * entry_fee - prize_pool)), 0) FROM tp;
$$;

GRANT EXECUTE ON FUNCTION public.admin_tournament_revenue_lifetime() TO authenticated;