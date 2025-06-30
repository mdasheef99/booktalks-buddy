-- Books Section Foundation Migration
-- Generated on 2025-01-28
-- Purpose: Create complete database foundation for Books Section

-- Enable pgcrypto for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table: personal_books
-- Stores books added to users personal libraries (completely separate from club nominations)
CREATE TABLE IF NOT EXISTS personal_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    google_books_id TEXT NOT NULL,
    title TEXT NOT NULL CHECK (char_length(title) <= 500),
    author TEXT NOT NULL CHECK (char_length(author) <= 300),
    cover_url TEXT,
    description TEXT CHECK (char_length(description) <= 2000),
    genre TEXT CHECK (char_length(genre) <= 100),
    published_date TEXT,
    page_count INTEGER CHECK (page_count > 0),
    isbn TEXT,
    added_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- Prevent duplicate books per user
    UNIQUE(user_id, google_books_id)
);

-- Table: reading_lists
-- Combined reading lists, ratings, and reviews (60% complexity reduction)
CREATE TABLE IF NOT EXISTS reading_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    book_id UUID REFERENCES personal_books(id) ON DELETE CASCADE NOT NULL,

    -- Reading status
    status TEXT CHECK (status IN ('want_to_read', 'currently_reading', 'completed')) NOT NULL,

    -- Combined rating and review (simplified storage)
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT CHECK (char_length(review_text) <= 2000),

    -- Simple privacy controls (boolean flags)
    is_public BOOLEAN DEFAULT true NOT NULL,
    review_is_public BOOLEAN DEFAULT true NOT NULL,

    -- Timestamps
    added_at TIMESTAMPTZ DEFAULT now(),
    status_changed_at TIMESTAMPTZ DEFAULT now(),
    rated_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- One entry per book per user
    UNIQUE(user_id, book_id)
);

-- Table: book_collections
-- User-created custom book collections/lists
CREATE TABLE IF NOT EXISTS book_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL CHECK (char_length(name) <= 100 AND char_length(name) >= 1),
    description TEXT CHECK (char_length(description) <= 500),

    -- Simple privacy control
    is_public BOOLEAN DEFAULT true NOT NULL,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: collection_books
-- Books within collections (many-to-many relationship)
CREATE TABLE IF NOT EXISTS collection_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID REFERENCES book_collections(id) ON DELETE CASCADE NOT NULL,
    book_id UUID REFERENCES personal_books(id) ON DELETE CASCADE NOT NULL,
    notes TEXT CHECK (char_length(notes) <= 500),
    added_at TIMESTAMPTZ DEFAULT now(),

    -- Prevent duplicate books in same collection
    UNIQUE(collection_id, book_id)
);

-- =========================
-- Table: user_book_interactions
-- =========================
-- Track user interactions for basic recommendation engine
CREATE TABLE IF NOT EXISTS user_book_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    book_google_id TEXT NOT NULL,
    interaction_type TEXT CHECK (interaction_type IN ('added', 'rated', 'reviewed', 'completed', 'removed')) NOT NULL,
    interaction_value INTEGER, -- Rating value if applicable (1-5)
    metadata JSONB, -- Additional interaction data
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =========================
-- Extend existing table: book_availability_requests
-- =========================
-- Add columns for authenticated user requests (minimal extension)
ALTER TABLE book_availability_requests 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS google_books_id TEXT,
ADD COLUMN IF NOT EXISTS request_source TEXT DEFAULT 'anonymous' CHECK (request_source IN ('anonymous', 'authenticated_user'));

-- Update existing rows to have request_source = 'anonymous'
UPDATE book_availability_requests 
SET request_source = 'anonymous' 
WHERE request_source IS NULL;

-- =========================
-- Performance Indexes
-- =========================

