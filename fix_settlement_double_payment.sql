-- Fix Settlement Double Payment Bug
-- Currently winners get: stake refund + prize money = double payment
-- Should be: winners get prize money, losers lose stakes

-- 1) Fix the main 1v1 settlement function
CREATE OR REPLACE FUNCTION public.settle_match_escrow(
  p_match_id uuid,
  p_winner_id uuid,
  p_fee_percentage numeric DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_loser_id uuid;
  v_stake numeric;
  v_fee_pct numeric;
  v_fee numeric;
BEGIN
  -- Get match info and determine loser
  SELECT 
    stake_amount,
    CASE 
      WHEN creator_id = p_winner_id THEN opponent_id 
      ELSE creator_id 
    END
  INTO v_stake, v_loser_id
  FROM public.matches
  WHERE id = p_match_id;

  IF v_stake IS NULL THEN
    RAISE EXCEPTION 'MATCH_NOT_FOUND';
  END IF;

  -- Determine fee percentage
  SELECT fee_percentage INTO v_fee_pct
  FROM public.platform_settings
  ORDER BY updated_at DESC
  LIMIT 1;
  IF v_fee_pct IS NULL THEN v_fee_pct := 5.00; END IF;
  IF p_fee_percentage IS NOT NULL THEN v_fee_pct := p_fee_percentage; END IF;

  -- Cancel all pending loss transactions
  UPDATE public.transactions
  SET status = 'cancelled', processed_at = now()
  WHERE metadata->>'match_id' = p_match_id::text
    AND status = 'pending'
    AND type = 'match_loss';

  -- Release all holds
  UPDATE public.wallet_holds
  SET status = 'released', released_at = now()
  WHERE match_id = p_match_id;

  -- Calculate fee and winner prize (total pot minus fee)
  v_fee := round((v_stake * 2) * (v_fee_pct / 100.0), 2);

  -- Give winner the full pot minus fee (NO REFUND)
  UPDATE public.user_wallets
  SET balance = balance + ((v_stake * 2) - v_fee), updated_at = now()
  WHERE user_id = p_winner_id;

  INSERT INTO public.transactions(user_id, amount, type, reference_code, description, status, metadata)
  VALUES (
    p_winner_id, 
    ((v_stake * 2) - v_fee), 
    'match_win', 
    'WIN-' || p_match_id, 
    'Match winnings (full pot after fee)', 
    'completed', 
    jsonb_build_object('match_id', p_match_id, 'total_pot', v_stake * 2, 'fee', v_fee, 'fee_pct', v_fee_pct)
  );

  -- Finalize loser transaction (stake forfeited - NO REFUND)
  UPDATE public.transactions
  SET status = 'completed', processed_at = now(), description = 'Stake forfeited (match loss)'
  WHERE user_id = v_loser_id
    AND metadata->>'match_id' = p_match_id::text
    AND status = 'cancelled'
    AND type = 'match_loss';

  -- Record platform fee
  BEGIN
    INSERT INTO public.platform_fees(match_id, fee_amount, fee_percentage, match_stake_amount)
    VALUES (p_match_id, v_fee, v_fee_pct, v_stake * 2);
  EXCEPTION WHEN undefined_table THEN
    NULL; -- platform_fees table optional
  END;
END;
$$;

-- 2) Fix the team settlement function  
CREATE OR REPLACE FUNCTION public.settle_team_match_escrow(
  p_match_id uuid,
  p_winner_user_id uuid,
  p_fee_percentage numeric DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_pot numeric := 0;
  v_fee_pct numeric;
  v_total_fee numeric;
  v_individual_share numeric;
  v_winning_team_size integer;
  v_winning_team_members uuid[];
  v_member_id uuid;
BEGIN
  -- Calculate total pot from all holds
  SELECT COALESCE(SUM(amount), 0) INTO v_total_pot
  FROM public.wallet_holds
  WHERE match_id = p_match_id AND status = 'held';

  IF v_total_pot = 0 THEN
    RAISE EXCEPTION 'NO_ESCROW_FOUND';
  END IF;

  -- Get winning team members
  SELECT ARRAY_AGG(user_id) INTO v_winning_team_members
  FROM public.match_participants
  WHERE match_id = p_match_id 
    AND team = (
      SELECT team FROM public.match_participants 
      WHERE match_id = p_match_id AND user_id = p_winner_user_id
    );

  IF v_winning_team_members IS NULL THEN
    -- Fallback for 1v1 matches
    SELECT ARRAY[creator_id] INTO v_winning_team_members
    FROM public.matches 
    WHERE id = p_match_id AND creator_id = p_winner_user_id
    UNION ALL
    SELECT ARRAY[opponent_id]
    FROM public.matches 
    WHERE id = p_match_id AND opponent_id = p_winner_user_id;
  END IF;

  v_winning_team_size := array_length(v_winning_team_members, 1);

  -- Determine fee percentage
  SELECT fee_percentage INTO v_fee_pct
  FROM public.platform_settings
  ORDER BY updated_at DESC LIMIT 1;
  IF v_fee_pct IS NULL THEN v_fee_pct := 5.00; END IF;
  IF p_fee_percentage IS NOT NULL THEN v_fee_pct := p_fee_percentage; END IF;

  -- Calculate fee and individual share
  v_total_fee := round(v_total_pot * (v_fee_pct / 100.0), 2);
  v_individual_share := round((v_total_pot - v_total_fee) / v_winning_team_size, 2);

  -- Release all holds
  UPDATE public.wallet_holds SET status = 'released', released_at = now() WHERE match_id = p_match_id;
  
  -- Cancel pending loss transactions
  UPDATE public.transactions
  SET status = 'cancelled', processed_at = now()
  WHERE metadata->>'match_id' = p_match_id::text AND status = 'pending' AND type = 'match_loss';

  -- Give winners their prize share (NO REFUNDS)
  FOREACH v_member_id IN ARRAY v_winning_team_members
  LOOP
    UPDATE public.user_wallets
    SET balance = balance + v_individual_share, updated_at = now()
    WHERE user_id = v_member_id;

    INSERT INTO public.transactions(user_id, amount, type, reference_code, description, status, metadata)
    VALUES (
      v_member_id,
      v_individual_share,
      'match_win',
      'WIN-' || p_match_id || '-' || v_member_id::text,
      'Match winnings (prize share after fees)',
      'completed',
      jsonb_build_object(
        'match_id', p_match_id, 
        'team_size', v_winning_team_size,
        'individual_share', v_individual_share,
        'total_pot', v_total_pot,
        'total_fee', v_total_fee,
        'fee_pct', v_fee_pct
      )
    );
  END LOOP;
  
  -- Finalize loser transactions (stakes forfeited - NO REFUNDS)
  UPDATE public.transactions
  SET status = 'completed', processed_at = now(), description = 'Stake forfeited (match loss)'
  WHERE metadata->>'match_id' = p_match_id::text
    AND status = 'cancelled'
    AND type = 'match_loss'
    AND user_id != ALL(v_winning_team_members);

  -- Record platform fee
  BEGIN
    INSERT INTO public.platform_fees(match_id, fee_amount, fee_percentage, match_stake_amount)
    VALUES (p_match_id, v_total_fee, v_fee_pct, v_total_pot);
  EXCEPTION WHEN undefined_table THEN
    NULL; -- optional table
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.settle_match_escrow(uuid, uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.settle_team_match_escrow(uuid, uuid, numeric) TO authenticated;