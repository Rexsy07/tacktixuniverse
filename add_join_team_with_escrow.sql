-- Add the missing join_team_with_escrow RPC function
CREATE OR REPLACE FUNCTION public.join_team_with_escrow(
  p_match_id uuid,
  p_user_id uuid,
  p_team text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_status public.match_status;
  v_stake numeric;
  v_team_size integer;
  v_max_team_size integer;
  v_format text;
BEGIN
  -- Load and validate match
  SELECT status, stake_amount, format
  INTO v_status, v_stake, v_format
  FROM public.matches
  WHERE id = p_match_id
  FOR UPDATE;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'MATCH_NOT_FOUND';
  END IF;
  
  IF v_status <> 'awaiting_opponent' THEN
    RAISE EXCEPTION 'MATCH_NOT_AVAILABLE';
  END IF;

  -- Check if user is already in this match
  IF EXISTS (
    SELECT 1 FROM public.match_participants 
    WHERE match_id = p_match_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'ALREADY_IN_MATCH';
  END IF;

  -- Get current team size
  SELECT COUNT(*) INTO v_team_size
  FROM public.match_participants
  WHERE match_id = p_match_id AND team = p_team;

  -- Determine max team size based on format
  CASE 
    WHEN v_format = '1v1' THEN v_max_team_size := 1;
    WHEN v_format = '1v2' THEN 
      v_max_team_size := CASE WHEN p_team = 'A' THEN 1 ELSE 2 END;
    WHEN v_format = '1v3' THEN 
      v_max_team_size := CASE WHEN p_team = 'A' THEN 1 ELSE 3 END;
    WHEN v_format = '1v4' THEN 
      v_max_team_size := CASE WHEN p_team = 'A' THEN 1 ELSE 4 END;
    WHEN v_format = '2v2' THEN v_max_team_size := 2;
    WHEN v_format = '3v3' THEN v_max_team_size := 3;
    WHEN v_format = '4v4' THEN v_max_team_size := 4;
    WHEN v_format = '5v5' THEN v_max_team_size := 5;
    ELSE v_max_team_size := 1;
  END CASE;

  -- Check if team is full
  IF v_team_size >= v_max_team_size THEN
    RAISE EXCEPTION 'TEAM_FULL';
  END IF;

  -- Hold user's stake
  PERFORM public._assert_balance_and_hold(p_user_id, p_match_id, v_stake, 'HOLD-' || p_match_id || '-' || p_team);

  -- Add user to team
  INSERT INTO public.match_participants(match_id, user_id, team, role)
  VALUES (
    p_match_id, 
    p_user_id, 
    p_team, 
    CASE WHEN v_team_size = 0 THEN 'captain' ELSE 'member' END
  );

  -- Check if match is now full and should start
  DECLARE
    v_total_participants integer;
    v_required_participants integer;
  BEGIN
    SELECT COUNT(*) INTO v_total_participants
    FROM public.match_participants
    WHERE match_id = p_match_id;

    -- Calculate required participants based on format
    CASE v_format
      WHEN '1v1' THEN v_required_participants := 2;
      WHEN '1v2' THEN v_required_participants := 3;
      WHEN '1v3' THEN v_required_participants := 4;
      WHEN '1v4' THEN v_required_participants := 5;
      WHEN '2v2' THEN v_required_participants := 4;
      WHEN '3v3' THEN v_required_participants := 6;
      WHEN '4v4' THEN v_required_participants := 8;
      WHEN '5v5' THEN v_required_participants := 10;
      ELSE v_required_participants := 2;
    END CASE;

    -- Start match if full
    IF v_total_participants >= v_required_participants THEN
      UPDATE public.matches
      SET status = 'in_progress', accepted_at = now()
      WHERE id = p_match_id;
    END IF;
  END;

EXCEPTION WHEN others THEN
  -- Log the error for debugging
  RAISE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_team_with_escrow(uuid, uuid, text) TO authenticated;