-- Personal books indexes
CREATE INDEX IF NOT EXISTS idx_personal_books_user_id ON personal_books(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_books_google_id ON personal_books(google_books_id);
CREATE INDEX IF NOT EXISTS idx_personal_books_user_google ON personal_books(user_id, google_books_id);
CREATE INDEX IF NOT EXISTS idx_personal_books_added_at ON personal_books(added_at DESC);

-- Reading lists indexes
CREATE INDEX IF NOT EXISTS idx_reading_lists_user_id ON reading_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_lists_book_id ON reading_lists(book_id);
CREATE INDEX IF NOT EXISTS idx_reading_lists_user_status ON reading_lists(user_id, status);
CREATE INDEX IF NOT EXISTS idx_reading_lists_public ON reading_lists(user_id, is_public);
CREATE INDEX IF NOT EXISTS idx_reading_lists_reviews_public ON reading_lists(user_id, review_is_public) WHERE review_text IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reading_lists_status_changed ON reading_lists(status_changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_reading_lists_rated_at ON reading_lists(rated_at DESC) WHERE rating IS NOT NULL;

-- Collections indexes
CREATE INDEX IF NOT EXISTS idx_book_collections_user_id ON book_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_book_collections_public ON book_collections(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_book_collections_created_at ON book_collections(created_at DESC);

-- Collection books indexes
CREATE INDEX IF NOT EXISTS idx_collection_books_collection_id ON collection_books(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_books_book_id ON collection_books(book_id);
CREATE INDEX IF NOT EXISTS idx_collection_books_added_at ON collection_books(added_at DESC);

-- User interactions indexes
CREATE INDEX IF NOT EXISTS idx_user_book_interactions_user_id ON user_book_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_book_interactions_book_google_id ON user_book_interactions(book_google_id);
CREATE INDEX IF NOT EXISTS idx_user_book_interactions_type ON user_book_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_user_book_interactions_created_at ON user_book_interactions(created_at DESC);

-- Extended store requests indexes
CREATE INDEX IF NOT EXISTS idx_book_availability_requests_user_id ON book_availability_requests(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_book_availability_requests_source ON book_availability_requests(request_source);
CREATE INDEX IF NOT EXISTS idx_book_availability_requests_google_id ON book_availability_requests(google_books_id) WHERE google_books_id IS NOT NULL;

-- =========================
-- Row Level Security (RLS) Policies
-- =========================

-- Enable RLS on all new tables
ALTER TABLE personal_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_book_interactions ENABLE ROW LEVEL SECURITY;

-- Personal books policies
CREATE POLICY "Users can view their own personal books" ON personal_books
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own personal books" ON personal_books
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own personal books" ON personal_books
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own personal books" ON personal_books
    FOR DELETE USING (auth.uid() = user_id);

-- Reading lists policies
CREATE POLICY "Users can view their own reading lists" ON reading_lists
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public reading lists" ON reading_lists
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can insert their own reading list entries" ON reading_lists
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reading list entries" ON reading_lists
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reading list entries" ON reading_lists
    FOR DELETE USING (auth.uid() = user_id);

-- Book collections policies
CREATE POLICY "Users can view their own collections" ON book_collections
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public collections" ON book_collections
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can insert their own collections" ON book_collections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections" ON book_collections
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections" ON book_collections
    FOR DELETE USING (auth.uid() = user_id);

-- Collection books policies (inherit from collection ownership)
CREATE POLICY "Users can view books in accessible collections" ON collection_books
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM book_collections bc 
            WHERE bc.id = collection_books.collection_id 
            AND (bc.user_id = auth.uid() OR bc.is_public = true)
        )
    );

CREATE POLICY "Users can manage books in their own collections" ON collection_books
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM book_collections bc 
            WHERE bc.id = collection_books.collection_id 
            AND bc.user_id = auth.uid()
        )
    );

-- User interactions policies
CREATE POLICY "Users can view their own interactions" ON user_book_interactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interactions" ON user_book_interactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =========================
-- Triggers for updated_at timestamps
-- =========================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at columns
CREATE TRIGGER update_personal_books_updated_at BEFORE UPDATE ON personal_books
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reading_lists_updated_at BEFORE UPDATE ON reading_lists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_book_collections_updated_at BEFORE UPDATE ON book_collections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================
-- Comments for documentation
-- =========================

COMMENT ON TABLE personal_books IS 'User personal book libraries - completely separate from club nominations';
COMMENT ON TABLE reading_lists IS 'Combined reading lists, ratings, and reviews with privacy controls';
COMMENT ON TABLE book_collections IS 'User-created custom book collections/lists';
COMMENT ON TABLE collection_books IS 'Many-to-many relationship between collections and books';
COMMENT ON TABLE user_book_interactions IS 'Track user interactions for recommendation engine';

COMMENT ON COLUMN reading_lists.is_public IS 'Controls visibility of book in reading list to other users';
COMMENT ON COLUMN reading_lists.review_is_public IS 'Controls visibility of review text to other users';
COMMENT ON COLUMN book_collections.is_public IS 'Controls visibility of entire collection to other users';

-- Migration complete
SELECT 'Books Section Foundation Migration completed successfully' AS status;
