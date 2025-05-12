# Post Reactions Feature

This document describes the post reactions feature for the BookConnect application's discussion system.

## Overview

The post reactions feature allows users to react to discussion posts with emoji reactions, similar to popular social media platforms. Users can add and remove reactions, and see how many reactions of each type a post has received.

## Features

- Six emoji reactions: 👍 (like), ❤️ (love), 😂 (laugh), 😮 (wow), 😢 (sad), 😡 (angry)
- Toggle behavior (clicking the same reaction again removes it)
- Reaction counts displayed next to each emoji
- Visual indicators for the user's own reactions
- Popover menu for selecting reactions

## Database Schema

The feature requires a new database table:

```sql
CREATE TABLE IF NOT EXISTS post_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES discussion_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    reaction_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

## Running Migrations

To enable this feature, you need to apply the database migration. Here's how to do it:

### Option 1: Using the Supabase CLI

If you have the Supabase CLI set up and your local Supabase instance running:

```bash
npx supabase migration up
```

### Option 2: Manually Apply the Migration (Recommended)

If you're having trouble with the CLI, you can manually apply the migration:

1. Open the Supabase dashboard (https://app.supabase.com)
2. Select your project
3. Go to the SQL Editor
4. Create a new query
5. Copy and paste the following SQL:

```sql
-- Create post_reactions table for discussion post reactions
CREATE TABLE IF NOT EXISTS post_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES discussion_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    reaction_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS post_reactions_post_id_idx ON post_reactions(post_id);
CREATE INDEX IF NOT EXISTS post_reactions_user_id_idx ON post_reactions(user_id);

-- Add RLS policies
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;

-- Anyone can read reactions
CREATE POLICY "Anyone can read reactions"
ON post_reactions FOR SELECT
USING (true);

-- Users can add their own reactions
CREATE POLICY "Users can add their own reactions"
ON post_reactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reactions
CREATE POLICY "Users can delete their own reactions"
ON post_reactions FOR DELETE
USING (auth.uid() = user_id);
```

6. Run the SQL commands

## Implementation Details

### API Functions

- `addReaction(userId, postId, reactionType)`: Add or remove a reaction
- `getPostReactions(postId)`: Get all reactions for a post
- `getReactionCounts(postId)`: Get counts of reactions by type
- `hasUserReacted(userId, postId, reactionType?)`: Check if a user has reacted

### Components

- `PostReactions`: Displays and manages reactions for a post

## Error Handling

The implementation includes graceful error handling for cases where:

- The database table doesn't exist yet
- The user is not authenticated
- There are network issues

## Future Enhancements

Potential future enhancements for the reactions feature:

1. Custom reactions
2. Reaction animations
3. Reaction notifications
4. Reaction analytics
