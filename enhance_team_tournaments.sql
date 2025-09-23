-- Enhanced Team Tournament Support Migration
-- This migration enhances existing tournament bracket functionality to support 2v2, 4v4, and other team formats

BEGIN;

-- Add team tournament support to tournament_matches table
-- Add team-specific columns to tournament_matches if not already present
DO $$ 
BEGIN
    -- Add team1_members and team2_members columns to track team compositions
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournament_matches' AND column_name = 'team1_members') THEN
        ALTER TABLE public.tournament_matches 
        ADD COLUMN team1_members uuid[], -- Array of user IDs for team 1
        ADD COLUMN team2_members uuid[], -- Array of user IDs for team 2
        ADD COLUMN team_size integer DEFAULT 1; -- Size of each team (1 for 1v1, 2 for 2v2, etc.)
    END IF;
END $$;

-- Add tournament team participants table for team-based tournaments
CREATE TABLE IF NOT EXISTS public.tournament_team_participants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    team_name text NOT NULL,
    captain_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    members uuid[] NOT NULL DEFAULT array[]::uuid[], -- Array of team member user IDs
    registered_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(tournament_id, team_name),
    UNIQUE(tournament_id, captain_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS tournament_team_participants_tournament_idx ON public.tournament_team_participants(tournament_id);
CREATE INDEX IF NOT EXISTS tournament_team_participants_captain_idx ON public.tournament_team_participants(captain_id);

-- RLS policies for tournament team participants
ALTER TABLE public.tournament_team_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tournament team participants"
    ON public.tournament_team_participants FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Team captains can manage their teams"
    ON public.tournament_team_participants FOR ALL
    TO authenticated
    USING (auth.uid() = captain_id);

CREATE POLICY "Admins can manage all tournament teams"
    ON public.tournament_team_participants FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
        )
    );

