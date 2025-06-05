# Club Ownership Filter Implementation

## Overview

This document describes the implementation of two filtering features for the BookTalks Buddy book club system:

1. **Club Ownership Filter** - Separates user's clubs into "Created Clubs" and "Joined Clubs"
2. **Enhanced Discovery Filtering** - Excludes user's own clubs and privileged creators from discovery

## Features Implemented

### Task 1: Club Ownership Filter on Main Book Club Page

**Location**: `/book-club` page (`src/pages/BookClubListPage.tsx`)

**Changes Made**:
- Added tab-based UI using existing Tabs component
- Split clubs into two categories:
  - **Created Clubs**: Clubs where `lead_user_id` equals current user's ID
  - **Joined Clubs**: Clubs where user is a member but NOT the creator
- Maintains existing grid card layout for both views

**New API Functions** (`src/lib/api/bookclubs/clubs.ts`):
- `getCreatedClubs(userId)`: Fetches clubs created by the user
- `getJoinedClubs(userId)`: Fetches clubs where user is member but not creator

### Task 2: Enhanced Discovery Page Filtering

**Location**: `/discover-clubs` page (backend logic only)

**Changes Made**:
- Enhanced `getDiscoverableClubs()` function in `src/lib/api/bookclubs/discovery.ts`
- Added filtering to exclude ONLY:
  - Clubs created by the current user (`lead_user_id` check)
  - Clubs where user is already a member
- **REMOVED privileged creator filtering** for maximum discoverability
- Maintains all existing UI, navigation, and functionality

## Technical Implementation

### Database Queries

**Created Clubs**:
```sql
SELECT * FROM book_clubs WHERE lead_user_id = $userId
```

**Joined Clubs**:
```sql
SELECT bc.* FROM book_clubs bc
JOIN club_members cm ON cm.club_id = bc.id
WHERE cm.user_id = $userId AND bc.lead_user_id != $userId
```

**Enhanced Discovery**:
```sql
-- Database level exclusion
SELECT bc.* FROM book_clubs bc
WHERE bc.lead_user_id != $userId
-- Additional client-side filtering for existing members only
```

### Component Structure

```
BookClubListPage (Enhanced)
├── Tabs (Created Clubs | Joined Clubs)
├── TabsContent
│   ├── CreatedClubsList → BookClubList(clubType="created")
│   └── JoinedClubsList → BookClubList(clubType="joined")
└── Discover Clubs Button (unchanged)
```

### API Changes

**New Exports** (`src/lib/api/index.ts`):
- `getCreatedClubs`
- `getJoinedClubs`

**Enhanced Function**:
- `getDiscoverableClubs` - now filters out user's clubs and privileged creators

## Usage

### Main Book Club Page
1. Navigate to `/book-club`
2. Use tabs to switch between "Created Clubs" and "Joined Clubs"
3. Both views display clubs in the existing grid format

### Discovery Page
1. Navigate to `/discover-clubs`
2. Only clubs that user can potentially join are shown
3. User's own clubs and privileged creator clubs are automatically excluded

## Backward Compatibility

- All existing functionality is preserved
- Original `getClubs()` function remains unchanged
- Discovery page UI and navigation unchanged
- Existing components work without modification

## Testing

To test the implementation:

1. **Created Clubs Tab**: Should show only clubs where user is the lead
2. **Joined Clubs Tab**: Should show only clubs where user is a member but not the lead
3. **Discovery Page**: Should exclude user's own clubs and privileged creator clubs
4. **Search/Filters**: Should continue working on discovery page
5. **Real-time Updates**: Should refresh when clubs are created/joined

## Files Modified

- `src/lib/api/bookclubs/clubs.ts` - Added new API functions
- `src/lib/api/bookclubs/discovery.ts` - Enhanced filtering logic
- `src/pages/BookClubListPage.tsx` - Added tab functionality
- `src/components/bookclubs/BookClubList.tsx` - Added clubType prop support

## Performance Considerations

- New queries are optimized with proper indexing on `lead_user_id`
- Discovery filtering is done efficiently with separate queries for creator tiers
- Real-time subscriptions continue to work for all views

## Troubleshooting

### Discovery Page Errors
If you encounter foreign key relationship errors in the discovery page:
- The implementation uses separate API calls to fetch creator membership tiers
- This avoids Supabase foreign key relationship issues
- All filtering is done in JavaScript after data retrieval

### Empty Results
- **Created Clubs**: Shows only clubs where user is the `lead_user_id`
- **Joined Clubs**: Shows only clubs where user is a member but NOT the creator
- **Discovery**: Excludes user's own clubs and privileged creator clubs

### Performance Notes
- Discovery page makes 2-3 API calls (clubs, memberships, creator tiers)
- Results are filtered client-side for maximum compatibility
- Pagination is applied AFTER filtering to ensure consistent results
- Consider server-side filtering for large datasets in production

### Bug Fixes Applied
- **Pagination Issue**: Fixed "All Clubs" showing fewer results than individual filters
  - Root cause: Pagination was applied before filtering
  - Solution: Moved pagination after client-side filtering
- **TypeScript Errors**: Added photo properties to BookClub type definition
- **Foreign Key Errors**: Used separate API calls instead of complex joins
