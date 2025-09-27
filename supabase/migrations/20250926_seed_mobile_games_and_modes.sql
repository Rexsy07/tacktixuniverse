-- Seed mobile games and their game modes without resetting any data
-- Idempotent: inserts only if rows are missing

DO $$
DECLARE
  g_codm uuid;
  g_pubg uuid;
  g_ff uuid;
  g_bs uuid;
  g_ss uuid;
  g_eafc uuid;
  g_pes uuid;
BEGIN
  -- 1) Games: create if missing and capture ids
  SELECT id INTO g_codm FROM public.games WHERE lower(name) = lower('Call of Duty: Mobile');
  IF NOT FOUND THEN
    INSERT INTO public.games (name, short_name, description, is_active)
    VALUES ('Call of Duty: Mobile', 'CODM', 'Mobile tactical FPS', true)
    RETURNING id INTO g_codm;
  END IF;

  SELECT id INTO g_pubg FROM public.games WHERE lower(name) = lower('PUBG Mobile');
  IF NOT FOUND THEN
    INSERT INTO public.games (name, short_name, description, is_active)
    VALUES ('PUBG Mobile', 'PUBG', 'Battle royale', true)
    RETURNING id INTO g_pubg;
  END IF;

  SELECT id INTO g_ff FROM public.games WHERE lower(name) = lower('Free Fire');
  IF NOT FOUND THEN
    INSERT INTO public.games (name, short_name, description, is_active)
    VALUES ('Free Fire', 'FF', 'Mobile battle royale', true)
    RETURNING id INTO g_ff;
  END IF;

  SELECT id INTO g_bs FROM public.games WHERE lower(name) = lower('Blood Strike');
  IF NOT FOUND THEN
    INSERT INTO public.games (name, short_name, description, is_active)
    VALUES ('Blood Strike', 'BS', 'Fast-paced FPS', true)
    RETURNING id INTO g_bs;
  END IF;

  SELECT id INTO g_ss FROM public.games WHERE lower(name) = lower('Sniper Strike');
  IF NOT FOUND THEN
    INSERT INTO public.games (name, short_name, description, is_active)
    VALUES ('Sniper Strike', 'SS', 'Sniper-focused shooter', true)
    RETURNING id INTO g_ss;
  END IF;

  SELECT id INTO g_eafc FROM public.games WHERE lower(name) = lower('EA FC Mobile');
  IF NOT FOUND THEN
    INSERT INTO public.games (name, short_name, description, is_active)
    VALUES ('EA FC Mobile', 'EAFC', 'Football simulation', true)
    RETURNING id INTO g_eafc;
  END IF;

  SELECT id INTO g_pes FROM public.games WHERE lower(name) = lower('eFootball / PES Mobile');
  IF NOT FOUND THEN
    INSERT INTO public.games (name, short_name, description, is_active)
    VALUES ('eFootball / PES Mobile', 'PES', 'Football simulation', true)
    RETURNING id INTO g_pes;
  END IF;

  -- Helper to insert a mode if missing
  -- Use a simple pattern: insert .. select .. where not exists
  -- Formats are stored as text[]

  -- 2) Call of Duty: Mobile modes
  INSERT INTO public.game_modes (game_id, name, description, formats)
  SELECT g_codm, 'Search & Destroy (S&D)', NULL, ARRAY['1v1','2v2','3v3','5v5']::text[]
  WHERE NOT EXISTS (
    SELECT 1 FROM public.game_modes WHERE game_id = g_codm AND lower(name) = lower('Search & Destroy (S&D)')
  );

  INSERT INTO public.game_modes (game_id, name, description, formats)
  SELECT g_codm, 'Hardpoint', NULL, ARRAY['2v2','3v3','5v5']::text[]
  WHERE NOT EXISTS (
    SELECT 1 FROM public.game_modes WHERE game_id = g_codm AND lower(name) = lower('Hardpoint')
  );

  INSERT INTO public.game_modes (game_id, name, description, formats)
  SELECT g_codm, 'Domination', NULL, ARRAY['2v2','3v3','5v5']::text[]
  WHERE NOT EXISTS (
    SELECT 1 FROM public.game_modes WHERE game_id = g_codm AND lower(name) = lower('Domination')
  );

  INSERT INTO public.game_modes (game_id, name, description, formats)
  SELECT g_codm, 'Team Deathmatch (TDM)', NULL, ARRAY['1v1','2v2','3v3','5v5']::text[]
  WHERE NOT EXISTS (
    SELECT 1 FROM public.game_modes WHERE game_id = g_codm AND lower(name) = lower('Team Deathmatch (TDM)')
  );

  INSERT INTO public.game_modes (game_id, name, description, formats)
  SELECT g_codm, 'Gunfight', NULL, ARRAY['1v1','2v2']::text[]
  WHERE NOT EXISTS (
    SELECT 1 FROM public.game_modes WHERE game_id = g_codm AND lower(name) = lower('Gunfight')
  );

  INSERT INTO public.game_modes (game_id, name, description, formats)
  SELECT g_codm, 'Snipers Only', NULL, ARRAY['1v1','2v2','3v3']::text[]
  WHERE NOT EXISTS (
    SELECT 1 FROM public.game_modes WHERE game_id = g_codm AND lower(name) = lower('Snipers Only')
  );

  INSERT INTO public.game_modes (game_id, name, description, formats)
  SELECT g_codm, 'Battle Royale (Classic)', NULL, ARRAY['1v1','2v2','4v4']::text[]
  WHERE NOT EXISTS (
    SELECT 1 FROM public.game_modes WHERE game_id = g_codm AND lower(name) = lower('Battle Royale (Classic)')
  );

  INSERT INTO public.game_modes (game_id, name, description, formats)
  SELECT g_codm, 'Battle Royale Kill Races', 'Most kills vs opponent team', ARRAY['1v1','2v2']::text[]
  WHERE NOT EXISTS (
    SELECT 1 FROM public.game_modes WHERE game_id = g_codm AND lower(name) = lower('Battle Royale Kill Races')
  );

  INSERT INTO public.game_modes (game_id, name, description, formats)
  SELECT g_codm, '1vX Clutch Bets', 'Solo vs multiple opponents', ARRAY['1v2','1v3','1v4']::text[]
  WHERE NOT EXISTS (
    SELECT 1 FROM public.game_modes WHERE game_id = g_codm AND lower(name) = lower('1vX Clutch Bets')
  );

  INSERT INTO public.game_modes (game_id, name, description, formats)
  SELECT g_codm, 'Fastest Round Wins (Speedrun)', 'Win rounds in the shortest time', ARRAY['1v1','2v2']::text[]
  WHERE NOT EXISTS (
    SELECT 1 FROM public.game_modes WHERE game_id = g_codm AND lower(name) = lower('Fastest Round Wins (Speedrun)')
  );

  -- 3) PUBG Mobile modes
  INSERT INTO public.game_modes (game_id, name, description, formats)
  SELECT g_pubg, 'Battle Royale (Classic)', NULL, ARRAY['1v1','2v2','4v4']::text[]
  WHERE NOT EXISTS (
    SELECT 1 FROM public.game_modes WHERE game_id = g_pubg AND lower(name) = lower('Battle Royale (Classic)')
  );

  INSERT INTO public.game_modes (game_id, name, description, formats)
  SELECT g_pubg, 'TDM (Team Deathmatch)', NULL, ARRAY['2v2','4v4']::text[]
  WHERE NOT EXISTS (
    SELECT 1 FROM public.game_modes WHERE game_id = g_pubg AND lower(name) = lower('TDM (Team Deathmatch)')
  );

  INSERT INTO public.game_modes (game_id, name, description, formats)
  SELECT g_pubg, 'Payload / Arena Challenges', NULL, ARRAY['2v2','4v4']::text[]
  WHERE NOT EXISTS (
    SELECT 1 FROM public.game_modes WHERE game_id = g_pubg AND lower(name) = lower('Payload / Arena Challenges')
  );

  -- 4) Free Fire modes
  INSERT INTO public.game_modes (game_id, name, description, formats)
  SELECT g_ff, 'Battle Royale (Classic & Ranked)', NULL, ARRAY['1v1','2v2','4v4']::text[]
  WHERE NOT EXISTS (
    SELECT 1 FROM public.game_modes WHERE game_id = g_ff AND lower(name) = lower('Battle Royale (Classic & Ranked)')
  );

  INSERT INTO public.game_modes (game_id, name, description, formats)
  SELECT g_ff, 'Clash Squad', 'Round-Based', ARRAY['4v4']::text[]
  WHERE NOT EXISTS (
    SELECT 1 FROM public.game_modes WHERE game_id = g_ff AND lower(name) = lower('Clash Squad')
  );

  INSERT INTO public.game_modes (game_id, name, description, formats)
  SELECT g_ff, 'Lone Wolf', NULL, ARRAY['1v1']::text[]
  WHERE NOT EXISTS (
    SELECT 1 FROM public.game_modes WHERE game_id = g_ff AND lower(name) = lower('Lone Wolf')
  );

  -- 5) Blood Strike modes
  INSERT INTO public.game_modes (game_id, name, description, formats)
  SELECT g_bs, 'Battle Royale', NULL, ARRAY['1v1','4v4']::text[]
  WHERE NOT EXISTS (
    SELECT 1 FROM public.game_modes WHERE game_id = g_bs AND lower(name) = lower('Battle Royale')
  );

  INSERT INTO public.game_modes (game_id, name, description, formats)
  SELECT g_bs, 'Team Deathmatch (TDM)', NULL, ARRAY['3v3','5v5']::text[]
  WHERE NOT EXISTS (
    SELECT 1 FROM public.game_modes WHERE game_id = g_bs AND lower(name) = lower('Team Deathmatch (TDM)')
  );

  INSERT INTO public.game_modes (game_id, name, description, formats)
  SELECT g_bs, 'Duel Mode', NULL, ARRAY['1v1','2v2']::text[]
  WHERE NOT EXISTS (
    SELECT 1 FROM public.game_modes WHERE game_id = g_bs AND lower(name) = lower('Duel Mode')
  );

  -- 6) Sniper Strike modes
  INSERT INTO public.game_modes (game_id, name, description, formats)
  SELECT g_ss, '1v1 Sniper Duels', NULL, ARRAY['1v1']::text[]
  WHERE NOT EXISTS (
    SELECT 1 FROM public.game_modes WHERE game_id = g_ss AND lower(name) = lower('1v1 Sniper Duels')
  );

  INSERT INTO public.game_modes (game_id, name, description, formats)
  SELECT g_ss, 'Sniper Deathmatch', NULL, ARRAY['1v1','3v3','5v5']::text[]
  WHERE NOT EXISTS (
    SELECT 1 FROM public.game_modes WHERE game_id = g_ss AND lower(name) = lower('Sniper Deathmatch')
  );

  INSERT INTO public.game_modes (game_id, name, description, formats)
  SELECT g_ss, 'Timed Kill Challenges (Speedrun)', 'e.g., First to 10 Kills', ARRAY['1v1']::text[]
  WHERE NOT EXISTS (
    SELECT 1 FROM public.game_modes WHERE game_id = g_ss AND lower(name) = lower('Timed Kill Challenges (Speedrun)')
  );

  -- 7) EA FC Mobile modes
  INSERT INTO public.game_modes (game_id, name, description, formats)
  SELECT g_eafc, 'Head-to-Head (Full Match)', NULL, ARRAY['1v1']::text[]
  WHERE NOT EXISTS (
    SELECT 1 FROM public.game_modes WHERE game_id = g_eafc AND lower(name) = lower('Head-to-Head (Full Match)')
  );

  INSERT INTO public.game_modes (game_id, name, description, formats)
  SELECT g_eafc, 'VS Attack', 'Time-limited goal race', ARRAY['1v1']::text[]
  WHERE NOT EXISTS (
    SELECT 1 FROM public.game_modes WHERE game_id = g_eafc AND lower(name) = lower('VS Attack')
  );

  INSERT INTO public.game_modes (game_id, name, description, formats)
  SELECT g_eafc, 'Goal Challenges', 'First to Score, Most Goals in 3 Minutes, Penalty Duels', ARRAY['1v1']::text[]
  WHERE NOT EXISTS (
    SELECT 1 FROM public.game_modes WHERE game_id = g_eafc AND lower(name) = lower('Goal Challenges')
  );

  -- 8) eFootball / PES Mobile modes
  INSERT INTO public.game_modes (game_id, name, description, formats)
  SELECT g_pes, 'Online Match (Full Match)', NULL, ARRAY['1v1']::text[]
  WHERE NOT EXISTS (
    SELECT 1 FROM public.game_modes WHERE game_id = g_pes AND lower(name) = lower('Online Match (Full Match)')
  );

  INSERT INTO public.game_modes (game_id, name, description, formats)
  SELECT g_pes, 'Event Mode / Quick Matches', 'Shorter halves', ARRAY['1v1']::text[]
  WHERE NOT EXISTS (
    SELECT 1 FROM public.game_modes WHERE game_id = g_pes AND lower(name) = lower('Event Mode / Quick Matches')
  );

  INSERT INTO public.game_modes (game_id, name, description, formats)
  SELECT g_pes, 'Skill Challenges / Custom Bets', 'First Goal Scorer, Highest Goal Difference, Player-specific wagers', ARRAY['1v1']::text[]
  WHERE NOT EXISTS (
    SELECT 1 FROM public.game_modes WHERE game_id = g_pes AND lower(name) = lower('Skill Challenges / Custom Bets')
  );
END$$;