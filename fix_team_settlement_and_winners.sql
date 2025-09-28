-- Fix Team Settlement and Winner Selection System
-- This script addresses:
-- 1. Team-based prize distribution
-- 2. 1vX clutch match winner selection
-- 3. Proper escrow settlement for all formats

-- 1) Create team-based settlement function
CREATE OR REPLACE FUNCTION public.settle_team_match_escrow(
  p_match_id uuid,
  p_winner_user_id uuid,
  p_fee_percentage numeric DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_match_record public.matches%ROWTYPE;
  v_team_size_a integer;
  v_team_size_b integer;
  v_total_pot numeric := 0;
  v_fee_pct numeric;
  v_total_fee numeric;
  v_individual_share numeric;
  v_winning_team_size integer;
  v_winning_team_members uuid[];
  v_member_id uuid;
BEGIN
  -- Get match details
  SELECT * INTO v_match_record FROM public.matches WHERE id = p_match_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'MATCH_NOT_FOUND';
  END IF;

  -- Parse team sizes from format
  CASE 
    WHEN v_match_record.format = '1v1' THEN 
      v_team_size_a := 1; v_team_size_b := 1;
    WHEN v_match_record.format = '1v2' THEN 
      v_team_size_a := 1; v_team_size_b := 2;
    WHEN v_match_record.format = '1v3' THEN 
      v_team_size_a := 1; v_team_size_b := 3;
    WHEN v_match_record.format = '1v4' THEN 
      v_team_size_a := 1; v_team_size_b := 4;
    WHEN v_match_record.format = '2v2' THEN 
      v_team_size_a := 2; v_team_size_b := 2;
    WHEN v_match_record.format = '3v3' THEN 
      v_team_size_a := 3; v_team_size_b := 3;
    WHEN v_match_record.format = '4v4' THEN 
      v_team_size_a := 4; v_team_size_b := 4;
    WHEN v_match_record.format = '5v5' THEN 
      v_team_size_a := 5; v_team_size_b := 5;
    ELSE 
      v_team_size_a := 1; v_team_size_b := 1; -- Default to 1v1
  END CASE;

  -- Calculate total pot from all holds
  SELECT COALESCE(SUM(amount), 0) INTO v_total_pot
  FROM public.wallet_holds
  WHERE match_id = p_match_id AND status = 'held';

  IF v_total_pot = 0 THEN
    RAISE EXCEPTION 'NO_ESCROW_FOUND';
  END IF;

  -- Determine fee percentage
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

  -- Determine winning team and size
  SELECT ARRAY_AGG(user_id) INTO v_winning_team_members
  FROM public.match_participants
  WHERE match_id = p_match_id 
    AND (
      -- Winner is on Team A
      (team = 'A' AND p_winner_user_id IN (
        SELECT user_id FROM public.match_participants 
        WHERE match_id = p_match_id AND team = 'A'
      ))
      OR 
      -- Winner is on Team B
      (team = 'B' AND p_winner_user_id IN (
        SELECT user_id FROM public.match_participants 
        WHERE match_id = p_match_id AND team = 'B'
      ))
    );

  -- If no team participants found, handle as 1v1 match
  IF v_winning_team_members IS NULL OR array_length(v_winning_team_members, 1) IS NULL THEN
    -- Handle 1v1 or direct creator/opponent matches
    IF v_match_record.creator_id = p_winner_user_id THEN
      v_winning_team_members := ARRAY[v_match_record.creator_id];
    ELSIF v_match_record.opponent_id = p_winner_user_id THEN
      v_winning_team_members := ARRAY[v_match_record.opponent_id];
    ELSE
      RAISE EXCEPTION 'WINNER_NOT_FOUND_IN_MATCH';
    END IF;
  END IF;

  v_winning_team_size := array_length(v_winning_team_members, 1);
  
  -- Calculate total fee and individual share
  v_total_fee := round(v_total_pot * (v_fee_pct / 100.0), 2);
  v_individual_share := round((v_total_pot - v_total_fee) / v_winning_team_size, 2);

  -- Release all holds and cancel pending loss transactions
  UPDATE public.transactions
  SET status = 'cancelled', processed_at = now()
  WHERE metadata->>'match_id' = p_match_id::text
    AND status = 'pending'
    AND type = 'match_loss';

  UPDATE public.wallet_holds
  SET status = 'released', released_at = now()
  WHERE match_id = p_match_id;

  -- NO REFUNDS! Stakes become the prize pool
  -- Winners get the prize pool, losers lose their stakes

  -- Distribute winnings to winning team members (no refunds, just prize money)
  FOREACH v_member_id IN ARRAY v_winning_team_members
  LOOP
    -- Credit winner with their share of the prize pool
    UPDATE public.user_wallets
    SET balance = balance + v_individual_share, updated_at = now()
    WHERE user_id = v_member_id;

    -- Create winning transaction
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
        'fee_pct', v_fee_pct,
        'prize_pool', v_total_pot - v_total_fee
      )
    );
  END LOOP;
  
  -- Finalize loser transactions (their stakes are forfeited)
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
    -- platform_fees table is optional
    NULL;
  END;

  -- Update match status
  UPDATE public.matches
  SET 
    status = 'completed',
    winner_id = p_winner_user_id,
    completed_at = COALESCE(completed_at, now()),
    updated_at = now()
  WHERE id = p_match_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.settle_team_match_escrow(uuid, uuid, numeric) TO authenticated;

