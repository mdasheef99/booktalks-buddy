-- Pre-Migration Verification Script
-- Run this BEFORE executing the entitlements system extension migration

-- =========================
-- Check Required Dependencies
-- =========================

-- 1. Check if users table exists
SELECT 'users table exists' as check_name, 
       CASE WHEN EXISTS (
           SELECT FROM information_schema.tables 
           WHERE table_name = 'users'
       ) THEN 'PASS' ELSE 'FAIL' END as status;

-- 2. Check if account_tier column exists (required for migration)
SELECT 'account_tier column exists' as check_name,
       CASE WHEN EXISTS (
           SELECT FROM information_schema.columns 
           WHERE table_name = 'users' AND column_name = 'account_tier'
       ) THEN 'PASS' ELSE 'FAIL' END as status;

-- 3. Check if membership_tier column already exists
SELECT 'membership_tier column status' as check_name,
       CASE WHEN EXISTS (
           SELECT FROM information_schema.columns 
           WHERE table_name = 'users' AND column_name = 'membership_tier'
       ) THEN 'ALREADY EXISTS' ELSE 'WILL BE CREATED' END as status;

-- 4. Check if role_activity table already exists
SELECT 'role_activity table status' as check_name,
       CASE WHEN EXISTS (
           SELECT FROM information_schema.tables 
           WHERE table_name = 'role_activity'
       ) THEN 'ALREADY EXISTS' ELSE 'WILL BE CREATED' END as status;

-- =========================
-- Current Data Analysis
-- =========================

-- 5. Show current account_tier distribution
SELECT 'Current account_tier distribution' as info, 
       account_tier, 
       COUNT(*) as user_count
FROM users 
GROUP BY account_tier
ORDER BY account_tier;

-- 6. Check for users without account_tier
SELECT 'Users without account_tier' as check_name,
       COUNT(*) as count,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'NEEDS ATTENTION' END as status
FROM users 
WHERE account_tier IS NULL;

-- 7. Show total user count
SELECT 'Total users' as info, COUNT(*) as total_count FROM users;

-- =========================
-- Safety Checks
-- =========================

-- 8. Check if book_clubs table exists (referenced in migration)
SELECT 'book_clubs table exists' as check_name,
       CASE WHEN EXISTS (
           SELECT FROM information_schema.tables 
           WHERE table_name = 'book_clubs'
       ) THEN 'PASS' ELSE 'FAIL' END as status;

-- 9. Check if auth.users exists (referenced in foreign keys)
SELECT 'auth.users table exists' as check_name,
       CASE WHEN EXISTS (
           SELECT FROM information_schema.tables 
           WHERE table_schema = 'auth' AND table_name = 'users'
       ) THEN 'PASS' ELSE 'FAIL' END as status;

-- =========================
-- Summary
-- =========================
SELECT '=== PRE-MIGRATION CHECK COMPLETE ===' as summary;
SELECT 'If all checks show PASS, the migration can proceed safely.' as instruction;
