-- Add missing game_modes and formats for CODM, PUBG, Free Fire, EA FC, PES
-- This migration assumes games are already inserted with short_name values:
-- 'CODM', 'PUBG', 'FF', 'EA FC', 'PES'

-- CODM: Add Domination, Gunfight, Snipers Only, BR Classic, BR Kill Races,
-- 1vX Clutch Bets, Fastest Round Wins
INSERT INTO public.game_modes (game_id, name, description, formats, maps, min_stake, max_stake)
VALUES
  ((SELECT id FROM public.games WHERE short_name = 'CODM'), 'Domination', 'Capture and hold objectives to earn points', ARRAY['2v2','3v3','5v5'], ARRAY['Raid','Hackney Yard','Shoot House','Crossfire','Summit'], 300, 8000),
  ((SELECT id FROM public.games WHERE short_name = 'CODM'), 'Gunfight', 'Small-arena elimination with random loadouts', ARRAY['1v1','2v2'], ARRAY['Docks','King','Hill','Pine','Speedball'], 200, 6000),
  ((SELECT id FROM public.games WHERE short_name = 'CODM'), 'Snipers Only', 'Marksman-only duels and team fights', ARRAY['1v1','2v2','3v3'], ARRAY['Crossfire','Crash','Standoff','Tunisia','Highrise'], 200, 6000),
  ((SELECT id FROM public.games WHERE short_name = 'CODM'), 'Battle Royale (Classic)', 'Classic BR with kill race scoring', ARRAY['Solo','Duo','Squad'], ARRAY['Isolated','Blackout','Alcatraz'], 500, 15000),
  ((SELECT id FROM public.games WHERE short_name = 'CODM'), 'Battle Royale Kill Races', 'Timed or target kill races in BR', ARRAY['Solo','Duo'], ARRAY['Isolated','Blackout','Alcatraz'], 500, 15000),
  ((SELECT id FROM public.games WHERE short_name = 'CODM'), '1vX Clutch Bets', 'Clutch attempts against multiple opponents', ARRAY['1v2','1v3','1v4'], ARRAY['Standoff','Raid','Hackney Yard','Firing Range','Nuketown'], 200, 8000),
  ((SELECT id FROM public.games WHERE short_name = 'CODM'), 'Fastest Round Wins (Speedrun)', 'Race to fastest round wins', ARRAY['1v1','2v2'], ARRAY['Shipment','Rust','Dome','Killhouse'], 200, 6000);

-- PUBG Mobile: Add TDM and Payload/Arena Challenges
INSERT INTO public.game_modes (game_id, name, description, formats, maps, min_stake, max_stake)
VALUES
  ((SELECT id FROM public.games WHERE short_name = 'PUBG'), 'TDM (Team Deathmatch)', 'Close-quarters deathmatch in Arena', ARRAY['2v2','4v4'], ARRAY['Warehouse','Library','Ruins','Hangar'], 300, 8000),
  ((SELECT id FROM public.games WHERE short_name = 'PUBG'), 'Payload / Arena Challenges', 'Explosives and vehicles in Payload or Arena modes', ARRAY['2v2','4v4'], ARRAY['Sanhok Arena','Livik Arena','Payload'], 300, 8000);

-- Free Fire: Add BR Classic/Ranked and Lone Wolf
INSERT INTO public.game_modes (game_id, name, description, formats, maps, min_stake, max_stake)
VALUES
  ((SELECT id FROM public.games WHERE short_name = 'FF'), 'Battle Royale (Classic & Ranked)', 'Solo/Duo/Squad kill race in BR Classic or Ranked', ARRAY['Solo','Duo','Squad'], ARRAY['Bermuda','Purgatory','Kalahari','Alpine'], 200, 8000),
  ((SELECT id FROM public.games WHERE short_name = 'FF'), 'Lone Wolf', '1v1 round-based duels', ARRAY['1v1'], ARRAY['Iron Cage','Salahuddin'], 200, 6000);

-- EA FC Mobile: Add VS Attack and Goal Challenges
INSERT INTO public.game_modes (game_id, name, description, formats, maps, min_stake, max_stake)
VALUES
  ((SELECT id FROM public.games WHERE short_name = 'EA FC'), 'VS Attack', 'Time-limited goal race scenarios', ARRAY['1v1'], ARRAY['Training Arena','Neutral Ground'], 200, 6000),
  ((SELECT id FROM public.games WHERE short_name = 'EA FC'), 'Goal Challenges', 'First to Score / Most Goals in 3 Minutes / Penalty Duels', ARRAY['First to Score','Most Goals (3m)','Penalty Duels'], ARRAY['Allianz Arena','Old Trafford','Parc des Princes'], 200, 6000);

-- PES Mobile: Add Event/Quick Matches and Skill Challenges
INSERT INTO public.game_modes (game_id, name, description, formats, maps, min_stake, max_stake)
VALUES
  ((SELECT id FROM public.games WHERE short_name = 'PES'), 'Event Mode / Quick Matches', 'Shorter halves and quick online fixtures', ARRAY['1v1'], ARRAY['Camp Nou','San Siro','Emirates Stadium'], 150, 6000),
  ((SELECT id FROM public.games WHERE short_name = 'PES'), 'Skill Challenges / Custom Bets', 'First Goal Scorer, Highest Goal Difference, player-specific wagers', ARRAY['First to Score','Highest Goal Difference','Penalty Duels'], ARRAY['Signal Iduna Park','Allianz Stadium'], 150, 6000);


