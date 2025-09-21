-- Seed games and their modes (idempotent)
-- Target schema: public.games, public.game_modes
-- Safe to run multiple times; uses WHERE NOT EXISTS guards

BEGIN;
SET search_path = public;

-- Helper note on max_players semantics:
-- max_players represents total participants in a match (sum of both sides for team formats)
-- Examples: 1v1 -> 2, 2v2 -> 4, 5v5 -> 10, Solo Kill Race (1 per side) -> 2, Duo Kill Race -> 4, Squad Kill Race (4 per side) -> 8

-- =============================
-- Call of Duty: Mobile
-- =============================
INSERT INTO public.games (name, short_name, description, cover_image_url)
SELECT 'Call of Duty: Mobile', 'CODM', 'Mobile FPS with multiplayer and battle royale modes', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.games WHERE name = 'Call of Duty: Mobile');

WITH g AS (
  SELECT id FROM public.games WHERE name = 'Call of Duty: Mobile'
)
-- Search & Destroy (S&D)
INSERT INTO public.game_modes (game_id, name, description, max_players)
SELECT g.id, m.name, m.description, m.max_players FROM g
CROSS JOIN (
  VALUES
    ('Search & Destroy (1v1)', 'S&D duels', 2),
    ('Search & Destroy (2v2)', 'S&D small teams', 4),
    ('Search & Destroy (3v3)', 'S&D mid teams', 6),
    ('Search & Destroy (5v5)', 'S&D standard competitive', 10)
) AS m(name, description, max_players)
WHERE NOT EXISTS (
  SELECT 1 FROM public.game_modes gm WHERE gm.game_id = (SELECT id FROM g) AND gm.name = m.name
);

WITH g AS (
  SELECT id FROM public.games WHERE name = 'Call of Duty: Mobile'
)
-- Hardpoint
INSERT INTO public.game_modes (game_id, name, description, max_players)
SELECT g.id, m.name, m.description, m.max_players FROM g
CROSS JOIN (
  VALUES
    ('Hardpoint (2v2)', 'Objective rotation, small teams', 4),
    ('Hardpoint (3v3)', 'Objective rotation, mid teams', 6),
    ('Hardpoint (5v5)', 'Objective rotation, standard competitive', 10)
) AS m(name, description, max_players)
WHERE NOT EXISTS (
  SELECT 1 FROM public.game_modes gm WHERE gm.game_id = (SELECT id FROM g) AND gm.name = m.name
);

WITH g AS (
  SELECT id FROM public.games WHERE name = 'Call of Duty: Mobile'
)
-- Domination
INSERT INTO public.game_modes (game_id, name, description, max_players)
SELECT g.id, m.name, m.description, m.max_players FROM g
CROSS JOIN (
  VALUES
    ('Domination (2v2)', 'Capture-and-hold, small teams', 4),
    ('Domination (3v3)', 'Capture-and-hold, mid teams', 6),
    ('Domination (5v5)', 'Capture-and-hold, standard competitive', 10)
) AS m(name, description, max_players)
WHERE NOT EXISTS (
  SELECT 1 FROM public.game_modes gm WHERE gm.game_id = (SELECT id FROM g) AND gm.name = m.name
);

WITH g AS (
  SELECT id FROM public.games WHERE name = 'Call of Duty: Mobile'
)
-- Team Deathmatch (TDM)
INSERT INTO public.game_modes (game_id, name, description, max_players)
SELECT g.id, m.name, m.description, m.max_players FROM g
CROSS JOIN (
  VALUES
    ('Team Deathmatch (1v1)', 'TDM duels', 2),
    ('Team Deathmatch (2v2)', 'TDM small teams', 4),
    ('Team Deathmatch (3v3)', 'TDM mid teams', 6),
    ('Team Deathmatch (5v5)', 'TDM standard competitive', 10)
) AS m(name, description, max_players)
WHERE NOT EXISTS (
  SELECT 1 FROM public.game_modes gm WHERE gm.game_id = (SELECT id FROM g) AND gm.name = m.name
);

