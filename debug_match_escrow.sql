-- Debug query to investigate match escrow issues
-- Replace 'your-match-id-here' with the actual match ID

-- 1) Check match details
SELECT 
    m.id as match_id,
    m.format,
    m.stake_amount,
    m.status,
    m.creator_id,
    m.opponent_id,
    pc.username as creator_username,
    po.username as opponent_username,
    m.created_at
FROM matches m
LEFT JOIN profiles pc ON pc.user_id = m.creator_id
LEFT JOIN profiles po ON po.user_id = m.opponent_id
WHERE m.id = 'your-match-id-here';

-- 2) Check match participants (team members)
SELECT 
    mp.user_id,
    p.username,
    mp.team,
    mp.role,
    mp.joined_at
FROM match_participants mp
LEFT JOIN profiles p ON p.user_id = mp.user_id
WHERE mp.match_id = 'your-match-id-here'
ORDER BY mp.team, mp.role DESC;

-- 3) Check wallet holds (escrow)
SELECT 
    wh.user_id,
    p.username,
    wh.amount,
    wh.status,
    wh.created_at,
    wh.released_at
FROM wallet_holds wh
LEFT JOIN profiles p ON p.user_id = wh.user_id
WHERE wh.match_id = 'your-match-id-here'
ORDER BY wh.created_at;

-- 4) Check transactions related to this match
SELECT 
    t.user_id,
    p.username,
    t.amount,
    t.type,
    t.status,
    t.description,
    t.reference_code,
    t.created_at,
    t.metadata
FROM transactions t
LEFT JOIN profiles p ON p.user_id = t.user_id
WHERE t.metadata->>'match_id' = 'your-match-id-here'
ORDER BY t.created_at;

-- 5) Check current pot calculation
SELECT 
    COUNT(*) as total_holds,
    COUNT(CASE WHEN status = 'held' THEN 1 END) as active_holds,
    SUM(CASE WHEN status = 'held' THEN amount ELSE 0 END) as current_pot,
    SUM(amount) as total_amount_held
FROM wallet_holds 
WHERE match_id = 'your-match-id-here';

-- 6) Expected vs actual pot for match format
WITH match_info AS (
    SELECT 
        m.format,
        m.stake_amount,
        CASE 
            WHEN m.format = '1v1' THEN 2
            WHEN m.format = '1v2' THEN 3
            WHEN m.format = '1v3' THEN 4
            WHEN m.format = '1v4' THEN 5
            WHEN m.format = '2v2' THEN 4
            WHEN m.format = '3v3' THEN 6
            WHEN m.format = '4v4' THEN 8
            WHEN m.format = '5v5' THEN 10
            ELSE 2
        END as expected_participants
    FROM matches m 
    WHERE m.id = 'your-match-id-here'
),
current_pot AS (
    SELECT COALESCE(SUM(amount), 0) as actual_pot
    FROM wallet_holds 
    WHERE match_id = 'your-match-id-here' AND status = 'held'
)
SELECT 
    mi.format,
    mi.stake_amount,
    mi.expected_participants,
    (mi.stake_amount * mi.expected_participants) as expected_total_pot,
    cp.actual_pot,
    (cp.actual_pot::float / (mi.stake_amount * mi.expected_participants)::float * 100)::int as pot_percentage
FROM match_info mi, current_pot cp;