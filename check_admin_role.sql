-- Check current user roles
SELECT 
    ur.user_id, 
    ur.role, 
    p.username, 
    p.full_name,
    ur.created_at
FROM user_roles ur
LEFT JOIN profiles p ON ur.user_id = p.user_id
ORDER BY ur.created_at DESC;

-- To assign admin role to a user, replace 'YOUR_USER_ID' with the actual user ID
-- You can get the user ID from the profiles table or from Supabase Auth dashboard

-- Example: Insert admin role for a user
-- INSERT INTO user_roles (user_id, role) 
-- VALUES ('YOUR_USER_ID', 'admin');

-- Or update existing role
-- UPDATE user_roles 
-- SET role = 'admin' 
-- WHERE user_id = 'YOUR_USER_ID';

-- To find your user ID, you can run:
SELECT user_id, username, full_name 
FROM profiles 
WHERE username = 'YOUR_USERNAME' OR full_name = 'YOUR_NAME';