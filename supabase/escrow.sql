-- Escrow wallet handling for matches
-- Creates wallet_holds table and RPC functions to hold funds on match create and accept

-- 1) Table: wallet_holds
CREATE TABLE IF NOT EXISTS public.wallet_holds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'held', -- 'held' | 'released' | 'refunded' | 'cancelled'
  created_at timestamptz NOT NULL DEFAULT now(),
  released_at timestamptz NULL,
  UNIQUE (match_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS wallet_holds_match_idx ON public.wallet_holds(match_id);
CREATE INDEX IF NOT EXISTS wallet_holds_user_idx ON public.wallet_holds(user_id);

-- RLS
ALTER TABLE public.wallet_holds ENABLE ROW LEVEL SECURITY;

-- Create RLS policies only if they don't already exist
DO $plpgsql$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'wallet_holds'
      AND policyname = 'users view their own holds'
  ) THEN
    EXECUTE $sql$
      CREATE POLICY "users view their own holds"
        ON public.wallet_holds FOR SELECT
        TO authenticated
        USING (auth.uid() = user_id);
    $sql$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'wallet_holds'
      AND policyname = 'users manage their own holds'
  ) THEN
    EXECUTE $sql$
      CREATE POLICY "users manage their own holds"
        ON public.wallet_holds FOR ALL
        TO authenticated
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    $sql$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'wallet_holds'
      AND policyname = 'admins manage holds'
  ) THEN
    EXECUTE $sql$
      CREATE POLICY "admins manage holds"
        ON public.wallet_holds FOR ALL
        TO authenticated
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
    $sql$;
  END IF;
END
$plpgsql$;

