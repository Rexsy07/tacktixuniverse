-- Step 1: Find recent 1v2 matches
SELECT 
    m.id as match_id,
    m.format,
    m.stake_amount,
    m.status,
    pc.username as creator,
    m.created_at,
    -- Current participants count
    (SELECT COUNT(*) FROM match_participants WHERE match_id = m.id) as participant_count,
    -- Current pot
    (SELECT COALESCE(SUM(amount), 0) FROM wallet_holds WHERE match_id = m.id AND status = 'held') as current_pot,
    -- Expected pot
    (m.stake_amount * 3) as expected_pot_1v2
FROM matches m
LEFT JOIN profiles pc ON pc.user_id = m.creator_id
WHERE m.format = '1v2' 
ORDER BY m.created_at DESC 
LIMIT 5;

-- Step 2: Once you have a match ID, copy it and run this (replace the UUID below):
-- SELECT 
--     'Match Details:' as section,
--     m.id,
--     m.format,
--     m.stake_amount,
--     m.status,
--     m.creator_id,
--     m.created_at
-- FROM matches m 
-- WHERE m.id = 'PASTE-MATCH-ID-HERE'
-- 
-- UNION ALL
-- 
-- SELECT 
--     'Participants:' as section,
--     mp.user_id::text,
--     p.username,
--     mp.team,
--     mp.role,
--     mp.joined_at::text
-- FROM match_participants mp
-- LEFT JOIN profiles p ON p.user_id = mp.user_id
-- WHERE mp.match_id = 'PASTE-MATCH-ID-HERE'
-- 
-- UNION ALL
-- 
-- SELECT 
--     'Wallet Holds:' as section,
--     wh.user_id::text,
--     p.username,
--     wh.amount::text,
--     wh.status,
--     wh.created_at::text
-- FROM wallet_holds wh
-- LEFT JOIN profiles p ON p.user_id = wh.user_id
-- WHERE wh.match_id = 'PASTE-MATCH-ID-HERE';

-- Step 3: Check if _assert_balance_and_hold function exists
SELECT routine_name, routine_definition
FROM information_schema.routines 
WHERE routine_name = '_assert_balance_and_hold' 
  AND routine_schema = 'public';

-- Step 4: Check if join_team_with_escrow function exists
SELECT routine_name, routine_definition
FROM information_schema.routines 
WHERE routine_name = 'join_team_with_escrow' 
  AND routine_schema = 'public';