-- Enhanced bracket generation function for team tournaments
CREATE OR REPLACE FUNCTION generate_team_tournament_bracket(tournament_id_param uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    tournament_record public.tournaments%ROWTYPE;
    participant_count integer;
    team_count integer;
    total_rounds integer;
    current_round_participants uuid[];
    current_round integer := 1;
    matches_per_round integer;
    i integer;
    j integer;
    team1_members uuid[];
    team2_members uuid[];
    team_size_val integer;
BEGIN
    -- Get tournament details
    SELECT * INTO tournament_record 
    FROM public.tournaments 
    WHERE id = tournament_id_param;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Tournament not found';
    END IF;

    -- Extract team size from format (e.g., "2v2" -> 2, "4v4" -> 4, "1v1" -> 1)
    team_size_val := CASE 
        WHEN tournament_record.format LIKE '%v%' THEN 
            CAST(SPLIT_PART(tournament_record.format, 'v', 1) AS INTEGER)
        ELSE 1
    END;

    -- For team tournaments, get teams instead of individual participants
    IF team_size_val > 1 THEN
        -- Count teams for team-based tournaments
        SELECT COUNT(*) INTO team_count
        FROM public.tournament_team_participants ttp
        WHERE ttp.tournament_id = tournament_id_param;
        
        participant_count := team_count;
        
        -- Get team captains as representatives for bracket generation
        SELECT array_agg(ttp.captain_id) INTO current_round_participants
        FROM public.tournament_team_participants ttp
        WHERE ttp.tournament_id = tournament_id_param
        ORDER BY ttp.registered_at;
        
    ELSE
        -- Individual tournaments - use existing logic
        SELECT COUNT(*) INTO participant_count
        FROM public.tournament_participants tp
        WHERE tp.tournament_id = tournament_id_param;
        
        SELECT array_agg(tp.user_id) INTO current_round_participants
        FROM public.tournament_participants tp
        WHERE tp.tournament_id = tournament_id_param
        ORDER BY tp.registered_at;
    END IF;

    IF participant_count < 2 THEN
        RAISE EXCEPTION 'Not enough participants to generate bracket';
    END IF;

    -- Calculate total rounds needed
    total_rounds := calculate_tournament_rounds(participant_count);

    -- Delete existing matches and progress for regeneration
    DELETE FROM public.tournament_matches WHERE tournament_id = tournament_id_param;
    DELETE FROM public.tournament_bracket_progress WHERE tournament_id = tournament_id_param;

    -- Create bracket progress record
    INSERT INTO public.tournament_bracket_progress (
        tournament_id, current_round, total_rounds, bracket_type
    ) VALUES (
        tournament_id_param, 1, total_rounds, 
        CASE WHEN team_size_val > 1 THEN 'team' ELSE 'single_elimination' END
    );

    -- Generate first round matches
    matches_per_round := CEIL(participant_count::numeric / 2);
    
    FOR i IN 1..matches_per_round LOOP
        IF (i * 2 - 1) <= array_length(current_round_participants, 1) THEN
            -- Get team members for team tournaments
            IF team_size_val > 1 THEN
                -- Get team 1 members
                SELECT ttp.members || ARRAY[ttp.captain_id] INTO team1_members
                FROM public.tournament_team_participants ttp
                WHERE ttp.tournament_id = tournament_id_param 
                AND ttp.captain_id = current_round_participants[i * 2 - 1];
                
                -- Get team 2 members if exists
                IF (i * 2) <= array_length(current_round_participants, 1) THEN
                    SELECT ttp.members || ARRAY[ttp.captain_id] INTO team2_members
                    FROM public.tournament_team_participants ttp
                    WHERE ttp.tournament_id = tournament_id_param 
                    AND ttp.captain_id = current_round_participants[i * 2];
                END IF;
            END IF;

            IF (i * 2) <= array_length(current_round_participants, 1) THEN
                -- Regular match
                INSERT INTO public.tournament_matches (
                    tournament_id, round_number, match_number,
                    player1_id, player2_id, team1_members, team2_members, team_size,
                    status, created_at, updated_at
                ) VALUES (
                    tournament_id_param, current_round, i,
                    current_round_participants[i * 2 - 1], 
                    current_round_participants[i * 2],
                    COALESCE(team1_members, ARRAY[current_round_participants[i * 2 - 1]]),
                    COALESCE(team2_members, ARRAY[current_round_participants[i * 2]]),
                    team_size_val,
                    'pending', now(), now()
                );
            ELSE
                -- Bye match - player1 automatically advances
                INSERT INTO public.tournament_matches (
                    tournament_id, round_number, match_number,
                    player1_id, team1_members, team_size,
                    status, winner_id, completed_at, created_at, updated_at
                ) VALUES (
                    tournament_id_param, current_round, i,
                    current_round_participants[i * 2 - 1],
                    COALESCE(team1_members, ARRAY[current_round_participants[i * 2 - 1]]),
                    team_size_val,
                    'bye', current_round_participants[i * 2 - 1], now(), now(), now()
                );
            END IF;
        END IF;
    END LOOP;

    -- Create placeholder matches for subsequent rounds
    FOR current_round IN 2..total_rounds LOOP
        matches_per_round := CEIL(matches_per_round::numeric / 2);
        
        FOR i IN 1..matches_per_round LOOP
            INSERT INTO public.tournament_matches (
                tournament_id, round_number, match_number, team_size,
                status, created_at, updated_at
            ) VALUES (
                tournament_id_param, current_round, i, team_size_val,
                'pending', now(), now()
            );
        END LOOP;
    END LOOP;

    -- Advance bye winners to next round
    PERFORM advance_bye_winners(tournament_id_param);
END;
$$;

-- Enhanced function to set match results for team tournaments
CREATE OR REPLACE FUNCTION set_team_tournament_match_result(
    match_id_param uuid,
    winner_team_captain_id uuid,
    score1 integer DEFAULT NULL,
    score2 integer DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    match_record public.tournament_matches%ROWTYPE;
    tournament_record public.tournaments%ROWTYPE;
BEGIN
    -- Get match details
    SELECT * INTO match_record 
    FROM public.tournament_matches 
    WHERE id = match_id_param;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Match not found';
    END IF;

    -- Get tournament details
    SELECT * INTO tournament_record 
    FROM public.tournaments 
    WHERE id = match_record.tournament_id;

    -- Validate winner is one of the team captains/players
    IF NOT (winner_team_captain_id = match_record.player1_id OR 
            winner_team_captain_id = match_record.player2_id OR
            winner_team_captain_id = ANY(match_record.team1_members) OR
            winner_team_captain_id = ANY(match_record.team2_members)) THEN
        RAISE EXCEPTION 'Winner must be a participant in the match';
    END IF;

    -- Update match with result
    UPDATE public.tournament_matches 
    SET 
        winner_id = winner_team_captain_id,
        player1_score = score1,
        player2_score = score2,
        status = 'completed',
        completed_at = now(),
        updated_at = now()
    WHERE id = match_id_param;

    -- Advance winner to next round
    PERFORM advance_tournament_winner(match_id_param, winner_team_captain_id);

    -- Check if tournament is complete
    PERFORM check_tournament_completion(match_record.tournament_id);
END;
$$;

-- Function to check if tournament is complete and declare winner
CREATE OR REPLACE FUNCTION check_tournament_completion(tournament_id_param uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    remaining_matches integer;
    final_winner_id uuid;
    bracket_progress_record public.tournament_bracket_progress%ROWTYPE;
BEGIN
    -- Get bracket progress
    SELECT * INTO bracket_progress_record
    FROM public.tournament_bracket_progress
    WHERE tournament_id = tournament_id_param;

    -- Count remaining pending matches
    SELECT COUNT(*) INTO remaining_matches
    FROM public.tournament_matches
    WHERE tournament_id = tournament_id_param 
    AND status IN ('pending', 'in_progress');

    -- If no pending matches and we're at the final round, tournament is complete
    IF remaining_matches = 0 THEN
        -- Get the winner from the final match
        SELECT winner_id INTO final_winner_id
        FROM public.tournament_matches
        WHERE tournament_id = tournament_id_param 
        AND round_number = bracket_progress_record.total_rounds
        AND winner_id IS NOT NULL;

        -- Update tournament status
        UPDATE public.tournaments
        SET 
            status = 'completed',
            winner_user_id = final_winner_id,
            end_date = now(),
            updated_at = now()
        WHERE id = tournament_id_param;
    END IF;
END;
$$;

-- Function to increment tournament participant count (for team registrations)
CREATE OR REPLACE FUNCTION increment_tournament_participants(tournament_id_param uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.tournaments
    SET current_participants = current_participants + 1,
        updated_at = now()
    WHERE id = tournament_id_param;
END;
$$;

-- Function to get tournament format info
CREATE OR REPLACE FUNCTION get_tournament_format_info(tournament_id_param uuid)
RETURNS TABLE (
    tournament_id uuid,
    format text,
    team_size integer,
    is_team_tournament boolean
)
LANGUAGE plpgsql
AS $$
DECLARE
    tournament_format text;
    calculated_team_size integer;
BEGIN
    SELECT t.format INTO tournament_format
    FROM public.tournaments t
    WHERE t.id = tournament_id_param;
    
    -- Calculate team size from format
    calculated_team_size := CASE 
        WHEN tournament_format LIKE '%v%' THEN 
            CAST(SPLIT_PART(tournament_format, 'v', 1) AS INTEGER)
        ELSE 1
    END;
    
    RETURN QUERY SELECT 
        tournament_id_param,
        tournament_format,
        calculated_team_size,
        calculated_team_size > 1;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION generate_team_tournament_bracket(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION set_team_tournament_match_result(uuid, uuid, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION check_tournament_completion(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_tournament_participants(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_tournament_format_info(uuid) TO authenticated;

-- Update the existing generate_tournament_bracket function to use the new team-aware version
CREATE OR REPLACE FUNCTION generate_tournament_bracket(tournament_id_param uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Use the enhanced team tournament bracket generation
    PERFORM generate_team_tournament_bracket(tournament_id_param);
END;
$$;

COMMIT;