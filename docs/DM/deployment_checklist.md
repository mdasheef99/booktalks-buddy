# Direct Messaging System - Deployment Checklist

## Pre-Deployment Verification

### ✅ Code Quality Checks
- [ ] TypeScript compilation successful (`npm run build`)
- [ ] All tests passing (`npm test`)
- [ ] No console errors in development
- [ ] All imports/exports working correctly

### ✅ Database Migration Files Ready
- [ ] `20241219_001_direct_messaging_schema.sql` - Creates tables and constraints
- [ ] `20241219_002_direct_messaging_rls.sql` - Sets up Row Level Security (fixed `rowsecurity`)
- [ ] `20241219_003_direct_messaging_functions.sql` - Creates functions (fixed entitlements integration)

## Deployment Steps

### Step 1: Execute Database Migrations

**In Supabase SQL Editor, run in order:**

1. **Schema Migration**
```sql
-- Execute: 20241219_001_direct_messaging_schema.sql
-- Creates: conversations, conversation_participants, direct_messages tables
```

2. **RLS Migration**
```sql
-- Execute: 20241219_002_direct_messaging_rls.sql
-- Creates: Row Level Security policies and helper function
-- Fixed: PostgreSQL column name issue (rowsecurity)
-- Fixed: Infinite recursion in conversation_participants policy
```

3. **Functions Migration**
```sql
-- Execute: 20241219_003_direct_messaging_functions.sql
-- Creates: Message retention and utility functions
-- Fixed: Uses actual BookConnect schema (users.account_tier)
```

### Step 2: Verify Database State

**Run verification script:**
```sql
-- Execute: docs/DM/migration_verification.sql
-- Checks: Tables, constraints, policies, functions
```

**Expected Results:**
- All tables exist and accessible
- RLS policies created (7 policies total)
- RLS helper function created (is_user_conversation_participant)
- All functions created successfully
- Foreign key constraints working
- No infinite recursion errors in RLS policies

### Step 3: Test Database Functions

**In Supabase SQL Editor:**
```sql
-- Test RLS policies
SELECT test_messaging_rls_policies();

-- Test user retention function (replace with actual user ID)
SELECT get_user_message_retention_days('your-user-id'::uuid);

-- Verify table access (should not cause infinite recursion)
SELECT COUNT(*) FROM conversation_participants;
SELECT COUNT(*) FROM conversations;
SELECT COUNT(*) FROM direct_messages;

-- Test RLS policies specifically
-- Execute: docs/DM/rls_policy_test.sql
```

### Step 4: Deploy Application Code

**Frontend Deployment:**
- [ ] Deploy updated TypeScript code
- [ ] Verify no build errors
- [ ] Check browser console for errors
- [ ] Test messaging UI loads correctly

### Step 5: Production Testing

**Basic Functionality Tests:**
- [ ] User can access messaging page without HTTP 500 errors
- [ ] Empty state displays correctly for users with no conversations
- [ ] Database verification function works (`verifyDatabaseTables()`)
- [ ] Error handling displays user-friendly messages

**Advanced Testing:**
- [ ] Create test conversation
- [ ] Send test message
- [ ] Verify message retention policies work
- [ ] Test RLS policies prevent unauthorized access

## Rollback Plan

**If issues occur:**

1. **Database Rollback:**
```sql
-- Remove functions
DROP FUNCTION IF EXISTS get_user_message_retention_days(UUID);
DROP FUNCTION IF EXISTS set_message_retention();
DROP FUNCTION IF EXISTS soft_delete_expired_messages();
DROP FUNCTION IF EXISTS cleanup_expired_messages();
DROP FUNCTION IF EXISTS get_user_retention_info(UUID);
DROP FUNCTION IF EXISTS get_unread_message_count(UUID, UUID);

-- Remove triggers
DROP TRIGGER IF EXISTS set_message_retention_trigger ON direct_messages;

-- Remove tables (WARNING: This will delete all data)
DROP TABLE IF EXISTS direct_messages CASCADE;
DROP TABLE IF EXISTS conversation_participants CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
```

2. **Application Rollback:**
- Revert to previous commit
- Remove messaging routes from navigation
- Hide messaging features in UI

## Post-Deployment Monitoring

**Monitor for:**
- HTTP 500 errors in Supabase logs
- TypeScript compilation errors
- User reports of messaging issues
- Database performance issues

**Key Metrics:**
- Conversation creation rate
- Message send success rate
- Database query performance
- Error rates in messaging functions

## Troubleshooting

**If HTTP 500 errors persist:**
1. Check Supabase logs for detailed error messages
2. Run migration verification script
3. Verify all migration files executed successfully
4. Check for missing table dependencies

**If RLS policies block access:**
1. Verify user authentication
2. Check policy conditions match user context
3. Test policies with actual user IDs
4. Review policy syntax for errors

**If functions fail:**
1. Check for missing table references
2. Verify user tier data exists
3. Test functions individually in SQL Editor
4. Check for permission issues

## Success Criteria

**Deployment is successful when:**
- [ ] No HTTP 500 errors in messaging system
- [ ] Users can access conversation list
- [ ] Empty state displays correctly
- [ ] Database functions execute without errors
- [ ] RLS policies allow authorized access
- [ ] TypeScript compilation clean
- [ ] All tests passing

## Support Contacts

**For deployment issues:**
- Database: Check Supabase dashboard and logs
- Frontend: Check browser console and build logs
- Functions: Test in Supabase SQL Editor

**Documentation:**
- `docs/DM/database_troubleshooting.md` - Comprehensive troubleshooting guide
- `docs/DM/migration_verification.sql` - Database state verification
- `docs/DM/implementation_progress.md` - Complete implementation history