WITH g AS (
  SELECT id FROM public.games WHERE name = 'Call of Duty: Mobile'
)
-- Gunfight
INSERT INTO public.game_modes (game_id, name, description, max_players)
SELECT g.id, m.name, m.description, m.max_players FROM g
CROSS JOIN (
  VALUES
    ('Gunfight (1v1)', 'Round-based duels with random loadouts', 2),
    ('Gunfight (2v2)', 'Round-based 2v2 with random loadouts', 4)
) AS m(name, description, max_players)
WHERE NOT EXISTS (
  SELECT 1 FROM public.game_modes gm WHERE gm.game_id = (SELECT id FROM g) AND gm.name = m.name
);

WITH g AS (
  SELECT id FROM public.games WHERE name = 'Call of Duty: Mobile'
)
-- Snipers Only
INSERT INTO public.game_modes (game_id, name, description, max_players)
SELECT g.id, m.name, m.description, m.max_players FROM g
CROSS JOIN (
  VALUES
    ('Snipers Only (1v1)', 'Sniper-only rules', 2),
    ('Snipers Only (2v2)', 'Sniper-only rules', 4),
    ('Snipers Only (3v3)', 'Sniper-only rules', 6)
) AS m(name, description, max_players)
WHERE NOT EXISTS (
  SELECT 1 FROM public.game_modes gm WHERE gm.game_id = (SELECT id FROM g) AND gm.name = m.name
);

WITH g AS (
  SELECT id FROM public.games WHERE name = 'Call of Duty: Mobile'
)
-- Battle Royale (Classic) - Kill Races
INSERT INTO public.game_modes (game_id, name, description, max_players)
SELECT g.id, m.name, m.description, m.max_players FROM g
CROSS JOIN (
  VALUES
    ('BR Classic - Solo Kill Race', 'Separate lobbies, kills compare', 2),
    ('BR Classic - Duo Kill Race', 'Separate lobbies, kills compare', 4),
    ('BR Classic - Squad Kill Race', 'Separate lobbies, kills compare', 8)
) AS m(name, description, max_players)
WHERE NOT EXISTS (
  SELECT 1 FROM public.game_modes gm WHERE gm.game_id = (SELECT id FROM g) AND gm.name = m.name
);

WITH g AS (
  SELECT id FROM public.games WHERE name = 'Call of Duty: Mobile'
)
-- Battle Royale Kill Races (explicit)
INSERT INTO public.game_modes (game_id, name, description, max_players)
SELECT g.id, m.name, m.description, m.max_players FROM g
CROSS JOIN (
  VALUES
    ('BR Kill Race - Solo', 'Kill race format', 2),
    ('BR Kill Race - Duo', 'Kill race format', 4)
) AS m(name, description, max_players)
WHERE NOT EXISTS (
  SELECT 1 FROM public.game_modes gm WHERE gm.game_id = (SELECT id FROM g) AND gm.name = m.name
);

WITH g AS (
  SELECT id FROM public.games WHERE name = 'Call of Duty: Mobile'
)
-- 1vX Clutch Bets
INSERT INTO public.game_modes (game_id, name, description, max_players)
SELECT g.id, m.name, m.description, m.max_players FROM g
CROSS JOIN (
  VALUES
    ('1vX Clutch Bets (1v2)', 'Clutch attempt vs multiple opponents', 3),
    ('1vX Clutch Bets (1v3)', 'Clutch attempt vs multiple opponents', 4),
    ('1vX Clutch Bets (1v4)', 'Clutch attempt vs multiple opponents', 5)
) AS m(name, description, max_players)
WHERE NOT EXISTS (
  SELECT 1 FROM public.game_modes gm WHERE gm.game_id = (SELECT id FROM g) AND gm.name = m.name
);

