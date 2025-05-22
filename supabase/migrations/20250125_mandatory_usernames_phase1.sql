-- Mandatory Username Implementation - Phase 1
-- Generated on 2025-01-25
-- Implements mandatory usernames with unique constraints and display name support

-- Enable pgcrypto for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- SAFETY CHECKS
-- =========================

-- Step 1: Verify all users have usernames (safety check)
DO $$
DECLARE
    null_username_count INTEGER;
    empty_username_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_username_count 
    FROM users 
    WHERE username IS NULL;
    
    SELECT COUNT(*) INTO empty_username_count 
    FROM users 
    WHERE username = '';
    
    IF null_username_count > 0 THEN
        RAISE NOTICE 'Found % users with null usernames. These will need to be handled.', null_username_count;
    END IF;
    
    IF empty_username_count > 0 THEN
        RAISE NOTICE 'Found % users with empty usernames. These will need to be handled.', empty_username_count;
    END IF;
    
    RAISE NOTICE 'Username verification complete. Proceeding with schema updates.';
END $$;

-- =========================
-- SCHEMA UPDATES
-- =========================

-- Step 2: Add displayname field for dual-identity system
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS displayname TEXT;

-- Step 3: Add comment for documentation
COMMENT ON COLUMN users.displayname IS 
'User-customizable display name for friendly identification. Used alongside username for dual-identity system.';

-- Step 4: Update any null/empty usernames with generated values
UPDATE users 
SET username = CONCAT('user_', SUBSTRING(id::text, 1, 8))
WHERE username IS NULL OR username = '';

-- Step 5: Add unique constraint to username
DO $$
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'users_username_unique' 
        AND table_name = 'users'
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT users_username_unique UNIQUE (username);
        RAISE NOTICE 'Added unique constraint to username field';
    ELSE
        RAISE NOTICE 'Username unique constraint already exists';
    END IF;
END $$;

-- Step 6: Add NOT NULL constraint
ALTER TABLE users 
ALTER COLUMN username SET NOT NULL;

-- Step 7: Add length constraint (3-20 characters)
DO $$
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'users_username_length'
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT users_username_length 
        CHECK (LENGTH(username) >= 3 AND LENGTH(username) <= 20);
        RAISE NOTICE 'Added length constraint to username field';
    ELSE
        RAISE NOTICE 'Username length constraint already exists';
    END IF;
END $$;

-- Step 8: Add format constraint (alphanumeric + underscore only)
DO $$
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'users_username_format'
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT users_username_format 
        CHECK (username ~ '^[a-zA-Z0-9_]+$');
        RAISE NOTICE 'Added format constraint to username field';
    ELSE
        RAISE NOTICE 'Username format constraint already exists';
    END IF;
END $$;

-- Step 9: Add displayname length constraint (optional, max 50 chars)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'users_displayname_length'
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT users_displayname_length 
        CHECK (displayname IS NULL OR LENGTH(displayname) <= 50);
        RAISE NOTICE 'Added length constraint to displayname field';
    ELSE
        RAISE NOTICE 'Displayname length constraint already exists';
    END IF;
END $$;

-- =========================
-- INDEXES FOR PERFORMANCE
-- =========================

-- Step 10: Create case-insensitive index for username lookups
CREATE INDEX IF NOT EXISTS idx_users_username_lower 
ON users (LOWER(username));

-- Step 11: Create index for displayname searches (where not null)
CREATE INDEX IF NOT EXISTS idx_users_displayname 
ON users (displayname) 
WHERE displayname IS NOT NULL;

-- =========================
-- COMMENTS AND DOCUMENTATION
-- =========================

-- Update username column comment
COMMENT ON COLUMN users.username IS 
'Unique username for user identification and accountability. Required, 3-20 chars, alphanumeric + underscore only. Used in dual-identity system alongside displayname.';

-- =========================
-- VERIFICATION
-- =========================

-- Final verification
DO $$
DECLARE
    total_users INTEGER;
    users_with_usernames INTEGER;
    users_with_valid_usernames INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_users FROM users;
    SELECT COUNT(*) INTO users_with_usernames FROM users WHERE username IS NOT NULL AND username != '';
    SELECT COUNT(*) INTO users_with_valid_usernames FROM users WHERE LENGTH(username) >= 3 AND LENGTH(username) <= 20;
    
    RAISE NOTICE 'Migration verification:';
    RAISE NOTICE '- Total users: %', total_users;
    RAISE NOTICE '- Users with usernames: %', users_with_usernames;
    RAISE NOTICE '- Users with valid usernames: %', users_with_valid_usernames;
    
    IF total_users = users_with_usernames AND users_with_usernames = users_with_valid_usernames THEN
        RAISE NOTICE 'SUCCESS: All users have valid usernames';
    ELSE
        RAISE WARNING 'Some users may have invalid usernames. Manual review required.';
    END IF;
END $$;
