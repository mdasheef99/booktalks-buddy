# Book Nomination Constraint Violation Fix

## Problem Analysis

### Original Issue
- **Error**: HTTP 409 Conflict with "duplicate key value violates unique constraint 'unique_book_per_club'"
- **Location**: `create.ts:96` and `BookNominationFormPage.tsx:125`
- **Root Cause**: Race condition and incomplete constraint handling in nomination creation

### Misconception Clarification
- **NOT RELATED** to Task 1 current book assignment changes
- Task 1 only modified `current_books` table operations
- This issue is in `book_nominations` table with `unique_book_per_club` constraint

## Root Cause Analysis

### Database Constraint
```sql
ALTER TABLE book_nominations
ADD CONSTRAINT unique_book_per_club UNIQUE (club_id, book_id);
```

### Original Flawed Logic
1. **Check** for existing nomination with specific status
2. **Race condition window** - another nomination could be inserted here
3. **Insert** new nomination - fails if duplicate exists
4. **Incomplete status handling** - only checked 'active', not 'selected'

### Problems Identified
1. **Race Condition**: Check-then-insert pattern without atomicity
2. **Incomplete Logic**: Didn't handle all nomination statuses properly
3. **Poor Error Handling**: Generic error messages for constraint violations
4. **Status Confusion**: Constraint applies to ALL nominations, not just 'active'

## Solution Implementation

### New Approach: Insert-First with Error Handling
```typescript
// 1. Try to insert directly (atomic operation)
const { data: nomination, error: insertError } = await supabase
  .from('book_nominations')
  .insert({ club_id, book_id, nominated_by: userId, status: 'active' })
  .select('id')
  .single();

// 2. Handle success case
if (!insertError && nomination) {
  return getNominationById(nomination.id, userId);
}

// 3. Handle constraint violation specifically
if (insertError?.code === '23505' && insertError.message.includes('unique_book_per_club')) {
  // Get existing nomination and handle based on status
  const existing = await getExistingNomination(club_id, book_id);
  
  if (existing.status === 'active') throw new Error('Already nominated');
  if (existing.status === 'selected') throw new Error('Already selected');
  if (existing.status === 'archived') return reactivateNomination(existing.id);
}
```

### Key Improvements

1. **Atomic Operation**: Insert-first eliminates race conditions
2. **Comprehensive Status Handling**: Handles active, selected, and archived states
3. **Specific Error Codes**: Uses PostgreSQL error codes for precise handling
4. **Better User Feedback**: Detailed error messages for different scenarios
5. **Reactivation Logic**: Properly handles archived nominations

## Error Handling Matrix

| Scenario | Status | Action | User Message |
|----------|--------|--------|--------------|
| New nomination | None | Create new | "Book nominated successfully" |
| Already active | active | Error | "Book already nominated" |
| Already selected | selected | Error | "Book already selected as current" |
| Previously archived | archived | Reactivate | "Book nominated successfully" |
| Constraint violation | Any | Specific error | Context-appropriate message |

## Testing Scenarios

### 1. Normal Flow
- ✅ Nominate new book successfully
- ✅ Verify nomination appears in list

### 2. Duplicate Prevention
- ✅ Try to nominate same book twice
- ✅ Verify appropriate error message
- ✅ Verify no duplicate entries in database

### 3. Status Transitions
- ✅ Nominate book (active)
- ✅ Select as current book (selected)
- ✅ Try to nominate again (should fail with "already selected")

### 4. Reactivation
- ✅ Nominate book (active)
- ✅ Archive nomination (archived)
- ✅ Nominate same book again (should reactivate)

### 5. Race Conditions
- ✅ Simulate concurrent nominations of same book
- ✅ Verify only one succeeds, others get appropriate errors

## Code Changes Summary

### `src/lib/api/bookclubs/nominations/create.ts`
- **Removed**: Check-then-insert pattern
- **Added**: Insert-first with constraint violation handling
- **Improved**: Status-specific error messages
- **Enhanced**: PostgreSQL error code handling

### `src/pages/BookNominationFormPage.tsx`
- **Added**: Specific toast messages for different error types
- **Improved**: Error categorization and user feedback
- **Enhanced**: Constraint violation detection

## Performance Impact

### Before
- 2 database queries: SELECT + INSERT
- Race condition window
- Potential for failed transactions

### After
- 1 database query for success case: INSERT
- 2 database queries for constraint violation: INSERT + SELECT
- No race conditions
- Atomic operations

## Database Integrity

### Maintained Constraints
- ✅ `unique_book_per_club` constraint still enforced
- ✅ No duplicate nominations possible
- ✅ Proper status transitions maintained

### Data Consistency
- ✅ Atomic operations prevent partial states
- ✅ Proper error handling prevents data corruption
- ✅ Status transitions follow business rules

## Backward Compatibility

- ✅ All existing API signatures unchanged
- ✅ Database schema unchanged
- ✅ UI behavior improved, not broken
- ✅ Error handling enhanced, not replaced

## Future Enhancements

1. **Batch Operations**: Handle multiple nominations atomically
2. **Soft Constraints**: Allow re-nomination with confirmation
3. **Audit Trail**: Track nomination history and changes
4. **Rate Limiting**: Prevent spam nominations
5. **Notification System**: Alert on nomination conflicts
