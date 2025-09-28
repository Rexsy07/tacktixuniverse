-- Update minimum stake to 500 and remove maximum stake limits
-- This sets min_stake to 500 for all games and game modes, and max_stake to a very high number (essentially unlimited)

BEGIN;

-- Update all games to have min_stake of 500 and max_stake of 10,000,000 (essentially unlimited)
UPDATE public.games 
SET 
  min_stake = 500,
  max_stake = 10000000,
  updated_at = now()
WHERE min_stake != 500 OR max_stake != 10000000;

-- Update all game modes to have min_stake of 500 and max_stake of 10,000,000 (essentially unlimited)
UPDATE public.game_modes 
SET 
  min_stake = 500,
  max_stake = 10000000
WHERE min_stake != 500 OR max_stake != 10000000;

-- Verify the changes
SELECT 
  'games' as table_name,
  name,
  min_stake,
  max_stake
FROM public.games
UNION ALL
SELECT 
  'game_modes' as table_name,
  name,
  min_stake,
  max_stake
FROM public.game_modes
ORDER BY table_name, name;

COMMIT;