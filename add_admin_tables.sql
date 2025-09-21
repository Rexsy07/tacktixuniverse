-- ============================================================================
-- Add missing tables for admin functionality
-- ============================================================================

-- Create platform_fees table for tracking fees
CREATE TABLE IF NOT EXISTS public.platform_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES public.matches(id) ON DELETE CASCADE,
  fee_amount numeric(12,2) NOT NULL DEFAULT 0.00,
  fee_percentage numeric(5,2) NOT NULL DEFAULT 5.00,
  match_stake_amount numeric(12,2) NOT NULL DEFAULT 0.00,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for platform_fees
CREATE INDEX IF NOT EXISTS platform_fees_match_id_idx ON public.platform_fees(match_id);
CREATE INDEX IF NOT EXISTS platform_fees_created_at_idx ON public.platform_fees(created_at DESC);

-- Create user_stats table if it doesn't exist 
-- (it exists in types.ts but may not be in database)
CREATE TABLE IF NOT EXISTS public.user_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  total_matches integer NOT NULL DEFAULT 0,
  total_wins integer NOT NULL DEFAULT 0,
  total_losses integer NOT NULL DEFAULT 0,
  total_draws integer NOT NULL DEFAULT 0,
  win_rate numeric(5,2) NULL,
  total_earnings numeric(12,2) NOT NULL DEFAULT 0.00,
  current_streak integer NOT NULL DEFAULT 0,
  longest_win_streak integer NOT NULL DEFAULT 0,
  current_rank integer NOT NULL DEFAULT 999999,
  favorite_game_id uuid NULL REFERENCES public.games(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for user_stats
CREATE INDEX IF NOT EXISTS user_stats_user_id_idx ON public.user_stats(user_id);
CREATE INDEX IF NOT EXISTS user_stats_current_rank_idx ON public.user_stats(current_rank);
CREATE INDEX IF NOT EXISTS user_stats_total_earnings_idx ON public.user_stats(total_earnings DESC);
CREATE INDEX IF NOT EXISTS user_stats_win_rate_idx ON public.user_stats(win_rate DESC);

-- Add updated_at trigger for platform_fees
CREATE TRIGGER set_updated_at_platform_fees BEFORE UPDATE ON public.platform_fees
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Add updated_at trigger for user_stats
CREATE TRIGGER set_updated_at_user_stats BEFORE UPDATE ON public.user_stats
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS
ALTER TABLE public.platform_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- RLS policies for platform_fees (admin only)
CREATE POLICY "Only admins can view platform fees"
  ON public.platform_fees FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can manage platform fees"
  ON public.platform_fees FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS policies for user_stats
CREATE POLICY "Users can view their own stats"
  ON public.user_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats"
  ON public.user_stats FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all user stats"
  ON public.user_stats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_fees TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_stats TO authenticated;

-- Create some sample platform fees from existing completed matches
INSERT INTO public.platform_fees (match_id, fee_amount, fee_percentage, match_stake_amount)
SELECT 
  id,
  stake_amount * 0.05 as fee_amount,
  5.00 as fee_percentage,
  stake_amount
FROM public.matches 
WHERE status = 'completed' AND stake_amount > 0
ON CONFLICT DO NOTHING;

-- Create user stats for existing users
INSERT INTO public.user_stats (user_id, total_matches, total_wins, total_losses, total_earnings)
SELECT 
  p.user_id,
  COALESCE(match_stats.total_matches, 0),
  COALESCE(match_stats.total_wins, 0),
  COALESCE(match_stats.total_losses, 0),
  COALESCE(wallet.balance, 0.00) as total_earnings
FROM public.profiles p
LEFT JOIN (
  SELECT 
    user_id,
    COUNT(*) as total_matches,
    COUNT(CASE WHEN winner_id = user_id THEN 1 END) as total_wins,
    COUNT(CASE WHEN winner_id != user_id AND winner_id IS NOT NULL THEN 1 END) as total_losses
  FROM (
    SELECT creator_id as user_id, winner_id FROM public.matches WHERE status = 'completed'
    UNION ALL
    SELECT opponent_id as user_id, winner_id FROM public.matches WHERE status = 'completed' AND opponent_id IS NOT NULL
  ) match_participation
  GROUP BY user_id
) match_stats ON p.user_id = match_stats.user_id
LEFT JOIN public.user_wallets wallet ON p.user_id = wallet.user_id
ON CONFLICT (user_id) DO UPDATE SET
  total_matches = EXCLUDED.total_matches,
  total_wins = EXCLUDED.total_wins,
  total_losses = EXCLUDED.total_losses,
  total_earnings = EXCLUDED.total_earnings,
  win_rate = CASE 
    WHEN EXCLUDED.total_matches > 0 
    THEN ROUND((EXCLUDED.total_wins::numeric / EXCLUDED.total_matches::numeric) * 100, 2)
    ELSE NULL 
  END,
  updated_at = now();