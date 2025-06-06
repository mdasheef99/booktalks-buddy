# Phase 3 Events Migration - Execution Guide

## 🚨 **IMPORTANT: Database Issues Resolved**

The Events tab errors you're experiencing are due to missing database functions and tables. This guide will fix both issues:

1. **404 Error on `get_club_meetings`** - Function doesn't exist yet
2. **"profiles" table error** - Migration script was using wrong table name

## ✅ **CORRECTED MIGRATION SCRIPT**

**File to Execute:** `002_club_events_foundation_corrected.sql`

**Key Corrections Made:**
- ✅ Uses `public.users` table instead of `profiles` table
- ✅ Proper PostgreSQL function handling with DROP FUNCTION
- ✅ Idempotent execution (safe to run multiple times)
- ✅ Self-contained with all dependencies

## 📋 **STEP-BY-STEP EXECUTION**

### **Step 1: Access Supabase SQL Editor**
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Create a new query

### **Step 2: Execute the Migration**
1. Copy the entire contents of `002_club_events_foundation_corrected.sql`
2. Paste into the SQL Editor
3. Click **Run** to execute the migration

### **Step 3: Verify Execution**
After running the migration, you should see these success messages:
```
NOTICE: Club Management Phase 3 Events Migration Completed Successfully
NOTICE: Tables created: club_meetings, club_event_notifications
NOTICE: Functions created: get_club_meetings, create_meeting_notifications, get_club_meeting_analytics
NOTICE: Updated function: get_club_analytics_summary (now includes meeting metrics)
NOTICE: RLS policies, indexes, and triggers applied
NOTICE: Migration script: 002_club_events_foundation_corrected.sql
NOTICE: CORRECTED: Uses public.users table instead of profiles table
```

### **Step 4: Test the Events Tab**
1. Go back to your BookConnect application
2. Navigate to Club Management
3. Click on the **Events** tab
4. The tab should now load without errors

## 🔍 **VERIFICATION QUERIES**

After migration, you can verify everything was created correctly:

```sql
-- Check tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('club_meetings', 'club_event_notifications');

-- Check functions were created
SELECT routine_name FROM information_schema.routines 
WHERE routine_name IN ('get_club_meetings', 'create_meeting_notifications', 'get_club_meeting_analytics');

-- Test the main function (replace 'your-club-id' with actual club ID)
SELECT * FROM get_club_meetings('your-club-id-here', false, 10, 0);

-- Check analytics function includes meeting metrics
SELECT * FROM get_club_analytics_summary('your-club-id-here');
```

## 🛠️ **TROUBLESHOOTING**

### **If Migration Fails:**

1. **Permission Error:**
   ```sql
   -- Ensure you have proper permissions
   SELECT current_user, session_user;
   ```

2. **Table Already Exists Error:**
   - The migration is idempotent, but if you get conflicts, run:
   ```sql
   DROP TABLE IF EXISTS club_meetings CASCADE;
   DROP TABLE IF EXISTS club_event_notifications CASCADE;
   -- Then re-run the migration
   ```

3. **Function Conflicts:**
   ```sql
   -- Clean up any partial functions
   DROP FUNCTION IF EXISTS get_club_meetings(UUID, BOOLEAN, INTEGER, INTEGER);
   DROP FUNCTION IF EXISTS create_meeting_notifications(UUID, UUID, TEXT);
   DROP FUNCTION IF EXISTS get_club_meeting_analytics(UUID);
   DROP FUNCTION IF EXISTS get_club_analytics_summary(UUID);
   -- Then re-run the migration
   ```

### **If Events Tab Still Shows Errors:**

1. **Clear Browser Cache:** Hard refresh (Ctrl+F5 or Cmd+Shift+R)
2. **Check Network Tab:** Look for any remaining 404 errors
3. **Verify Club ID:** Ensure you're testing with a valid club ID

## 📊 **EXPECTED RESULTS**

After successful migration and testing:

### **Events Tab Should Display:**
- ✅ Events analytics card with meeting metrics
- ✅ "Upcoming Events" and "All Events" tabs
- ✅ "Create Meeting" button
- ✅ Empty state message: "No upcoming meetings scheduled"

### **Create Meeting Should Work:**
- ✅ Modal opens when clicking "Create Meeting"
- ✅ Form validation works
- ✅ Meeting types dropdown populated
- ✅ Date/time picker functional

### **Database Should Contain:**
- ✅ `club_meetings` table with proper constraints
- ✅ `club_event_notifications` table
- ✅ All database functions working
- ✅ RLS policies active
- ✅ Triggers for automatic notifications

## 🎯 **SUCCESS CRITERIA**

✅ **Migration Executed Successfully**
✅ **No 404 Errors on Events Tab**
✅ **No "profiles" Table Errors**
✅ **Events Analytics Display Correctly**
✅ **Create Meeting Modal Opens**
✅ **Database Functions Respond**

## 📞 **SUPPORT**

If you encounter any issues:

1. **Check the browser console** for JavaScript errors
2. **Check the Network tab** for API call failures
3. **Verify the migration** ran completely
4. **Test with a simple query** to ensure database connectivity

The corrected migration script should resolve all the database-related issues you're experiencing with the Events tab.

---

**File to Execute:** `docs/Club_management/migrations/002_club_events_foundation_corrected.sql`

**Status:** Ready for execution ✅