-- 2) Helper: assert balance and create hold + pending transaction
CREATE OR REPLACE FUNCTION public._assert_balance_and_hold(
  p_user_id uuid,
  p_match_id uuid,
  p_amount numeric,
  p_reference text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance numeric;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'INVALID_AMOUNT';
  END IF;

  -- Lock the wallet row and read balance
  SELECT balance INTO v_balance
  FROM public.user_wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'WALLET_NOT_FOUND';
  END IF;

  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'INSUFFICIENT_FUNDS';
  END IF;

  -- Deduct balance
  UPDATE public.user_wallets
  SET balance = balance - p_amount, updated_at = now()
  WHERE user_id = p_user_id;

  -- Create hold (idempotent per match+user)
  INSERT INTO public.wallet_holds(match_id, user_id, amount, status)
  VALUES (p_match_id, p_user_id, p_amount, 'held')
  ON CONFLICT (match_id, user_id) DO NOTHING;

  -- Create a pending transaction representing the hold (negative amount)
  INSERT INTO public.transactions(user_id, amount, type, reference_code, description, status, metadata)
  VALUES (p_user_id, -p_amount, 'match_loss', p_reference, 'Match escrow hold', 'pending', jsonb_build_object('match_id', p_match_id));
END;
$$;

GRANT EXECUTE ON FUNCTION public._assert_balance_and_hold(uuid, uuid, numeric, text) TO authenticated;

-- 3) RPC: create_match_with_escrow
CREATE OR REPLACE FUNCTION public.create_match_with_escrow(
  p_creator_id uuid,
  p_game_id uuid,
  p_game_mode_id uuid,
  p_format text,
  p_map_name text,
  p_stake_amount numeric,
  p_duration_minutes integer,
  p_custom_rules text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_match_id uuid;
BEGIN
  -- Create match row
  INSERT INTO public.matches(
    creator_id, game_id, game_mode_id, format, map_name,
    stake_amount, duration_minutes, custom_rules, status
  ) VALUES (
    p_creator_id, p_game_id, p_game_mode_id, p_format, p_map_name,
    p_stake_amount, p_duration_minutes, p_custom_rules, 'awaiting_opponent'
  ) RETURNING id INTO v_match_id;

  -- Hold creator's stake
  PERFORM public._assert_balance_and_hold(p_creator_id, v_match_id, p_stake_amount, 'HOLD-' || v_match_id || '-A');

  -- Add creator as team A captain
  INSERT INTO public.match_participants(match_id, user_id, team, role)
  VALUES (v_match_id, p_creator_id, 'A', 'captain')
  ON CONFLICT DO NOTHING;

  RETURN v_match_id;
EXCEPTION WHEN others THEN
  -- Cleanup on failure
  IF v_match_id IS NOT NULL THEN
    DELETE FROM public.matches WHERE id = v_match_id;
  END IF;
  RAISE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_match_with_escrow(uuid, uuid, uuid, text, text, numeric, integer, text) TO authenticated;

-- 4) RPC: accept_challenge_with_escrow (1v1)
CREATE OR REPLACE FUNCTION public.accept_challenge_with_escrow(
  p_match_id uuid,
  p_user_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_status public.match_status;
  v_opponent uuid;
  v_creator uuid;
  v_stake numeric;
BEGIN
  -- Load and validate match
  SELECT status, opponent_id, creator_id, stake_amount
  INTO v_status, v_opponent, v_creator, v_stake
  FROM public.matches
  WHERE id = p_match_id
  FOR UPDATE; -- lock the row while we update

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'MATCH_NOT_FOUND';
  END IF;
  IF v_status <> 'awaiting_opponent' OR v_opponent IS NOT NULL THEN
    RAISE EXCEPTION 'MATCH_NOT_AVAILABLE';
  END IF;
  IF v_creator = p_user_id THEN
    RAISE EXCEPTION 'CANNOT_ACCEPT_OWN_MATCH';
  END IF;

  -- Hold opponent's stake
  PERFORM public._assert_balance_and_hold(p_user_id, p_match_id, v_stake, 'HOLD-' || p_match_id || '-B');

  -- Set opponent and start match
  UPDATE public.matches
  SET opponent_id = p_user_id,
      accepted_at = now(),
      status = 'in_progress'
  WHERE id = p_match_id;

  -- Insert opponent as team B captain (for 1v1)
  INSERT INTO public.match_participants(match_id, user_id, team, role)
  VALUES (p_match_id, p_user_id, 'B', 'captain')
  ON CONFLICT DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_challenge_with_escrow(uuid, uuid) TO authenticated;

-- 5) RPC: accept_team_challenge_with_escrow (captain + optional members)
CREATE OR REPLACE FUNCTION public.accept_team_challenge_with_escrow(
  p_match_id uuid,
  p_captain_id uuid,
  p_team_members uuid[]
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_status public.match_status;
  v_opponent uuid;
  v_creator uuid;
  v_stake numeric;
BEGIN
  -- Load and validate match
  SELECT status, opponent_id, creator_id, stake_amount
  INTO v_status, v_opponent, v_creator, v_stake
  FROM public.matches
  WHERE id = p_match_id
  FOR UPDATE;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'MATCH_NOT_FOUND';
  END IF;
  IF v_status <> 'awaiting_opponent' OR v_opponent IS NOT NULL THEN
    RAISE EXCEPTION 'MATCH_NOT_AVAILABLE';
  END IF;
  IF v_creator = p_captain_id THEN
    RAISE EXCEPTION 'CANNOT_ACCEPT_OWN_MATCH';
  END IF;

  -- Hold captain's stake
  PERFORM public._assert_balance_and_hold(p_captain_id, p_match_id, v_stake, 'HOLD-' || p_match_id || '-B');

  -- Update match to in_progress
  UPDATE public.matches
  SET opponent_id = p_captain_id,
      status = 'in_progress',
      started_at = now()
  WHERE id = p_match_id;

  -- Add captain and members to team B
  INSERT INTO public.match_participants(match_id, user_id, team, role)
  VALUES (p_match_id, p_captain_id, 'B', 'captain')
  ON CONFLICT DO NOTHING;

  IF p_team_members IS NOT NULL AND array_length(p_team_members, 1) IS NOT NULL THEN
    INSERT INTO public.match_participants(match_id, user_id, team, role)
    SELECT p_match_id, m, 'B', 'member' FROM unnest(p_team_members) AS m
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_team_challenge_with_escrow(uuid, uuid, uuid[]) TO authenticated;

-- 6) RPC: cancel_match_escrow - refund any holds and cancel match
CREATE OR REPLACE FUNCTION public.cancel_match_escrow(
  p_match_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  r_hold RECORD;
BEGIN
  FOR r_hold IN SELECT * FROM public.wallet_holds WHERE match_id = p_match_id AND status = 'held' LOOP
    -- Refund balance
    UPDATE public.user_wallets
    SET balance = balance + r_hold.amount, updated_at = now()
    WHERE user_id = r_hold.user_id;

    -- Mark hold as refunded
    UPDATE public.wallet_holds
    SET status = 'refunded', released_at = now()
    WHERE id = r_hold.id;

    -- Mark pending hold transaction as cancelled and add refund transaction
    UPDATE public.transactions
    SET status = 'cancelled', processed_at = now()
    WHERE user_id = r_hold.user_id
      AND metadata->>'match_id' = p_match_id::text
      AND status = 'pending'
      AND type = 'match_loss';

    INSERT INTO public.transactions(user_id, amount, type, reference_code, description, status, metadata)
    VALUES (r_hold.user_id, r_hold.amount, 'refund', 'REFUND-' || p_match_id, 'Refund match escrow', 'completed', jsonb_build_object('match_id', p_match_id));
  END LOOP;

  UPDATE public.matches
  SET status = 'cancelled', updated_at = now()
  WHERE id = p_match_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_match_escrow(uuid) TO authenticated;

-- 7) RPC: settle_match_escrow - release holds, credit winner, record fee
CREATE OR REPLACE FUNCTION public.settle_match_escrow(
  p_match_id uuid,
  p_winner_id uuid,
  p_fee_percentage numeric DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_match RECORD;
  v_creator_hold RECORD;
  v_opponent_hold RECORD;
  v_loser_id uuid;
  v_stake numeric;
  v_fee numeric;
  v_fee_pct numeric;
BEGIN
  SELECT * INTO v_match FROM public.matches WHERE id = p_match_id FOR UPDATE;
  IF v_match IS NULL THEN RAISE EXCEPTION 'MATCH_NOT_FOUND'; END IF;
  IF v_match.status <> 'completed' THEN
    -- Optional: allow settle even if not completed yet
    NULL;
  END IF;

  v_stake := v_match.stake_amount;
  IF v_stake <= 0 THEN RAISE EXCEPTION 'INVALID_STAKE'; END IF;

  -- Identify holds
  SELECT * INTO v_creator_hold FROM public.wallet_holds WHERE match_id = p_match_id AND user_id = v_match.creator_id FOR UPDATE;
  SELECT * INTO v_opponent_hold FROM public.wallet_holds WHERE match_id = p_match_id AND user_id = v_match.opponent_id FOR UPDATE;

  IF p_winner_id = v_match.creator_id THEN
    v_loser_id := v_match.opponent_id;
  ELSE
    v_loser_id := v_match.creator_id;
  END IF;

  -- Refund winner's hold: cancel pending loss txn and add refund
  UPDATE public.transactions
  SET status = 'cancelled', processed_at = now()
  WHERE user_id = p_winner_id
    AND metadata->>'match_id' = p_match_id::text
    AND status = 'pending'
    AND type = 'match_loss';

  UPDATE public.wallet_holds
  SET status = 'released', released_at = now()
  WHERE match_id = p_match_id AND user_id = p_winner_id;

  UPDATE public.user_wallets
  SET balance = balance + v_stake, updated_at = now()
  WHERE user_id = p_winner_id;

  INSERT INTO public.transactions(user_id, amount, type, reference_code, description, status, metadata)
  VALUES (p_winner_id, v_stake, 'refund', 'REFUND-' || p_match_id, 'Refund own stake (escrow release)', 'completed', jsonb_build_object('match_id', p_match_id));

  -- Finalize loser hold
  UPDATE public.transactions
  SET status = 'completed', processed_at = now()
  WHERE user_id = v_loser_id
    AND metadata->>'match_id' = p_match_id::text
    AND status = 'pending'
    AND type = 'match_loss';

  UPDATE public.wallet_holds
  SET status = 'released', released_at = now()
  WHERE match_id = p_match_id AND user_id = v_loser_id;

  -- Determine fee percentage from settings if not provided
  SELECT fee_percentage INTO v_fee_pct
  FROM public.platform_settings
  ORDER BY updated_at DESC
  LIMIT 1;
  IF v_fee_pct IS NULL THEN
    v_fee_pct := 5.00;
  END IF;
  IF p_fee_percentage IS NOT NULL THEN
    v_fee_pct := p_fee_percentage;
  END IF;

  -- Credit winner with opponent stake minus fee
  v_fee := round(v_stake * (v_fee_pct / 100.0), 2);
  INSERT INTO public.transactions(user_id, amount, type, reference_code, description, status, metadata)
  VALUES (p_winner_id, (v_stake - v_fee), 'match_win', 'WIN-' || p_match_id, 'Match winnings after fee', 'completed', jsonb_build_object('match_id', p_match_id, 'fee', v_fee, 'fee_pct', v_fee_pct));

  UPDATE public.user_wallets
  SET balance = balance + (v_stake - v_fee), updated_at = now()
  WHERE user_id = p_winner_id;

  -- Record platform fee if table exists
  BEGIN
    INSERT INTO public.platform_fees(match_id, fee_amount, fee_percentage, match_stake_amount)
    VALUES (p_match_id, v_fee, p_fee_percentage, v_stake);
  EXCEPTION WHEN undefined_table THEN
    -- platform_fees optional
    NULL;
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.settle_match_escrow(uuid, uuid, numeric) TO authenticated;

-- 7.1) Platform settings table for fee percentage
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_percentage numeric(5,2) NOT NULL DEFAULT 5.00,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS for platform_settings (admin only)
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
DO $plpgsql$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='platform_settings' AND policyname='admins manage settings'
  ) THEN
    EXECUTE $sql$
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
    $sql$;
  END IF;