-- 2) Create function to get team members for winner selection
CREATE OR REPLACE FUNCTION public.get_match_participants_by_team(
  p_match_id uuid
) RETURNS TABLE(
  user_id uuid,
  username text,
  team text,
  role text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Return team participants with usernames
  RETURN QUERY
  SELECT 
    mp.user_id,
    COALESCE(p.username, 'Unknown') as username,
    mp.team,
    mp.role
  FROM public.match_participants mp
  LEFT JOIN public.profiles p ON p.user_id = mp.user_id
  WHERE mp.match_id = p_match_id
  ORDER BY mp.team, mp.role DESC, p.username;
  
  -- If no team participants, return creator/opponent
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      m.creator_id as user_id,
      COALESCE(pc.username, 'Creator') as username,
      'A' as team,
      'captain' as role
    FROM public.matches m
    LEFT JOIN public.profiles pc ON pc.user_id = m.creator_id
    WHERE m.id = p_match_id
    
    UNION ALL
    
    SELECT 
      m.opponent_id as user_id,
      COALESCE(po.username, 'Opponent') as username,
      'B' as team,
      'captain' as role
    FROM public.matches m
    LEFT JOIN public.profiles po ON po.user_id = m.opponent_id
    WHERE m.id = p_match_id AND m.opponent_id IS NOT NULL;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_match_participants_by_team(uuid) TO authenticated;

-- 3) Create function for admin to set match winner with proper validation
CREATE OR REPLACE FUNCTION public.admin_set_match_winner(
  p_match_id uuid,
  p_winner_user_id uuid,
  p_admin_decision text DEFAULT NULL
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_match_record public.matches%ROWTYPE;
  v_is_valid_participant boolean := false;
  v_result json;
BEGIN
  -- Check admin permissions
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'ACCESS_DENIED: Admin role required';
  END IF;

  -- Get match record
  SELECT * INTO v_match_record FROM public.matches WHERE id = p_match_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'MATCH_NOT_FOUND';
  END IF;

  -- Validate winner is a participant
  SELECT EXISTS(
    SELECT 1 FROM public.match_participants 
    WHERE match_id = p_match_id AND user_id = p_winner_user_id
    
    UNION ALL
    
    SELECT 1 FROM public.matches 
    WHERE id = p_match_id 
      AND (creator_id = p_winner_user_id OR opponent_id = p_winner_user_id)
  ) INTO v_is_valid_participant;

  IF NOT v_is_valid_participant THEN
    RAISE EXCEPTION 'INVALID_WINNER: User is not a participant in this match';
  END IF;

  -- Update match with winner and admin decision
  UPDATE public.matches
  SET 
    status = 'completed',
    winner_id = p_winner_user_id,
    admin_decision = p_admin_decision,
    completed_at = now(),
    updated_at = now()
  WHERE id = p_match_id;

  -- Settle escrow (triggers automatically via trigger, but we can also call directly)
  BEGIN
    PERFORM public.settle_team_match_escrow(p_match_id, p_winner_user_id, 5.0);
  EXCEPTION WHEN OTHERS THEN
    -- If team settlement fails, try regular settlement
    BEGIN
      PERFORM public.settle_match_escrow(p_match_id, p_winner_user_id, 5.0);
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'SETTLEMENT_FAILED: %', SQLERRM;
    END;
  END;

  -- Return success response
  SELECT json_build_object(
    'success', true,
    'match_id', p_match_id,
    'winner_id', p_winner_user_id,
    'message', 'Match winner set and escrow settled successfully'
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_match_winner(uuid, uuid, text) TO authenticated;

-- 4) Update the existing match status trigger to handle team settlements
CREATE OR REPLACE FUNCTION public.handle_match_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_has_held boolean;
  v_is_team_match boolean;
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.wallet_holds
    WHERE match_id = NEW.id AND status = 'held'
  ) INTO v_has_held;

  -- Check if this is a team match (has participants or is multi-player format)
  SELECT EXISTS(
    SELECT 1 FROM public.match_participants
    WHERE match_id = NEW.id
  ) OR (NEW.format != '1v1') INTO v_is_team_match;

  -- Handle completion
  IF NEW.status = 'completed' AND NEW.winner_id IS NOT NULL AND v_has_held THEN
    BEGIN
      -- Try team settlement first if it's a team match
      IF v_is_team_match THEN
        PERFORM public.settle_team_match_escrow(NEW.id, NEW.winner_id, NULL);
      ELSE
        PERFORM public.settle_match_escrow(NEW.id, NEW.winner_id, NULL);
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- If team settlement fails, try regular settlement as fallback
      BEGIN
        PERFORM public.settle_match_escrow(NEW.id, NEW.winner_id, NULL);
      EXCEPTION WHEN OTHERS THEN
        -- Log the error but don't fail the trigger
        RAISE WARNING 'Settlement failed for match %: %', NEW.id, SQLERRM;
      END;
    END;
  ELSIF NEW.status = 'cancelled' AND v_has_held THEN
    PERFORM public.cancel_match_escrow(NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS trg_match_status_change ON public.matches;
CREATE TRIGGER trg_match_status_change
AFTER UPDATE ON public.matches
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.handle_match_status_change();

-- 5) Add helpful view for admin to see match participants and potential winners
CREATE OR REPLACE VIEW public.admin_match_participants AS
SELECT 
  m.id as match_id,
  m.format,
  m.status,
  m.stake_amount,
  m.creator_id,
  m.opponent_id,
  m.winner_id,
  -- Team A participants
  COALESCE(
    (SELECT json_agg(
      json_build_object(
        'user_id', mp.user_id,
        'username', p.username,
        'role', mp.role
      )
    ) FROM public.match_participants mp
    LEFT JOIN public.profiles p ON p.user_id = mp.user_id
    WHERE mp.match_id = m.id AND mp.team = 'A'),
    json_build_array(
      json_build_object(
        'user_id', m.creator_id,
        'username', pc.username,
        'role', 'creator'
      )
    )
  ) as team_a,
  -- Team B participants  
  COALESCE(
    (SELECT json_agg(
      json_build_object(
        'user_id', mp.user_id,
        'username', p.username,
        'role', mp.role
      )
    ) FROM public.match_participants mp
    LEFT JOIN public.profiles p ON p.user_id = mp.user_id
    WHERE mp.match_id = m.id AND mp.team = 'B'),
    CASE WHEN m.opponent_id IS NOT NULL THEN
      json_build_array(
        json_build_object(
          'user_id', m.opponent_id,
          'username', po.username,
          'role', 'opponent'
        )
      )
    ELSE json_build_array()
    END
  ) as team_b,
  -- Potential winners (all participants)
  COALESCE(
    (SELECT json_agg(
      json_build_object(
        'user_id', mp.user_id,
        'username', p.username,
        'team', mp.team
      )
    ) FROM public.match_participants mp
    LEFT JOIN public.profiles p ON p.user_id = mp.user_id
    WHERE mp.match_id = m.id),
    json_build_array(
      json_build_object('user_id', m.creator_id, 'username', pc.username, 'team', 'A'),
      json_build_object('user_id', m.opponent_id, 'username', po.username, 'team', 'B')
    )
  ) as potential_winners
FROM public.matches m
LEFT JOIN public.profiles pc ON pc.user_id = m.creator_id
LEFT JOIN public.profiles po ON po.user_id = m.opponent_id
WHERE m.status IN ('pending_result', 'disputed', 'in_progress');

-- Note: Views don't support RLS policies, access control should be handled at application level
-- Admins can query this view directly using: SELECT * FROM public.admin_match_participants;
