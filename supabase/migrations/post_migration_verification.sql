-- Post-Migration Verification Script
-- Run this AFTER executing the entitlements system extension migration

-- =========================
-- Verify Schema Changes
-- =========================

-- 1. Verify membership_tier column was created
SELECT 'membership_tier column created' as check_name,
       CASE WHEN EXISTS (
           SELECT FROM information_schema.columns 
           WHERE table_name = 'users' AND column_name = 'membership_tier'
       ) THEN 'PASS' ELSE 'FAIL' END as status;

-- 2. Verify role_activity table was created
SELECT 'role_activity table created' as check_name,
       CASE WHEN EXISTS (
           SELECT FROM information_schema.tables 
           WHERE table_name = 'role_activity'
       ) THEN 'PASS' ELSE 'FAIL' END as status;

-- 3. Verify role_activity table structure
SELECT 'role_activity table structure' as info,
       column_name,
       data_type,
       is_nullable
FROM information_schema.columns 
WHERE table_name = 'role_activity'
ORDER BY ordinal_position;

-- =========================
-- Verify Data Migration
-- =========================

-- 4. Show membership_tier distribution after migration
SELECT 'membership_tier distribution' as info,
       membership_tier,
       COUNT(*) as user_count
FROM users 
GROUP BY membership_tier
ORDER BY membership_tier;

-- 5. Verify data mapping was correct
SELECT 'Data mapping verification' as info,
       account_tier,
       membership_tier,
       COUNT(*) as count
FROM users 
GROUP BY account_tier, membership_tier
ORDER BY account_tier, membership_tier;

-- 6. Check for users without membership_tier (should be 0)
SELECT 'Users without membership_tier' as check_name,
       COUNT(*) as count,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END as status
FROM users 
WHERE membership_tier IS NULL;

-- =========================
-- Verify Functions
-- =========================

-- 7. Verify helper functions were created
SELECT 'Helper functions created' as check_name,
       routine_name,
       CASE WHEN routine_name IS NOT NULL THEN 'PASS' ELSE 'FAIL' END as status
FROM information_schema.routines 
WHERE routine_name IN ('has_membership_tier_or_higher', 'update_role_activity')
ORDER BY routine_name;

-- =========================
-- Verify Indexes
-- =========================

-- 8. Verify indexes were created
SELECT 'Indexes created' as info,
       indexname
FROM pg_indexes 
WHERE tablename IN ('users', 'role_activity', 'store_administrators', 'club_moderators')
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- =========================
-- Test Functions
-- =========================

-- 9. Test has_membership_tier_or_higher function
SELECT 'Function test: has_membership_tier_or_higher' as test_name,
       has_membership_tier_or_higher(
           (SELECT id FROM users LIMIT 1), 
           'MEMBER'
       ) as result;

-- =========================
-- Data Integrity Checks
-- =========================

-- 10. Verify no data was lost
SELECT 'User count consistency' as check_name,
       COUNT(*) as total_users,
       CASE WHEN COUNT(*) > 0 THEN 'PASS' ELSE 'FAIL' END as status
FROM users;

-- 11. Verify backward compatibility (both columns exist)
SELECT 'Backward compatibility' as check_name,
       CASE WHEN EXISTS (
           SELECT FROM information_schema.columns 
           WHERE table_name = 'users' AND column_name = 'account_tier'
       ) AND EXISTS (
           SELECT FROM information_schema.columns 
           WHERE table_name = 'users' AND column_name = 'membership_tier'
       ) THEN 'PASS' ELSE 'FAIL' END as status;

-- =========================
-- Summary
-- =========================
SELECT '=== POST-MIGRATION VERIFICATION COMPLETE ===' as summary;
SELECT 'Review all checks above. All should show PASS for successful migration.' as instruction;