END
$plpgsql$;

-- Seed one settings row if table is empty
INSERT INTO public.platform_settings (fee_percentage)
SELECT 5.00
WHERE NOT EXISTS (SELECT 1 FROM public.platform_settings);

-- 8) RLS extensions: allow admins to manage wallets and transactions (needed for settlement)
DO $plpgsql$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_wallets' AND policyname = 'admins manage wallets'
  ) THEN
    EXECUTE $sql$
      CREATE POLICY "admins manage wallets"
      ON public.user_wallets FOR ALL
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
    $sql$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'transactions' AND policyname = 'admins manage transactions'
  ) THEN
    EXECUTE $sql$
      CREATE POLICY "admins manage transactions"
      ON public.transactions FOR ALL
      USING (
        auth.uid() = user_id OR EXISTS (
          SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
        )
      )
      WITH CHECK (
        auth.uid() = user_id OR EXISTS (
          SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
    $sql$;
  END IF;
END
$plpgsql$;

-- 9) Triggers: auto-settle on completion; auto-refund on cancel
CREATE OR REPLACE FUNCTION public.handle_match_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_has_held boolean;
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.wallet_holds
    WHERE match_id = NEW.id AND status = 'held'
  ) INTO v_has_held;

  IF NEW.status = 'completed' AND NEW.winner_id IS NOT NULL AND v_has_held THEN
    PERFORM public.settle_match_escrow(NEW.id, NEW.winner_id, NULL);
  ELSIF NEW.status = 'cancelled' AND v_has_held THEN
    PERFORM public.cancel_match_escrow(NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_match_status_change ON public.matches;
CREATE TRIGGER trg_match_status_change
AFTER UPDATE ON public.matches
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.handle_match_status_change();