WITH g AS (
  SELECT id FROM public.games WHERE name = 'Call of Duty: Mobile'
)
-- Fastest Round Wins (Speedrun)
INSERT INTO public.game_modes (game_id, name, description, max_players)
SELECT g.id, m.name, m.description, m.max_players FROM g
CROSS JOIN (
  VALUES
    ('Fastest Round Wins (1v1)', 'Speedrun to win rounds', 2),
    ('Fastest Round Wins (2v2)', 'Speedrun to win rounds', 4)
) AS m(name, description, max_players)
WHERE NOT EXISTS (
  SELECT 1 FROM public.game_modes gm WHERE gm.game_id = (SELECT id FROM g) AND gm.name = m.name
);

-- =============================
-- PUBG Mobile
-- =============================
INSERT INTO public.games (name, short_name, description, cover_image_url)
SELECT 'PUBG Mobile', 'PUBG', 'Tactical battle royale for mobile', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.games WHERE name = 'PUBG Mobile');

WITH g AS (
  SELECT id FROM public.games WHERE name = 'PUBG Mobile'
)
INSERT INTO public.game_modes (game_id, name, description, max_players)
SELECT g.id, m.name, m.description, m.max_players FROM g
CROSS JOIN (
  VALUES
    ('BR Classic - Solo Kill Race', 'Separate lobbies, kills compare', 2),
    ('BR Classic - Duo Kill Race', 'Separate lobbies, kills compare', 4),
    ('BR Classic - Squad Kill Race', 'Separate lobbies, kills compare', 8),
    ('TDM (2v2)', 'Team Deathmatch 2v2', 4),
    ('TDM (4v4)', 'Team Deathmatch 4v4', 8),
    ('Payload / Arena (2v2)', 'Arena challenges', 4),
    ('Payload / Arena (4v4)', 'Arena challenges', 8)
) AS m(name, description, max_players)
WHERE NOT EXISTS (
  SELECT 1 FROM public.game_modes gm WHERE gm.game_id = (SELECT id FROM g) AND gm.name = m.name
);

-- =============================
-- Free Fire
-- =============================
INSERT INTO public.games (name, short_name, description, cover_image_url)
SELECT 'Free Fire', 'FF', 'Fast-paced mobile battle royale', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.games WHERE name = 'Free Fire');

WITH g AS (
  SELECT id FROM public.games WHERE name = 'Free Fire'
)
INSERT INTO public.game_modes (game_id, name, description, max_players)
SELECT g.id, m.name, m.description, m.max_players FROM g
CROSS JOIN (
  VALUES
    ('BR Classic - Solo Kill Race', 'Separate lobbies, kills compare', 2),
    ('BR Classic - Duo Kill Race', 'Separate lobbies, kills compare', 4),
    ('BR Classic - Squad Kill Race', 'Separate lobbies, kills compare', 8),
    ('Clash Squad (4v4)', 'Round-based 4v4', 8),
    ('Lone Wolf (1v1)', 'Duel mode', 2)
) AS m(name, description, max_players)
WHERE NOT EXISTS (
  SELECT 1 FROM public.game_modes gm WHERE gm.game_id = (SELECT id FROM g) AND gm.name = m.name
);

-- =============================
-- Blood Strike
-- =============================
INSERT INTO public.games (name, short_name, description, cover_image_url)
SELECT 'Blood Strike', 'BLOOD', 'Mobile FPS with BR and arena modes', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.games WHERE name = 'Blood Strike');

WITH g AS (
  SELECT id FROM public.games WHERE name = 'Blood Strike'
)
INSERT INTO public.game_modes (game_id, name, description, max_players)
SELECT g.id, m.name, m.description, m.max_players FROM g
CROSS JOIN (
  VALUES
    ('BR - Solo Kill Race', 'Separate lobbies, kills compare', 2),
    ('BR - Squad Kill Race', 'Separate lobbies, kills compare', 8),
    ('Team Deathmatch (3v3)', 'TDM mid teams', 6),
    ('Team Deathmatch (5v5)', 'TDM standard', 10),
    ('Duel Mode (1v1)', 'Duel arena', 2),
    ('Duel Mode (2v2)', 'Duel arena 2v2', 4)
) AS m(name, description, max_players)
WHERE NOT EXISTS (
  SELECT 1 FROM public.game_modes gm WHERE gm.game_id = (SELECT id FROM g) AND gm.name = m.name
);

