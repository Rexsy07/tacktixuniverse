-- Create tournament_matches table for bracket system
CREATE TABLE IF NOT EXISTS public.tournament_matches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL,
  round_number integer NOT NULL,
  match_number integer NOT NULL,
  player1_id uuid NULL,
  player2_id uuid NULL,
  winner_id uuid NULL,
  player1_score integer DEFAULT 0,
  player2_score integer DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'walkover', 'bye')),
  scheduled_time timestamp with time zone NULL,
  started_at timestamp with time zone NULL,
  completed_at timestamp with time zone NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT tournament_matches_pkey PRIMARY KEY (id),
  CONSTRAINT tournament_matches_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE,
  CONSTRAINT tournament_matches_player1_id_fkey FOREIGN KEY (player1_id) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT tournament_matches_player2_id_fkey FOREIGN KEY (player2_id) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT tournament_matches_winner_id_fkey FOREIGN KEY (winner_id) REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Ensure valid match structure
  CONSTRAINT valid_scores CHECK (
    (status = 'completed' AND winner_id IS NOT NULL) OR 
    (status != 'completed')
  ),
  CONSTRAINT different_players CHECK (
    player1_id IS DISTINCT FROM player2_id
  ),
  CONSTRAINT winner_is_player CHECK (
    winner_id IS NULL OR winner_id = player1_id OR winner_id = player2_id
  ),
  CONSTRAINT valid_round_match CHECK (
    round_number > 0 AND match_number > 0
  ),
  CONSTRAINT unique_tournament_round_match UNIQUE (tournament_id, round_number, match_number)
);

-- Create tournament_bracket_progress table for tracking tournament state
CREATE TABLE IF NOT EXISTS public.tournament_bracket_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL,
  current_round integer NOT NULL DEFAULT 1,
  total_rounds integer NOT NULL,
  bracket_type text NOT NULL DEFAULT 'single_elimination' CHECK (bracket_type IN ('single_elimination', 'double_elimination', 'round_robin')),
  bracket_data jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT tournament_bracket_progress_pkey PRIMARY KEY (id),
  CONSTRAINT tournament_bracket_progress_tournament_id_key UNIQUE (tournament_id),
  CONSTRAINT tournament_bracket_progress_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE,
  CONSTRAINT valid_rounds CHECK (current_round <= total_rounds AND total_rounds > 0)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS tournament_matches_tournament_id_idx ON public.tournament_matches(tournament_id);
CREATE INDEX IF NOT EXISTS tournament_matches_round_idx ON public.tournament_matches(tournament_id, round_number);
CREATE INDEX IF NOT EXISTS tournament_matches_player1_idx ON public.tournament_matches(player1_id);
CREATE INDEX IF NOT EXISTS tournament_matches_player2_idx ON public.tournament_matches(player2_id);
CREATE INDEX IF NOT EXISTS tournament_matches_status_idx ON public.tournament_matches(status);
CREATE INDEX IF NOT EXISTS tournament_bracket_progress_tournament_idx ON public.tournament_bracket_progress(tournament_id);

-- Enable RLS
ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_bracket_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tournament_matches
DROP POLICY IF EXISTS "Users can view tournament matches" ON public.tournament_matches;
CREATE POLICY "Users can view tournament matches"
ON public.tournament_matches FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage tournament matches" ON public.tournament_matches;
CREATE POLICY "Admins can manage tournament matches"
ON public.tournament_matches FOR ALL
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

-- RLS Policies for tournament_bracket_progress
DROP POLICY IF EXISTS "Users can view tournament bracket progress" ON public.tournament_bracket_progress;
CREATE POLICY "Users can view tournament bracket progress"
ON public.tournament_bracket_progress FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage tournament bracket progress" ON public.tournament_bracket_progress;
CREATE POLICY "Admins can manage tournament bracket progress"
ON public.tournament_bracket_progress FOR ALL
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

-- Function to calculate total rounds needed for a tournament
CREATE OR REPLACE FUNCTION calculate_tournament_rounds(participant_count integer)
RETURNS integer
LANGUAGE plpgsql
AS $$
BEGIN
  IF participant_count <= 1 THEN
    RETURN 0;
  END IF;
  
  RETURN CEIL(LOG(2, participant_count));
END;
$$;

