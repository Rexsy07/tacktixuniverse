-- ============================================================================
-- Quick setup: Make the first user in the system an admin
-- This is safe to run - it will only affect the first created user
-- ============================================================================

-- Make the first registered user an admin (by created_at timestamp)
INSERT INTO user_roles (user_id, role)
SELECT user_id, 'admin'
FROM profiles 
ORDER BY created_at ASC
LIMIT 1
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Verify the admin was created
SELECT 
    ur.user_id, 
    ur.role, 
    p.username, 
    p.full_name,
    p.created_at
FROM user_roles ur
LEFT JOIN profiles p ON ur.user_id = p.user_id
WHERE ur.role = 'admin'
ORDER BY p.created_at;

-- Optional: Make ALL current users admins (uncomment if you want this)
-- INSERT INTO user_roles (user_id, role)
-- SELECT user_id, 'admin'
-- FROM profiles 
-- ON CONFLICT (user_id) DO UPDATE SET role = 'admin';