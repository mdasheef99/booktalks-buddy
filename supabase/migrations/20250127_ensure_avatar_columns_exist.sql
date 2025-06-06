-- Ensure Avatar Columns Exist
-- Migration: 20250127_ensure_avatar_columns_exist.sql
-- Purpose: Ensure the multi-tier avatar columns exist in the users table

-- =========================
-- Add Avatar Columns if They Don't Exist
-- =========================

-- Add the new avatar columns (IF NOT EXISTS to avoid errors if they already exist)
DO $$ 
BEGIN
    -- Add avatar_thumbnail_url column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'avatar_thumbnail_url'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users ADD COLUMN avatar_thumbnail_url TEXT;
        COMMENT ON COLUMN public.users.avatar_thumbnail_url IS '100x100 avatar for navigation/small elements';
    END IF;

    -- Add avatar_medium_url column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'avatar_medium_url'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users ADD COLUMN avatar_medium_url TEXT;
        COMMENT ON COLUMN public.users.avatar_medium_url IS '300x300 avatar for lists/cards';
    END IF;

    -- Add avatar_full_url column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'avatar_full_url'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users ADD COLUMN avatar_full_url TEXT;
        COMMENT ON COLUMN public.users.avatar_full_url IS '600x600 avatar for profile pages';
    END IF;
END $$;

-- =========================
-- Verification
-- =========================

-- Check that all avatar columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
  AND table_schema = 'public'
  AND column_name LIKE '%avatar%'
ORDER BY column_name;
