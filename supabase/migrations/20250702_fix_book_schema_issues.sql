-- Fix Book Schema Issues Migration
-- Generated on 2025-07-02

-- =========================
-- Fix books table
-- =========================

-- Check if google_books_id column exists in books table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'books' AND column_name = 'google_books_id'
    ) THEN
        -- Add google_books_id column
        ALTER TABLE books
        ADD COLUMN google_books_id TEXT UNIQUE;
    END IF;
END $$;

-- Check if description column exists in books table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'books' AND column_name = 'description'
    ) THEN
        -- Add description column
        ALTER TABLE books
        ADD COLUMN description TEXT;
    END IF;
END $$;

-- Make genre column nullable if it's not already
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'books' AND column_name = 'genre' AND is_nullable = 'NO'
    ) THEN
        -- Make genre column nullable
        ALTER TABLE books
        ALTER COLUMN genre DROP NOT NULL;
    END IF;
END $$;

-- =========================
-- Fix current_books table
-- =========================

-- Check if book_id column exists in current_books table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'current_books' AND column_name = 'book_id'
    ) THEN
        -- Add book_id column
        ALTER TABLE current_books
        ADD COLUMN book_id UUID REFERENCES books(id);
    END IF;
END $$;

-- Check if nomination_id column exists in current_books table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'current_books' AND column_name = 'nomination_id'
    ) THEN
        -- Add nomination_id column
        ALTER TABLE current_books
        ADD COLUMN nomination_id UUID REFERENCES book_nominations(id);
    END IF;
END $$;

-- =========================
-- Create book_nominations table if it doesn't exist
-- =========================
CREATE TABLE IF NOT EXISTS book_nominations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID REFERENCES book_clubs(id) ON DELETE CASCADE,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    nominated_by UUID REFERENCES auth.users(id),
    status TEXT CHECK (status IN ('active', 'selected', 'archived')) DEFAULT 'active',
    nominated_at TIMESTAMPTZ DEFAULT now()
);

-- Add a unique constraint to prevent duplicate nominations of the same book in a club
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.table_constraints
        WHERE constraint_name = 'unique_book_per_club' AND table_name = 'book_nominations'
    ) THEN
        ALTER TABLE book_nominations
        ADD CONSTRAINT unique_book_per_club UNIQUE (club_id, book_id);
    END IF;
END $$;

-- =========================
-- Create book_likes table if it doesn't exist
-- =========================
CREATE TABLE IF NOT EXISTS book_likes (
    nomination_id UUID REFERENCES book_nominations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (nomination_id, user_id)
);

-- =========================
-- Enable Row Level Security if not already enabled
-- =========================
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_nominations ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_likes ENABLE ROW LEVEL SECURITY;

-- =========================
-- Create RLS Policies if they don't exist
-- =========================

-- Books policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies
        WHERE tablename = 'books' AND policyname = 'Anyone can view books'
    ) THEN
        CREATE POLICY "Anyone can view books"
        ON books
        FOR SELECT
        USING (true);
    END IF;
END $$;

-- Book nominations policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies
        WHERE tablename = 'book_nominations' AND policyname = 'Club members can view nominations'
    ) THEN
        CREATE POLICY "Club members can view nominations"
        ON book_nominations
        FOR SELECT
        USING (
            EXISTS (
                SELECT 1 FROM club_members
                WHERE club_members.club_id = book_nominations.club_id
                AND club_members.user_id = auth.uid()
                AND club_members.role != 'pending'
            )
        );
    END IF;
END $$;

-- =========================
-- Create indexes for performance
-- =========================
CREATE INDEX IF NOT EXISTS idx_book_nominations_club_id ON book_nominations(club_id);
CREATE INDEX IF NOT EXISTS idx_book_nominations_book_id ON book_nominations(book_id);
CREATE INDEX IF NOT EXISTS idx_book_nominations_status ON book_nominations(status);
CREATE INDEX IF NOT EXISTS idx_book_likes_nomination_id ON book_likes(nomination_id);
CREATE INDEX IF NOT EXISTS idx_books_google_books_id ON books(google_books_id);
