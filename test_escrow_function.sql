-- Test if _assert_balance_and_hold function exists and works
-- Step 1: Check if function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = '_assert_balance_and_hold' 
  AND routine_schema = 'public';

-- Step 2: Check a user's wallet balance (replace with your user ID)
-- SELECT user_id, balance FROM user_wallets WHERE user_id = 'your-user-id-here';

-- Step 3: Check current wallet holds for problematic match
SELECT 
    wh.user_id,
    p.username,
    wh.amount,
    wh.status,
    wh.created_at
FROM wallet_holds wh
LEFT JOIN profiles p ON p.user_id = wh.user_id
WHERE wh.match_id = '85516ef1-05fb-4b23-8326-659aa23dabf2'  -- Replace with your match ID
ORDER BY wh.created_at;

-- Step 4: Check match participants vs wallet holds
SELECT 
    'Participants' as type,
    mp.user_id,
    p.username,
    mp.team,
    mp.role,
    null::numeric as amount
FROM match_participants mp
LEFT JOIN profiles p ON p.user_id = mp.user_id
WHERE mp.match_id = '85516ef1-05fb-4b23-8326-659aa23dabf2'

UNION ALL

SELECT 
    'Wallet Holds' as type,
    wh.user_id,
    p.username,
    null as team,
    wh.status,
    wh.amount
FROM wallet_holds wh
LEFT JOIN profiles p ON p.user_id = wh.user_id
WHERE wh.match_id = '85516ef1-05fb-4b23-8326-659aa23dabf2'
ORDER BY type, username;