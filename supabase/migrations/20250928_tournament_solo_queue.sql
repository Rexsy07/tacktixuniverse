-- Solo queue support for team tournaments (per-player entry fees on assignment)
-- File: supabase/migrations/20250928_tournament_solo_queue.sql

-- 1) Queue table
CREATE TABLE IF NOT EXISTS public.tournament_solo_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, user_id)
);

-- 2) RPC: register_tournament_solo_queue
-- Enqueue a player (no charge yet). Validates registration status and team format.
CREATE OR REPLACE FUNCTION public.register_tournament_solo_queue(
  p_tournament_id uuid,
  p_user_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_t RECORD;
  v_exists boolean;
  v_team_size integer;
BEGIN
  -- Lock and verify tournament
  SELECT * INTO v_t FROM public.tournaments WHERE id = p_tournament_id FOR UPDATE;
  IF v_t IS NULL THEN RAISE EXCEPTION 'TOURNAMENT_NOT_FOUND'; END IF;
  IF v_t.status <> 'registration' THEN RAISE EXCEPTION 'REGISTRATION_CLOSED'; END IF;

  -- Must be a team tournament (e.g., '2v2','4v4')
  v_team_size := NULLIF(split_part(v_t.format, 'v', 1), '')::int;
  IF v_team_size IS NULL OR v_team_size < 2 THEN
    RAISE EXCEPTION 'NOT_A_TEAM_TOURNAMENT';
  END IF;

  -- Prevent duplicate in queue
  SELECT EXISTS (
    SELECT 1 FROM public.tournament_solo_queue
    WHERE tournament_id = p_tournament_id AND user_id = p_user_id
  ) INTO v_exists;
  IF v_exists THEN RAISE EXCEPTION 'ALREADY_IN_QUEUE'; END IF;

  -- Prevent duplicate in an existing team
  SELECT EXISTS (
    SELECT 1 FROM public.tournament_team_participants
    WHERE tournament_id = p_tournament_id
      AND (captain_id = p_user_id OR p_user_id = ANY(members))
  ) INTO v_exists;
  IF v_exists THEN RAISE EXCEPTION 'ALREADY_IN_TEAM'; END IF;

  -- Enqueue
  INSERT INTO public.tournament_solo_queue (tournament_id, user_id) VALUES (p_tournament_id, p_user_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_tournament_solo_queue(uuid, uuid) TO authenticated;

-- 3) RPC: assign_solo_teams_if_possible
-- Forms as many teams as capacity allows by selecting earliest queued players with sufficient balance.
-- Charges each player entry_fee, inserts a team, increments current_participants, removes from queue.
CREATE OR REPLACE FUNCTION public.assign_solo_teams_if_possible(
  p_tournament_id uuid
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_t RECORD;
  v_team_size int;
  v_capacity int;
  v_formed int := 0;
  v_entry_fee numeric;
  v_players uuid[];
BEGIN
  SELECT * INTO v_t FROM public.tournaments WHERE id = p_tournament_id FOR UPDATE;
  IF v_t IS NULL OR v_t.status <> 'registration' THEN RETURN 0; END IF;

  v_team_size := NULLIF(split_part(v_t.format, 'v', 1), '')::int;
  IF v_team_size IS NULL OR v_team_size < 2 THEN RETURN 0; END IF;

  v_entry_fee := COALESCE(v_t.entry_fee, 0);
  v_capacity := GREATEST(v_t.max_participants - COALESCE(v_t.current_participants, 0), 0);

  LOOP
    EXIT WHEN v_capacity <= 0;

    -- Pick earliest players with sufficient balance (avoid blocking)
    SELECT array_agg(q.user_id ORDER BY q.joined_at) INTO v_players
    FROM (
      SELECT s.user_id, s.joined_at
      FROM public.tournament_solo_queue s
      JOIN public.user_wallets w ON w.user_id = s.user_id AND w.balance >= v_entry_fee
      WHERE s.tournament_id = p_tournament_id
      ORDER BY s.joined_at
      LIMIT v_team_size
    ) q;

    IF v_players IS NULL OR array_length(v_players,1) < v_team_size THEN
      EXIT; -- not enough eligible players
    END IF;

    -- Debit each player
    IF v_entry_fee > 0 THEN
      UPDATE public.user_wallets
         SET balance = balance - v_entry_fee, updated_at = now()
       WHERE user_id = ANY(v_players);

      -- Record per-player transactions
      INSERT INTO public.transactions (id, user_id, type, amount, status, reference_code, created_at, updated_at)
      SELECT gen_random_uuid(), unnest(v_players), 'tournament_entry', v_entry_fee, 'completed', 'TSOLO-' || left(p_tournament_id::text, 8), now(), now();
    END IF;

    -- Create a team entry (auto captain = first player, rest are members)
    INSERT INTO public.tournament_team_participants (tournament_id, team_name, captain_id, members)
    VALUES (p_tournament_id, 'AutoTeam-' || left(gen_random_uuid()::text, 4), v_players[1], v_players[2:array_length(v_players,1)]);

    -- Increment team count
    UPDATE public.tournaments
      SET current_participants = COALESCE(current_participants,0) + 1,
          updated_at = now()
      WHERE id = p_tournament_id;

    -- Remove assigned players from queue
    DELETE FROM public.tournament_solo_queue
    WHERE tournament_id = p_tournament_id AND user_id = ANY(v_players);

    v_formed := v_formed + 1;
    v_capacity := v_capacity - 1;
  END LOOP;

  RETURN v_formed;
END;
$$;

GRANT EXECUTE ON FUNCTION public.assign_solo_teams_if_possible(uuid) TO authenticated;