-- =============================
-- Sniper Strike
-- =============================
INSERT INTO public.games (name, short_name, description, cover_image_url)
SELECT 'Sniper Strike', 'SNIPER', 'Mobile sniper-focused shooter', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.games WHERE name = 'Sniper Strike');

WITH g AS (
  SELECT id FROM public.games WHERE name = 'Sniper Strike'
)
INSERT INTO public.game_modes (game_id, name, description, max_players)
SELECT g.id, m.name, m.description, m.max_players FROM g
CROSS JOIN (
  VALUES
    ('1v1 Sniper Duel', 'Sniper duel', 2),
    ('Sniper Deathmatch - FFA', 'Free-for-all sniper DM', 8),
    ('Sniper Deathmatch (3v3)', 'Team sniper DM', 6),
    ('Sniper Deathmatch (5v5)', 'Team sniper DM', 10),
    ('Timed Kill Challenge - First to 10', 'Speedrun: first to N kills', 2)
) AS m(name, description, max_players)
WHERE NOT EXISTS (
  SELECT 1 FROM public.game_modes gm WHERE gm.game_id = (SELECT id FROM g) AND gm.name = m.name
);

-- =============================
-- EA FC Mobile
-- =============================
INSERT INTO public.games (name, short_name, description, cover_image_url)
SELECT 'EA FC Mobile', 'EAFC', 'Mobile football (soccer) by EA', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.games WHERE name = 'EA FC Mobile');

WITH g AS (
  SELECT id FROM public.games WHERE name = 'EA FC Mobile'
)
INSERT INTO public.game_modes (game_id, name, description, max_players)
SELECT g.id, m.name, m.description, m.max_players FROM g
CROSS JOIN (
  VALUES
    ('Head-to-Head (1v1)', 'Full match 1v1', 2),
    ('VS Attack (1v1)', 'Time-limited goal race', 2),
    ('Goal Challenge - First to Score', 'First team to score wins', 2),
    ('Goal Challenge - Most Goals in 3 Minutes', 'Highest goals in 3 minutes', 2),
    ('Penalty Duels (1v1)', 'Penalty shootout style', 2)
) AS m(name, description, max_players)
WHERE NOT EXISTS (
  SELECT 1 FROM public.game_modes gm WHERE gm.game_id = (SELECT id FROM g) AND gm.name = m.name
);

-- =============================
-- eFootball / PES Mobile
-- =============================
INSERT INTO public.games (name, short_name, description, cover_image_url)
SELECT 'eFootball / PES Mobile', 'PES', 'Konami football (soccer) on mobile', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.games WHERE name = 'eFootball / PES Mobile');

WITH g AS (
  SELECT id FROM public.games WHERE name = 'eFootball / PES Mobile'
)
INSERT INTO public.game_modes (game_id, name, description, max_players)
SELECT g.id, m.name, m.description, m.max_players FROM g
CROSS JOIN (
  VALUES
    ('Online Match (1v1)', 'Full online match 1v1', 2),
    ('Event/Quick Match (1v1)', 'Shorter halves quick match', 2),
    ('Skill Challenge - First Goal Scorer', 'Custom bet: first to score', 2),
    ('Skill Challenge - Highest Goal Difference', 'Custom bet: largest margin', 2),
    ('Skill Challenge - Player-specific Wager', 'Custom player performance bet', 2)
) AS m(name, description, max_players)
WHERE NOT EXISTS (
  SELECT 1 FROM public.game_modes gm WHERE gm.game_id = (SELECT id FROM g) AND gm.name = m.name
);

COMMIT;
