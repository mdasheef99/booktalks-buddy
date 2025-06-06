-- =====================================================
-- Debug Moderator Query Issue
-- Comprehensive diagnostic queries to identify the database error
-- =====================================================

-- Step 1: Check if club_moderators table exists and its structure
SELECT 
  table_name,
  table_schema
FROM information_schema.tables 
WHERE table_name = 'club_moderators';

-- Step 2: Check club_moderators table schema
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'club_moderators' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 3: Check users table schema
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 4: Check foreign key relationships
SELECT
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name='club_moderators';

-- Step 5: Check RLS policies on club_moderators
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'club_moderators' 
AND schemaname = 'public'
ORDER BY policyname;

-- Step 6: Check RLS policies on users table
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'public'
ORDER BY policyname;

-- Step 7: Test basic club_moderators query (without join)
-- This should work if the table exists and RLS allows it
SELECT 
  id,
  club_id,
  user_id,
  role,
  is_active,
  analytics_access,
  appointed_at
FROM club_moderators 
WHERE is_active = true
LIMIT 3;

-- Step 8: Test basic users query
-- This should work if RLS policies allow it
SELECT 
  id,
  username,
  email,
  displayname
FROM users 
LIMIT 3;

-- Step 9: Test the problematic join query
-- This is the query that's likely failing
SELECT 
  cm.*,
  u.username,
  u.email,
  u.displayname
FROM club_moderators cm
LEFT JOIN users u ON u.id = cm.user_id
WHERE cm.is_active = true
LIMIT 3;

-- Step 10: Test Supabase-style join syntax
-- This tests the exact syntax we're using in the code
-- Note: This might not work in raw SQL but helps understand the structure

-- Step 11: Check if there are any moderators in the database
SELECT 
  COUNT(*) as total_moderators,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_moderators,
  COUNT(DISTINCT club_id) as clubs_with_moderators
FROM club_moderators;

-- Step 12: Check if there are users that match moderator user_ids
SELECT 
  cm.user_id,
  u.username,
  u.email,
  CASE WHEN u.id IS NULL THEN 'USER_NOT_FOUND' ELSE 'USER_EXISTS' END as user_status
FROM club_moderators cm
LEFT JOIN users u ON u.id = cm.user_id
WHERE cm.is_active = true
LIMIT 5;

-- Step 13: Check auth.users vs public.users discrepancy
-- This checks if the foreign key points to auth.users but we're querying public.users
SELECT 
  'auth.users' as table_name,
  COUNT(*) as user_count
FROM auth.users
UNION ALL
SELECT 
  'public.users' as table_name,
  COUNT(*) as user_count
FROM public.users;

-- Step 14: Test if current user has permissions to view moderators
-- Replace 'YOUR_CLUB_ID' with an actual club ID for testing
-- SELECT 
--   cm.*
-- FROM club_moderators cm
-- WHERE cm.club_id = 'YOUR_CLUB_ID'
-- AND cm.is_active = true;

-- Step 15: Check if current user is a club member (for RLS)
-- Replace 'YOUR_CLUB_ID' with an actual club ID for testing
-- SELECT 
--   cm.user_id,
--   cm.role,
--   cm.joined_at
-- FROM club_members cm
-- WHERE cm.club_id = 'YOUR_CLUB_ID'
-- AND cm.user_id = auth.uid();

-- =====================================================
-- EXPECTED RESULTS ANALYSIS
-- =====================================================

/*
TROUBLESHOOTING GUIDE:

1. If Step 1 returns no results:
   - club_moderators table doesn't exist
   - Run the migration scripts

2. If Step 7 fails:
   - RLS policies are blocking access
   - User doesn't have permission to view moderators
   - Check if user is a club member

3. If Step 8 fails:
   - RLS policies on users table are too restrictive
   - User can't access user profile data

4. If Step 9 fails but Steps 7&8 work:
   - JOIN between tables is blocked by RLS
   - Foreign key relationship issue

5. If Step 12 shows USER_NOT_FOUND:
   - Data integrity issue
   - Users referenced in club_moderators don't exist in users table

6. If Step 13 shows different counts:
   - auth.users vs public.users synchronization issue
   - Foreign keys point to wrong table

COMMON FIXES:
- Update RLS policies to allow joins
- Ensure users table has proper policies
- Check foreign key constraints
- Verify data integrity
*/