-- Function to generate tournament bracket
CREATE OR REPLACE FUNCTION generate_tournament_bracket(tournament_id_param uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  tournament_record RECORD;
  participant_ids uuid[];
  total_rounds integer;
  current_round integer;
  matches_in_round integer;
  match_num integer;
  participant_index integer;
  player1_id uuid;
  player2_id uuid;
  participant_count integer;
BEGIN
  -- Get tournament details
  SELECT * INTO tournament_record
  FROM public.tournaments
  WHERE id = tournament_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tournament not found';
  END IF;
  
  -- Get all participants
  SELECT ARRAY(
    SELECT tp.user_id
    FROM public.tournament_participants tp
    WHERE tp.tournament_id = tournament_id_param
    ORDER BY tp.registered_at
  ) INTO participant_ids;
  
  participant_count := array_length(participant_ids, 1);
  
  IF participant_count IS NULL OR participant_count < 2 THEN
    RAISE EXCEPTION 'Not enough participants to generate bracket';
  END IF;
  
  -- Calculate total rounds
  total_rounds := calculate_tournament_rounds(participant_count);
  
  -- Delete existing matches and bracket progress
  DELETE FROM public.tournament_matches WHERE tournament_id = tournament_id_param;
  DELETE FROM public.tournament_bracket_progress WHERE tournament_id = tournament_id_param;
  
  -- Create bracket progress record
  INSERT INTO public.tournament_bracket_progress (tournament_id, total_rounds, bracket_type)
  VALUES (tournament_id_param, total_rounds, 'single_elimination');
  
  -- Generate first round matches
  current_round := 1;
  matches_in_round := CEIL(participant_count::float / 2);
  
  FOR match_num IN 1..matches_in_round LOOP
    participant_index := (match_num - 1) * 2 + 1;
    
    -- Get player 1
    IF participant_index <= participant_count THEN
      player1_id := participant_ids[participant_index];
    ELSE
      player1_id := NULL;
    END IF;
    
    -- Get player 2
    IF participant_index + 1 <= participant_count THEN
      player2_id := participant_ids[participant_index + 1];
    ELSE
      player2_id := NULL;
    END IF;
    
    -- Handle bye (odd number of participants)
    IF player2_id IS NULL AND player1_id IS NOT NULL THEN
      -- Create a bye match - player1 automatically advances
      INSERT INTO public.tournament_matches (
        tournament_id, round_number, match_number, player1_id, status, winner_id, completed_at
      ) VALUES (
        tournament_id_param, current_round, match_num, player1_id, 'bye', player1_id, now()
      );
    ELSIF player1_id IS NOT NULL AND player2_id IS NOT NULL THEN
      -- Create regular match
      INSERT INTO public.tournament_matches (
        tournament_id, round_number, match_number, player1_id, player2_id, status
      ) VALUES (
        tournament_id_param, current_round, match_num, player1_id, player2_id, 'pending'
      );
    END IF;
  END LOOP;
  
  -- Generate placeholder matches for subsequent rounds
  FOR round_num IN 2..total_rounds LOOP
    matches_in_round := POWER(2, total_rounds - round_num);
    
    FOR match_num IN 1..matches_in_round LOOP
      INSERT INTO public.tournament_matches (
        tournament_id, round_number, match_number, status
      ) VALUES (
        tournament_id_param, round_num, match_num, 'pending'
      );
    END LOOP;
  END LOOP;
  
  -- Auto-advance bye winners to next round
  PERFORM advance_bye_winners(tournament_id_param);
END;
$$;

-- Function to advance bye winners automatically
CREATE OR REPLACE FUNCTION advance_bye_winners(tournament_id_param uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  bye_match RECORD;
BEGIN
  -- Process all bye matches in the first round
  FOR bye_match IN 
    SELECT id, winner_id 
    FROM public.tournament_matches 
    WHERE tournament_id = tournament_id_param 
      AND status = 'bye'
      AND winner_id IS NOT NULL
  LOOP
    PERFORM advance_tournament_winner(bye_match.id, bye_match.winner_id);
  END LOOP;
END;
$$;

-- Function to advance winners to next round
CREATE OR REPLACE FUNCTION advance_tournament_winner(match_id_param uuid, winner_id_param uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  match_record RECORD;
  next_round_match_number integer;
  next_round integer;
  tournament_total_rounds integer;
BEGIN
  -- Get the match
  SELECT * INTO match_record
  FROM public.tournament_matches
  WHERE id = match_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match not found';
  END IF;
  
  -- Validate winner (skip for bye matches)
  IF match_record.status != 'bye' AND 
     winner_id_param != match_record.player1_id AND 
     winner_id_param != match_record.player2_id THEN
    RAISE EXCEPTION 'Winner must be one of the match participants';
  END IF;
  
  -- Update match as completed if not already
  IF match_record.status != 'completed' AND match_record.status != 'bye' THEN
    UPDATE public.tournament_matches
    SET winner_id = winner_id_param,
        status = 'completed',
        completed_at = now(),
        updated_at = now()
    WHERE id = match_id_param;
  END IF;
  
  -- Get tournament total rounds
  SELECT total_rounds INTO tournament_total_rounds
  FROM public.tournament_bracket_progress
  WHERE tournament_id = match_record.tournament_id;
  
  -- Check if this was the final
  IF match_record.round_number = tournament_total_rounds THEN
    -- Update tournament winner
    UPDATE public.tournaments
    SET winner_user_id = winner_id_param,
        status = 'completed',
        end_date = now()
    WHERE id = match_record.tournament_id;
    RETURN;
  END IF;
  
  -- Calculate next round and match
  next_round := match_record.round_number + 1;
  next_round_match_number := CEIL(match_record.match_number::float / 2);
  
  -- Advance winner to next round
  IF match_record.match_number % 2 = 1 THEN
    -- Odd match number -> winner goes to player1 slot
    UPDATE public.tournament_matches
    SET player1_id = winner_id_param,
        updated_at = now()
    WHERE tournament_id = match_record.tournament_id
      AND round_number = next_round
      AND match_number = next_round_match_number;
  ELSE
    -- Even match number -> winner goes to player2 slot
    UPDATE public.tournament_matches
    SET player2_id = winner_id_param,
        updated_at = now()
    WHERE tournament_id = match_record.tournament_id
      AND round_number = next_round
      AND match_number = next_round_match_number;
  END IF;
  
  -- Check if next round match is ready to start
  PERFORM check_and_update_match_status(match_record.tournament_id, next_round, next_round_match_number);
END;
$$;

-- Function to check and update match status when both players are assigned
CREATE OR REPLACE FUNCTION check_and_update_match_status(
  tournament_id_param uuid, 
  round_num integer, 
  match_num integer
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.tournament_matches
  SET status = 'pending'
  WHERE tournament_id = tournament_id_param
    AND round_number = round_num
    AND match_number = match_num
    AND player1_id IS NOT NULL
    AND player2_id IS NOT NULL
    AND status = 'pending';
END;
$$;

-- Function to set match result and advance winner
CREATE OR REPLACE FUNCTION set_tournament_match_result(
  match_id_param uuid,
  winner_id_param uuid,
  player1_score_param integer DEFAULT NULL,
  player2_score_param integer DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update match with result
  UPDATE public.tournament_matches
  SET winner_id = winner_id_param,
      player1_score = COALESCE(player1_score_param, player1_score),
      player2_score = COALESCE(player2_score_param, player2_score),
      status = 'completed',
      completed_at = now(),
      updated_at = now()
  WHERE id = match_id_param;
  
  -- Advance winner to next round
  PERFORM advance_tournament_winner(match_id_param, winner_id_param);
END;
$$;

-- Set updated_at trigger for tournament_matches
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_tournament_matches ON public.tournament_matches;
CREATE TRIGGER set_updated_at_tournament_matches
  BEFORE UPDATE ON public.tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_tournament_bracket_progress ON public.tournament_bracket_progress;
CREATE TRIGGER set_updated_at_tournament_bracket_progress
  BEFORE UPDATE ON public.tournament_bracket_progress
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Grant permissions
GRANT SELECT ON public.tournament_matches TO authenticated;
GRANT SELECT ON public.tournament_bracket_progress TO authenticated;
GRANT EXECUTE ON FUNCTION generate_tournament_bracket(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION advance_tournament_winner(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_tournament_rounds(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION set_tournament_match_result(uuid, uuid, integer, integer) TO authenticated;