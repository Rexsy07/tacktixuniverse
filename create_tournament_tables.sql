-- First, let's create the tournament_matches table
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
  status text NOT NULL DEFAULT 'pending',
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
  CONSTRAINT unique_tournament_round_match UNIQUE (tournament_id, round_number, match_number),
  CONSTRAINT valid_round_match CHECK (round_number > 0 AND match_number > 0),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'in_progress', 'completed', 'walkover', 'bye'))
);

-- Create the tournament_bracket_progress table
CREATE TABLE IF NOT EXISTS public.tournament_bracket_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL,
  current_round integer NOT NULL DEFAULT 1,
  total_rounds integer NOT NULL,
  bracket_type text NOT NULL DEFAULT 'single_elimination',
  bracket_data jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT tournament_bracket_progress_pkey PRIMARY KEY (id),
  CONSTRAINT tournament_bracket_progress_tournament_id_key UNIQUE (tournament_id),
  CONSTRAINT tournament_bracket_progress_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE,
  CONSTRAINT valid_rounds CHECK (current_round <= total_rounds AND total_rounds > 0),
  CONSTRAINT valid_bracket_type CHECK (bracket_type IN ('single_elimination', 'double_elimination', 'round_robin'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS tournament_matches_tournament_id_idx ON public.tournament_matches(tournament_id);
CREATE INDEX IF NOT EXISTS tournament_matches_round_idx ON public.tournament_matches(tournament_id, round_number);
CREATE INDEX IF NOT EXISTS tournament_matches_status_idx ON public.tournament_matches(status);
CREATE INDEX IF NOT EXISTS tournament_bracket_progress_tournament_idx ON public.tournament_bracket_progress(tournament_id);

-- Enable RLS
ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_bracket_progress ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view tournament matches"
ON public.tournament_matches FOR SELECT
USING (true);

CREATE POLICY "Anyone can view tournament bracket progress"
ON public.tournament_bracket_progress FOR SELECT
USING (true);

-- For now, let's allow admins to manage these (you can restrict later)
CREATE POLICY "Authenticated users can manage tournament matches"
ON public.tournament_matches FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage tournament bracket progress"
ON public.tournament_bracket_progress FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Simple function to calculate tournament rounds
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

-- Basic bracket generation function
CREATE OR REPLACE FUNCTION generate_tournament_bracket(tournament_id_param uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  participant_ids uuid[];
  total_rounds integer;
  participant_count integer;
  matches_in_round integer;
  match_num integer;
  player1_id uuid;
  player2_id uuid;
BEGIN
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
  INSERT INTO public.tournament_bracket_progress (tournament_id, total_rounds)
  VALUES (tournament_id_param, total_rounds);
  
  -- Generate first round matches
  matches_in_round := CEIL(participant_count::float / 2);
  
  FOR match_num IN 1..matches_in_round LOOP
    -- Get players for this match
    IF (match_num - 1) * 2 + 1 <= participant_count THEN
      player1_id := participant_ids[(match_num - 1) * 2 + 1];
    END IF;
    
    IF (match_num - 1) * 2 + 2 <= participant_count THEN
      player2_id := participant_ids[(match_num - 1) * 2 + 2];
    END IF;
    
    -- Create match
    IF player1_id IS NOT NULL AND player2_id IS NULL THEN
      -- Bye match
      INSERT INTO public.tournament_matches (
        tournament_id, round_number, match_number, player1_id, status, winner_id
      ) VALUES (
        tournament_id_param, 1, match_num, player1_id, 'bye', player1_id
      );
    ELSIF player1_id IS NOT NULL AND player2_id IS NOT NULL THEN
      -- Regular match
      INSERT INTO public.tournament_matches (
        tournament_id, round_number, match_number, player1_id, player2_id, status
      ) VALUES (
        tournament_id_param, 1, match_num, player1_id, player2_id, 'pending'
      );
    END IF;
    
    -- Reset for next iteration
    player1_id := NULL;
    player2_id := NULL;
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
  
END;
$$;

-- Grant permissions
GRANT SELECT ON public.tournament_matches TO authenticated;
GRANT SELECT ON public.tournament_bracket_progress TO authenticated;
GRANT EXECUTE ON FUNCTION generate_tournament_bracket(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_tournament_rounds(integer) TO authenticated;