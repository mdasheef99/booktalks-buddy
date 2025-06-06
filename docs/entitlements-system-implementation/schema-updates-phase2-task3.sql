-- Database Schema Updates for Phase 2 Task 3: Backend Enforcement Logic
-- These updates enable full functionality of the backend enforcement system
-- Date: January 22, 2025

-- =============================================================================
-- STORES TABLE UPDATES
-- =============================================================================

-- Add column to control public club creation per store
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS allow_public_club_creation BOOLEAN DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN stores.allow_public_club_creation IS 
'Controls whether regular users can create clubs in this store. Store owners/managers can always create clubs.';

-- Create index for performance (if stores table is large)
CREATE INDEX IF NOT EXISTS idx_stores_allow_public_club_creation 
ON stores(allow_public_club_creation) 
WHERE allow_public_club_creation = false;

-- =============================================================================
-- BOOK_CLUBS TABLE UPDATES
-- =============================================================================

-- Add premium club designation
ALTER TABLE book_clubs 
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;

-- Add exclusive club designation  
ALTER TABLE book_clubs 
ADD COLUMN IF NOT EXISTS is_exclusive BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN book_clubs.is_premium IS 
'Premium clubs require PRIVILEGED tier membership to join';

COMMENT ON COLUMN book_clubs.is_exclusive IS 
'Exclusive clubs require PRIVILEGED_PLUS tier membership to join';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_book_clubs_is_premium 
ON book_clubs(is_premium) 
WHERE is_premium = true;

CREATE INDEX IF NOT EXISTS idx_book_clubs_is_exclusive 
ON book_clubs(is_exclusive) 
WHERE is_exclusive = true;

-- Add constraint to ensure exclusive clubs are also premium
ALTER TABLE book_clubs 
ADD CONSTRAINT chk_exclusive_implies_premium 
CHECK (NOT is_exclusive OR is_premium);

-- =============================================================================
-- USERS TABLE UPDATES
-- =============================================================================

-- Add direct messaging preference
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS allow_direct_messages BOOLEAN DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN users.allow_direct_messages IS 
'User preference for receiving direct messages. Users can opt-out for privacy.';

-- Create index for performance (most users will allow DMs)
CREATE INDEX IF NOT EXISTS idx_users_allow_direct_messages 
ON users(allow_direct_messages) 
WHERE allow_direct_messages = false;

-- Check if username column exists (likely already present)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'username'
    ) THEN
        -- Add username column if it doesn't exist
        ALTER TABLE users ADD COLUMN username VARCHAR(50) UNIQUE;
        
        -- Add comment
        COMMENT ON COLUMN users.username IS 
        'Unique username for user identification and mentions';
        
        -- Create index
        CREATE INDEX idx_users_username ON users(username);
        
        RAISE NOTICE 'Added username column to users table';
    ELSE
        RAISE NOTICE 'Username column already exists in users table';
    END IF;
END $$;

-- =============================================================================
-- DATA MIGRATION (OPTIONAL)
-- =============================================================================

-- Update existing data if needed
-- These are safe operations with the DEFAULT values set above

-- Example: Mark certain existing clubs as premium based on criteria
-- UPDATE book_clubs 
-- SET is_premium = true 
-- WHERE name ILIKE '%premium%' OR name ILIKE '%vip%';

-- Example: Mark certain clubs as exclusive based on criteria  
-- UPDATE book_clubs 
-- SET is_exclusive = true 
-- WHERE name ILIKE '%exclusive%' OR name ILIKE '%elite%';

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify the new columns were added successfully
SELECT 
    table_name,
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('stores', 'book_clubs', 'users')
    AND column_name IN (
        'allow_public_club_creation',
        'is_premium', 
        'is_exclusive',
        'allow_direct_messages',
        'username'
    )
ORDER BY table_name, column_name;

-- Check constraints
SELECT 
    constraint_name,
    table_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name IN ('stores', 'book_clubs', 'users')
    AND constraint_name LIKE '%premium%' OR constraint_name LIKE '%exclusive%';

-- =============================================================================
-- ROLLBACK SCRIPT (IF NEEDED)
-- =============================================================================

/*
-- CAUTION: Only run this if you need to rollback the changes
-- This will remove the new columns and their data

-- Remove constraints first
ALTER TABLE book_clubs DROP CONSTRAINT IF EXISTS chk_exclusive_implies_premium;

-- Remove indexes
DROP INDEX IF EXISTS idx_stores_allow_public_club_creation;
DROP INDEX IF EXISTS idx_book_clubs_is_premium;
DROP INDEX IF EXISTS idx_book_clubs_is_exclusive;
DROP INDEX IF EXISTS idx_users_allow_direct_messages;

-- Remove columns
ALTER TABLE stores DROP COLUMN IF EXISTS allow_public_club_creation;
ALTER TABLE book_clubs DROP COLUMN IF EXISTS is_premium;
ALTER TABLE book_clubs DROP COLUMN IF EXISTS is_exclusive;
ALTER TABLE users DROP COLUMN IF EXISTS allow_direct_messages;

-- Note: username column is not removed as it likely existed before
*/

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

DO $$ 
BEGIN
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'Phase 2 Task 3 Database Schema Updates Completed Successfully!';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'Added columns:';
    RAISE NOTICE '  - stores.allow_public_club_creation (controls club creation policy)';
    RAISE NOTICE '  - book_clubs.is_premium (requires PRIVILEGED tier)';
    RAISE NOTICE '  - book_clubs.is_exclusive (requires PRIVILEGED_PLUS tier)';
    RAISE NOTICE '  - users.allow_direct_messages (user privacy preference)';
    RAISE NOTICE '  - users.username (if not already present)';
    RAISE NOTICE '';
    RAISE NOTICE 'Backend enforcement logic now has full functionality enabled!';
    RAISE NOTICE 'Next step: Run Phase 2 Task 4 Integration Testing';
    RAISE NOTICE '=============================================================================';
END $$;
