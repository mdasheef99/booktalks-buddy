# Direct Messaging Database Troubleshooting Guide

## Overview
This guide helps troubleshoot database schema and relationship issues in the Direct Messaging system.

## Common Issues & Solutions

### 1. PostgreSQL Column Error: `row_security` does not exist

**Error Message:**
```
ERROR: 42703: column "row_security" does not exist
HINT: Perhaps you meant to reference the column "pg_tables.rowsecurity".
```

**Solution:** ✅ **FIXED**
- Updated migration file `20241219_002_direct_messaging_rls.sql`
- Changed `row_security` to `rowsecurity` in all PostgreSQL queries
- This is the correct column name in PostgreSQL's `pg_tables` system table

### 2. Supabase Relationship Error: Could not find relationship

**Error Message:**
```
HTTP 400 Bad Request
PostgreSQL error PGRST200: "Could not find a relationship between 'conversations' and 'conversation_participants'"
```

**Solution:** ✅ **FIXED**
- Rewrote `getUserConversations()` function to use step-by-step queries
- Avoided complex nested join syntax that Supabase REST API struggles with
- Added proper error handling and database verification

### 3. HTTP 500 Internal Server Error

**Error Message:**
```
HTTP 500 Internal Server Error from Supabase REST API
Error getting user participation: Object
```

**Root Cause:** ✅ **FIXED**
- Functions migration file referenced non-existent tables (`user_entitlements`, `entitlements`, `system_logs`)
- Database functions were failing when trying to access these tables
- Updated functions to use actual BookConnect schema (`users.account_tier`, `users.membership_tier`)

**Solution:**
- Fixed `get_user_message_retention_days()` to use `users` table instead of entitlements tables
- Made `system_logs` references optional with proper error handling
- Enhanced error logging in `getUserConversations()` for better debugging

### 4. PostgreSQL Infinite Recursion in RLS Policies

**Error Message:**
```
PostgreSQL Error Code: 42P17
"infinite recursion detected in policy for relation 'conversation_participants'"
```

**Root Cause:** ✅ **FIXED**
- RLS policy for `conversation_participants` was self-referencing the same table
- Policy tried to check user participation by querying `conversation_participants` within its own policy
- Created circular dependency causing infinite recursion

**Solution:**
- Created `is_user_conversation_participant()` security definer function to bypass RLS
- Function performs the participation check without triggering RLS policies
- Updated RLS policy to use the helper function instead of direct table query

### 5. Empty Conversation List

**Issue:** Users see no conversations even when they should have some

**Debugging Steps:**
1. Use the database verification function:
```typescript
import { verifyDatabaseTables } from '@/lib/api/messaging';

// In your component or console
const tableStatus = await verifyDatabaseTables();
console.log('Database tables status:', tableStatus);
```

2. Run the migration verification script in Supabase SQL Editor:
```sql
-- File: docs/DM/migration_verification.sql
-- Comprehensive database state check
```

3. Check if tables exist in Supabase dashboard
4. Verify RLS policies are not blocking queries
5. Check user authentication state

## Database Migration Steps

### Step 1: Run Schema Migration
Execute in Supabase SQL Editor:
```sql
-- File: 20241219_001_direct_messaging_schema.sql
-- Creates tables: conversations, conversation_participants, direct_messages
```

### Step 2: Run RLS Migration
Execute in Supabase SQL Editor:
```sql
-- File: 20241219_002_direct_messaging_rls.sql
-- Creates Row Level Security policies
```

### Step 3: Verify Installation
Run the test function:
```sql
SELECT test_messaging_rls_policies();
```

Expected output:
```
RLS Policies Test Results:
✅ RLS enabled on conversations table
✅ RLS enabled on conversation_participants table
✅ RLS enabled on direct_messages table
Policies created: 7
```

## Query Structure Changes

### Before (Problematic)
```typescript
const { data, error } = await supabase
  .from('conversations')
  .select(`
    id,
    participants:conversation_participants!inner(
      user_id,
      user:users(id, username, displayname)
    )
  `)
  .eq('participants.user_id', userId);
```

### After (Working)
```typescript
// Step 1: Get conversation IDs
const { data: participantData } = await supabase
  .from('conversation_participants')
  .select('conversation_id')
  .eq('user_id', userId);

// Step 2: Get conversations
const { data: conversationData } = await supabase
  .from('conversations')
  .select('id, store_id, created_at, updated_at')
  .in('id', conversationIds);

// Step 3: Get participant details separately
const { data: participants } = await supabase
  .from('conversation_participants')
  .select(`
    user_id,
    last_read_at,
    users!inner(id, username, displayname)
  `)
  .eq('conversation_id', conv.id);
```

## Testing the Fixes

### 1. Component Testing
```bash
npm test -- --run src/components/messaging/components/__tests__/ConversationItem.test.tsx
```

### 2. Build Testing
```bash
npm run build
```

### 3. Database Connection Testing
```typescript
import { verifyDatabaseTables } from '@/lib/api/messaging';

// Test in browser console or component
verifyDatabaseTables().then(console.log);
```

## Production Deployment Checklist

- [ ] ✅ Migration files corrected (`rowsecurity` instead of `row_security`)
- [ ] ✅ Query structure updated to work with Supabase REST API
- [ ] ✅ TypeScript compilation successful
- [ ] ✅ Component tests passing
- [ ] ✅ Empty state handling implemented
- [ ] ✅ Error handling enhanced
- [ ] ✅ Database verification function available

## Support

If you encounter issues:

1. **Check browser console** for detailed error messages
2. **Run database verification** using `verifyDatabaseTables()`
3. **Verify Supabase connection** in Network tab
4. **Check RLS policies** in Supabase dashboard
5. **Review migration execution** in Supabase SQL Editor

The Direct Messaging system is now ready for production deployment with all database schema and query issues resolved.
