# Club Events Authorization Fix

## Issue Summary

**Problem**: Club leads (users who created clubs) were unable to create events within their own clubs due to incorrect Row Level Security (RLS) policies.

**Error**: HTTP 403 Forbidden - "new row violates row-level security policy for table 'club_meetings'"

**Root Cause**: Mismatch between how club leadership is stored and how RLS policies check for club lead permissions.

## Technical Analysis

### The Problem

1. **Club Creation Process**:
   - When a user creates a club, they are stored as `book_clubs.lead_user_id`
   - They are also added to `club_members` table with `role = 'admin'` (not `'lead'`)

2. **RLS Policy Issue**:
   - The `club_meetings` RLS policy was checking for `role = 'lead'` in `club_members` table
   - But club creators have `role = 'admin'`, not `'lead'`
   - This caused the policy to fail, blocking event creation

3. **Inconsistent Data Model**:
   - `book_clubs.lead_user_id` = correct source of truth for club leadership
   - `club_members.role = 'lead'` = doesn't exist in the current data model
   - `club_members.role = 'admin'` = what club creators actually have

### Code Evidence

**Club Creation Logic** (`src/lib/api/bookclubs/clubs.ts`):
```typescript
// Create club with lead_user_id
const { data, error } = await supabase
  .from('book_clubs')
  .insert([{
    name: club.name,
    description: club.description,
    privacy: club.privacy,
    lead_user_id: userId,  // ✅ Correct leadership tracking
    access_tier_required: 'free'
  }])

// Add creator as admin member
const { error: memberError } = await supabase
  .from('club_members')
  .insert([{ user_id: userId, club_id: data.id, role: 'admin' }]); // ❌ Role is 'admin', not 'lead'
```

**Incorrect RLS Policy**:
```sql
CREATE POLICY "Club leads can manage meetings" ON club_meetings
  FOR ALL USING (
    club_id IN (
      SELECT club_id FROM club_members
      WHERE user_id = auth.uid() AND role = 'lead'  -- ❌ This role doesn't exist
    )
  );
```

## Solution

### 1. Fixed RLS Policies

**Corrected Policy** (uses `book_clubs.lead_user_id`):
```sql
CREATE POLICY "Club leads can manage meetings" ON club_meetings
  FOR ALL USING (
    club_id IN (
      SELECT id FROM book_clubs
      WHERE lead_user_id = auth.uid()  -- ✅ Uses correct leadership field
    )
  );
```

### 2. Added Missing Entitlements

**Added to `CLUB_LEAD_ENTITLEMENTS`**:
```typescript
export const CLUB_LEAD_ENTITLEMENTS = [
  // ... existing entitlements
  'CAN_MANAGE_CLUB_EVENTS', // ✅ New: Club leads can create and manage events
  ...CLUB_MODERATOR_ENTITLEMENTS
];
```

### 3. Migration Script

Created `fix_club_meetings_rls_policies.sql` to update existing database policies.

## Files Modified

1. **`docs/Club_management/migrations/002_club_events_foundation_corrected.sql`**
   - Fixed RLS policies to use `book_clubs.lead_user_id`

2. **`docs/Club_management/migrations/fix_club_meetings_rls_policies.sql`**
   - Standalone migration to fix existing database

3. **`src/lib/entitlements/constants.ts`**
   - Added `CAN_MANAGE_CLUB_EVENTS` to `CLUB_LEAD_ENTITLEMENTS`

## Expected Behavior After Fix

1. **Club leads can create events**: Users who created clubs can now create events within their clubs
2. **Proper authorization**: RLS policies correctly identify club leads using `book_clubs.lead_user_id`
3. **Entitlements alignment**: Club leads have the `CAN_MANAGE_CLUB_EVENTS` entitlement

## Testing Verification

To verify the fix:

1. **Create a club** as a Privileged+ user
2. **Navigate to the club's events section**
3. **Attempt to create an event**
4. **Expected result**: Event creation should succeed without RLS policy violations

## Implementation Notes

- The fix maintains backward compatibility
- No changes needed to existing club creation logic
- RLS policies now align with the actual data model
- Entitlements system properly supports club-level event management

## Related Issues

This fix resolves the authorization mismatch that was preventing Phase 3 Events Integration from working correctly for club leads.
