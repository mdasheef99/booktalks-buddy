# Profile Data Synchronization

This document explains how profile data is synchronized between Supabase Auth metadata and the users table.

## Overview

User profile data (bio, favorite_authors, favorite_genres) is stored in two places:

1. **Supabase Auth Metadata**: Used when a user views their own profile
2. **Users Table**: Used when other users view someone's profile

This dual storage approach is necessary because:
- Auth metadata is only accessible to the user themselves
- The users table is accessible to all users (with appropriate RLS policies)

## How It Works

### Profile Updates

When a user updates their profile:

1. The data is saved to Auth metadata:
   ```javascript
   await supabase.auth.updateUser({
     data: {
       bio: formData.bio,
       favorite_authors: formData.favorite_authors,
       favorite_genres: formData.favorite_genres
     }
   });
   ```

2. The data is also saved to the users table:
   ```javascript
   await updateBookClubProfile(profile.id, {
     username,
     bio,
     favorite_genres: favoriteGenres,
     favorite_authors: favoriteAuthors
   });
   ```

3. A sync function ensures the data is consistent:
   ```javascript
   await syncUserProfileToDatabase(profile.id);
   ```

### Profile Viewing

When viewing profiles:

- **Current User**: Data is fetched from Auth metadata
- **Other Users**: Data is fetched from the users table

## Implementation Files

- `src/lib/syncUserProfile.ts`: Function to sync Auth metadata to users table
- `src/components/profile/BookClubProfileSettings.tsx`: Profile editing component
- `src/components/profile/BookClubProfileHeader.tsx`: Profile display component
- `src/scripts/syncAllProfiles.ts`: Script to sync all existing users (run once)

## One-Time Sync

To sync all existing users' profiles, run:

```bash
npx ts-node -r tsconfig-paths/register src/scripts/syncAllProfiles.ts
```

## Data Types

The users table has the following columns:

- `bio`: TEXT
- `favorite_authors`: TEXT or JSONB
- `favorite_genres`: TEXT or JSONB

If these columns are TEXT type, arrays are stored as JSON strings. If they are JSONB type, arrays are stored as native JSON arrays.

## Troubleshooting

If profile data is not displaying correctly:

1. Check that the sync function is being called after profile updates
2. Verify that the users table has the correct columns
3. Run the one-time sync script to ensure all profiles are synchronized
4. Check the browser console for any errors during profile fetching
