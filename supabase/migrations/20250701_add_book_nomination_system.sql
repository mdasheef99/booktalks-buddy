-- Book Nomination System Migration
-- Generated on 2025-07-01

-- Enable pgcrypto for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- Table: books
-- =========================
CREATE TABLE IF NOT EXISTS books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_books_id TEXT UNIQUE,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    cover_url TEXT,
    description TEXT,
    genre TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =========================
-- Table: book_nominations
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
ALTER TABLE book_nominations
ADD CONSTRAINT unique_book_per_club UNIQUE (club_id, book_id);

-- =========================
-- Table: book_likes
-- =========================
CREATE TABLE IF NOT EXISTS book_likes (
    nomination_id UUID REFERENCES book_nominations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (nomination_id, user_id)
);

-- =========================
-- Modify current_books table
-- =========================

-- First, check if the book_id column already exists
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

-- Check if the nomination_id column already exists
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
-- Data Migration for Existing Current Books
-- =========================

-- This will be executed for each existing current book:
-- 1. Create a book record for each current book
-- 2. Update the current_books record to reference the new book

-- Create a function to handle the migration
CREATE OR REPLACE FUNCTION migrate_current_books()
RETURNS void AS $$
DECLARE
    current_book RECORD;
    new_book_id UUID;
BEGIN
    -- Loop through each current book
    FOR current_book IN SELECT * FROM current_books WHERE book_id IS NULL LOOP
        -- Create a new book record
        INSERT INTO books (title, author, genre)
        VALUES (current_book.title, current_book.author, 'Unknown')
        RETURNING id INTO new_book_id;
        
        -- Update the current_books record to reference the new book
        UPDATE current_books
        SET book_id = new_book_id
        WHERE club_id = current_book.club_id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the migration function
SELECT migrate_current_books();

-- Drop the function after use
DROP FUNCTION migrate_current_books();

-- =========================
-- Enable Row Level Security
-- =========================
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_nominations ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_likes ENABLE ROW LEVEL SECURITY;

-- =========================
-- RLS Policies for books
-- =========================

-- Anyone can view books
CREATE POLICY "Anyone can view books"
ON books
FOR SELECT
USING (true);

-- =========================
-- RLS Policies for book_nominations
-- =========================

-- Club members can view nominations for their clubs
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

-- Club members can create nominations for their clubs
CREATE POLICY "Club members can create nominations"
ON book_nominations
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM club_members
        WHERE club_members.club_id = book_nominations.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role != 'pending'
    )
);

-- Club admins can update nominations
CREATE POLICY "Club admins can update nominations"
ON book_nominations
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM club_members
        WHERE club_members.club_id = book_nominations.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role = 'admin'
    )
);

-- =========================
-- RLS Policies for book_likes
-- =========================

-- Club members can view likes
CREATE POLICY "Club members can view likes"
ON book_likes
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM book_nominations
        JOIN club_members ON club_members.club_id = book_nominations.club_id
        WHERE book_nominations.id = book_likes.nomination_id
        AND club_members.user_id = auth.uid()
        AND club_members.role != 'pending'
    )
);

-- Club members can like nominations
CREATE POLICY "Club members can like nominations"
ON book_likes
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM book_nominations
        JOIN club_members ON club_members.club_id = book_nominations.club_id
        WHERE book_nominations.id = book_likes.nomination_id
        AND club_members.user_id = auth.uid()
        AND club_members.role != 'pending'
    )
    AND
    book_likes.user_id = auth.uid()
);

-- Users can only delete their own likes
CREATE POLICY "Users can delete their own likes"
ON book_likes
FOR DELETE
USING (
    book_likes.user_id = auth.uid()
);

-- =========================
-- Create indexes for performance
-- =========================
CREATE INDEX IF NOT EXISTS idx_book_nominations_club_id ON book_nominations(club_id);
CREATE INDEX IF NOT EXISTS idx_book_nominations_book_id ON book_nominations(book_id);
CREATE INDEX IF NOT EXISTS idx_book_nominations_status ON book_nominations(status);
CREATE INDEX IF NOT EXISTS idx_book_likes_nomination_id ON book_likes(nomination_id);
