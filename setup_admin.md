# Admin Panel Setup Instructions

## Problem Fixed ✅
I've updated the admin hooks to handle missing tables gracefully. The admin panel should now load without crashing, but you'll see warnings in the console about missing tables until you complete the setup.

## Step 1: Access Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor in the left sidebar
3. Create a new query

## Step 2: Run the Table Creation Script
Copy and paste the contents of `add_admin_tables.sql` into the SQL editor and execute it. This will:
- Create the `platform_fees` table for tracking revenue
- Create the `user_stats` table for user statistics  
- Set up proper RLS policies
- Populate the tables with existing data

## Step 3: Assign Admin Role
After creating the tables, find your user ID and assign the admin role:

```sql
-- First, find your user ID
SELECT user_id, username, full_name 
FROM profiles 
WHERE username = 'YOUR_USERNAME_HERE';

-- Then assign admin role (replace YOUR_USER_ID with actual UUID)
INSERT INTO user_roles (user_id, role) 
VALUES ('YOUR_USER_ID_HERE', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
```

## Step 4: Test Admin Access
1. **Refresh your browser** or restart your development server
2. **Sign out and sign back in** to trigger the role check
3. **Look for "Admin Panel" in your user dropdown menu** (click your profile icon in the header)
4. **Navigate to `/admin`** to access the admin dashboard

## Alternative: Quick Admin Setup
If you want to quickly test admin functionality, you can temporarily use the old email-based system by updating the hardcoded emails in `src/hooks/useAuth.tsx` line 34:

```typescript
const adminEmails = ['admin@tacktix.com', 'your-email@example.com'];
```

## Expected Result
- ✅ No more 404 errors in console
- ✅ Admin panel link appears in user menu
- ✅ Can access `/admin` route
- ✅ Admin dashboard loads with stats (may show 0s initially)
- ⚠️ Some features may need additional setup as you add more data

## Troubleshooting
- If you still don't see the admin panel link, check the browser console for any role-checking errors
- Make sure you're using the correct user ID (UUIDs from the auth.users table)
- Verify the `user_roles` table has your admin role entry
- Try signing out and back in to refresh the auth state