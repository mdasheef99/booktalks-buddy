-- OCR Book Scanning Feature Database Schema - REVISED
-- Generated on 2025-01-28
-- Purpose: Complete database schema for OCR book scanning functionality
-- MAJOR CHANGES: Direct integration with main inventory, new/used categorization, mandatory location tracking

-- Enable pgcrypto for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- Table: store_inventory (MAIN INVENTORY TABLE)
-- =========================
-- Main inventory table for all store-owned books (replaces separate scanned_inventory)
-- Handles both new books and used/second-hand books with clear categorization
CREATE TABLE IF NOT EXISTS store_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
    added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,

    -- Book identification
    google_books_id TEXT, -- NULL if not matched with Google Books API
    isbn TEXT,
    title TEXT NOT NULL CHECK (char_length(title) <= 500),
    author TEXT NOT NULL CHECK (char_length(author) <= 300),

    -- Book metadata (from Google Books API or manual entry)
    description TEXT CHECK (char_length(description) <= 2000),
    publisher TEXT CHECK (char_length(publisher) <= 200),
    published_date TEXT,
    page_count INTEGER CHECK (page_count > 0),
    language TEXT CHECK (char_length(language) <= 10),

    -- Categories and tags (ENHANCED)
    google_categories TEXT[], -- Categories from Google Books API
    custom_tags TEXT[], -- Store-specific tags
    genre TEXT CHECK (char_length(genre) <= 100),

    -- NEW/USED CATEGORIZATION (REQUIRED)
    book_type TEXT CHECK (book_type IN ('new', 'used')) NOT NULL,

    -- Physical book details
    condition TEXT CHECK (condition IN ('new', 'like_new', 'good', 'fair', 'poor')) NOT NULL,
    location TEXT NOT NULL CHECK (char_length(location) <= 100 AND char_length(location) >= 1), -- MANDATORY physical location
    quantity INTEGER DEFAULT 1 CHECK (quantity >= 0),

    -- Entry method tracking
    entry_method TEXT CHECK (entry_method IN ('ocr_scan', 'manual_entry', 'bulk_import')) NOT NULL,

    -- OCR and matching metadata (only for OCR-scanned books)
    ocr_confidence_score DECIMAL(3,2) CHECK (ocr_confidence_score >= 0 AND ocr_confidence_score <= 1),
    google_books_match_confidence DECIMAL(3,2) CHECK (google_books_match_confidence >= 0 AND google_books_match_confidence <= 1),
    is_manually_verified BOOLEAN DEFAULT false,
    requires_review BOOLEAN DEFAULT false,

    -- Image URLs
    cover_image_url TEXT, -- From Google Books API or uploaded
    scanned_image_url TEXT, -- Original scanned image (optional retention)

    -- Status and availability
    status TEXT CHECK (status IN ('active', 'sold', 'damaged', 'missing', 'reserved')) DEFAULT 'active',
    is_available_for_clubs BOOLEAN DEFAULT false, -- Can be used in book clubs
    is_available_for_sale BOOLEAN DEFAULT false, -- Future e-commerce integration

    -- Pricing (for future e-commerce)
    price_cents INTEGER CHECK (price_cents >= 0),
    original_price_cents INTEGER CHECK (original_price_cents >= 0),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    last_verified_at TIMESTAMPTZ,

    -- DUPLICATE PREVENTION: Prevent duplicate Google Books entries per store, book_type, and location
    UNIQUE(store_id, google_books_id, book_type, location) WHERE google_books_id IS NOT NULL,

    -- For manually entered books without Google Books ID, prevent title/author duplicates per store, type, location
    UNIQUE(store_id, title, author, book_type, location) WHERE google_books_id IS NULL
);

-- =========================
-- Table: ocr_scan_sessions
-- =========================
-- Tracks OCR scanning sessions for analytics and debugging
-- ENHANCED: Added scanning mode (new/used) and location tracking
CREATE TABLE IF NOT EXISTS ocr_scan_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,

    -- Session metadata
    session_start TIMESTAMPTZ DEFAULT now(),
    session_end TIMESTAMPTZ,
    total_processing_time_ms INTEGER,

    -- SCANNING MODE SELECTION (NEW REQUIREMENT)
    scanning_mode TEXT CHECK (scanning_mode IN ('new_books', 'used_books')) NOT NULL,
    location TEXT NOT NULL CHECK (char_length(location) <= 100 AND char_length(location) >= 1), -- MANDATORY location

    -- Image details
    original_image_url TEXT,
    image_file_size_bytes INTEGER,
    image_width INTEGER,
    image_height INTEGER,
    image_format TEXT CHECK (char_length(image_format) <= 10),

    -- OCR processing results
    books_detected INTEGER DEFAULT 0 CHECK (books_detected >= 0),
    books_confirmed INTEGER DEFAULT 0 CHECK (books_confirmed >= 0),
    books_rejected INTEGER DEFAULT 0 CHECK (books_rejected >= 0),
    books_manually_entered INTEGER DEFAULT 0 CHECK (books_manually_entered >= 0), -- NEW: manual fallback tracking

    -- API performance metrics
    google_vision_response_time_ms INTEGER,
    google_books_api_calls INTEGER DEFAULT 0,
    google_books_matches INTEGER DEFAULT 0,

    -- Success metrics
    overall_confidence_score DECIMAL(3,2) CHECK (overall_confidence_score >= 0 AND overall_confidence_score <= 1),
    session_success_rate DECIMAL(3,2) CHECK (session_success_rate >= 0 AND session_success_rate <= 1),

    -- Error tracking
    errors_encountered TEXT[], -- Array of error messages
    warnings_encountered TEXT[], -- Array of warning messages

    -- Device and context
    user_agent TEXT,
    device_type TEXT CHECK (device_type IN ('mobile', 'tablet', 'desktop')),
    camera_used BOOLEAN DEFAULT false,

    -- Status
    status TEXT CHECK (status IN ('in_progress', 'completed', 'failed', 'cancelled')) DEFAULT 'in_progress',

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =========================
-- Table: ocr_detected_books (TEMPORARY - 3-DAY CLEANUP)
-- =========================
-- Temporary storage for books detected in OCR session before confirmation
-- AUTO-CLEANUP: Records older than 3 days are automatically deleted
CREATE TABLE IF NOT EXISTS ocr_detected_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES ocr_scan_sessions(id) ON DELETE CASCADE NOT NULL,

    -- OCR extracted data
    raw_title TEXT CHECK (char_length(raw_title) <= 500),
    raw_author TEXT CHECK (char_length(raw_author) <= 300),
    raw_isbn TEXT,
    ocr_confidence DECIMAL(3,2) CHECK (ocr_confidence >= 0 AND ocr_confidence <= 1),

    -- Google Books API matching
    google_books_id TEXT,
    google_books_match_score DECIMAL(3,2) CHECK (google_books_match_score >= 0 AND google_books_match_score <= 1),
    suggested_title TEXT CHECK (char_length(suggested_title) <= 500),
    suggested_author TEXT CHECK (char_length(suggested_author) <= 300),
    suggested_cover_url TEXT,

    -- User decisions
    user_confirmed BOOLEAN DEFAULT false,
    user_rejected BOOLEAN DEFAULT false,
    user_modified_title TEXT CHECK (char_length(user_modified_title) <= 500),
    user_modified_author TEXT CHECK (char_length(user_modified_author) <= 300),

    -- Entry method (OCR or manual fallback)
    entry_method TEXT CHECK (entry_method IN ('ocr_detected', 'manual_entry')) DEFAULT 'ocr_detected',

    -- Final inventory entry (if confirmed) - UPDATED REFERENCE
    inventory_entry_id UUID REFERENCES store_inventory(id) ON DELETE SET NULL,

    -- Duplicate handling decision
    duplicate_resolution TEXT CHECK (duplicate_resolution IN ('new_entry', 'quantity_update', 'merge', 'skip')) DEFAULT 'new_entry',
    existing_inventory_id UUID REFERENCES store_inventory(id) ON DELETE SET NULL, -- Reference to existing book if duplicate

    -- Positioning in image (for multi-book detection)
    detection_box_x INTEGER,
    detection_box_y INTEGER,
    detection_box_width INTEGER,
    detection_box_height INTEGER,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =========================
-- Table: inventory_duplicate_matches
-- =========================
-- Tracks potential duplicate books for review and quantity management
-- ENHANCED: Focus on quantity updates rather than separate entries
CREATE TABLE IF NOT EXISTS inventory_duplicate_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,

    -- Books being compared - UPDATED REFERENCES
    detected_book_id UUID REFERENCES ocr_detected_books(id) ON DELETE CASCADE,
    existing_inventory_id UUID REFERENCES store_inventory(id) ON DELETE CASCADE,

    -- Matching details
    match_type TEXT CHECK (match_type IN ('google_books_id', 'isbn', 'title_author', 'fuzzy_match', 'exact_match')) NOT NULL,
    similarity_score DECIMAL(3,2) CHECK (similarity_score >= 0 AND similarity_score <= 1),

    -- QUANTITY MANAGEMENT FIELDS
    suggested_action TEXT CHECK (suggested_action IN ('update_quantity', 'merge_entries', 'keep_separate', 'update_location')) DEFAULT 'update_quantity',
    quantity_to_add INTEGER DEFAULT 1 CHECK (quantity_to_add > 0),

    -- Resolution
    status TEXT CHECK (status IN ('pending', 'quantity_updated', 'merged', 'kept_separate', 'ignored')) DEFAULT 'pending',
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT CHECK (char_length(resolution_notes) <= 500),

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- Prevent duplicate match records
    UNIQUE(detected_book_id, existing_inventory_id)
);

-- =========================
-- Enable Row Level Security
-- =========================
ALTER TABLE store_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocr_scan_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocr_detected_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_duplicate_matches ENABLE ROW LEVEL SECURITY;

-- =========================
-- RLS Policies for store_inventory (MAIN INVENTORY)
-- =========================

-- Store owners and managers can view their store's inventory
CREATE POLICY "Store admins can view their store inventory"
ON store_inventory
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM store_administrators sa
    WHERE sa.user_id = auth.uid()
    AND sa.store_id = store_inventory.store_id
    AND sa.role IN ('owner', 'manager')
  )
);

-- Store owners and managers can insert books to their store's inventory
CREATE POLICY "Store admins can insert to their store inventory"
ON store_inventory
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM store_administrators sa
    WHERE sa.user_id = auth.uid()
    AND sa.store_id = store_inventory.store_id
    AND sa.role IN ('owner', 'manager')
  )
);

-- Store owners and managers can update their store's inventory
CREATE POLICY "Store admins can update their store inventory"
ON store_inventory
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM store_administrators sa
    WHERE sa.user_id = auth.uid()
    AND sa.store_id = store_inventory.store_id
    AND sa.role IN ('owner', 'manager')
  )
);

-- Store owners can delete from their store's inventory
CREATE POLICY "Store owners can delete their store inventory"
ON store_inventory
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM store_administrators sa
    WHERE sa.user_id = auth.uid()
    AND sa.store_id = store_inventory.store_id
    AND sa.role = 'owner'
  )
);

-- =========================
-- RLS Policies for ocr_scan_sessions
-- =========================

-- Store admins can view their store's scan sessions
CREATE POLICY "Store admins can view their store scan sessions"
ON ocr_scan_sessions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM store_administrators sa
    WHERE sa.user_id = auth.uid()
    AND sa.store_id = ocr_scan_sessions.store_id
    AND sa.role IN ('owner', 'manager')
  )
);

-- Store admins can insert scan sessions for their store
CREATE POLICY "Store admins can insert scan sessions for their store"
ON ocr_scan_sessions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM store_administrators sa
    WHERE sa.user_id = auth.uid()
    AND sa.store_id = ocr_scan_sessions.store_id
    AND sa.role IN ('owner', 'manager')
  )
);

-- Store admins can update their store's scan sessions
CREATE POLICY "Store admins can update their store scan sessions"
ON ocr_scan_sessions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM store_administrators sa
    WHERE sa.user_id = auth.uid()
    AND sa.store_id = ocr_scan_sessions.store_id
    AND sa.role IN ('owner', 'manager')
  )
);

-- =========================
-- RLS Policies for ocr_detected_books
-- =========================

-- Users can view detected books from their own scan sessions
CREATE POLICY "Users can view their own detected books"
ON ocr_detected_books
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM ocr_scan_sessions oss
    WHERE oss.id = ocr_detected_books.session_id
    AND oss.user_id = auth.uid()
  )
);

-- Users can insert detected books to their own scan sessions
CREATE POLICY "Users can insert to their own scan sessions"
ON ocr_detected_books
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM ocr_scan_sessions oss
    WHERE oss.id = ocr_detected_books.session_id
    AND oss.user_id = auth.uid()
  )
);

-- Users can update detected books from their own scan sessions
CREATE POLICY "Users can update their own detected books"
ON ocr_detected_books
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM ocr_scan_sessions oss
    WHERE oss.id = ocr_detected_books.session_id
    AND oss.user_id = auth.uid()
  )
);

-- =========================
-- RLS Policies for inventory_duplicate_matches
-- =========================

-- Store admins can view duplicate matches for their store
CREATE POLICY "Store admins can view their store duplicate matches"
ON inventory_duplicate_matches
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM store_administrators sa
    WHERE sa.user_id = auth.uid()
    AND sa.store_id = inventory_duplicate_matches.store_id
    AND sa.role IN ('owner', 'manager')
  )
);

-- Store admins can insert duplicate matches for their store
CREATE POLICY "Store admins can insert duplicate matches for their store"
ON inventory_duplicate_matches
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM store_administrators sa
    WHERE sa.user_id = auth.uid()
    AND sa.store_id = inventory_duplicate_matches.store_id
    AND sa.role IN ('owner', 'manager')
  )
);

-- Store admins can update duplicate matches for their store
CREATE POLICY "Store admins can update their store duplicate matches"
ON inventory_duplicate_matches
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM store_administrators sa
    WHERE sa.user_id = auth.uid()
    AND sa.store_id = inventory_duplicate_matches.store_id
    AND sa.role IN ('owner', 'manager')
  )
);

-- =========================
-- Indexes for Performance
-- =========================

-- Store inventory indexes (UPDATED)
CREATE INDEX IF NOT EXISTS idx_store_inventory_store_id ON store_inventory(store_id);
CREATE INDEX IF NOT EXISTS idx_store_inventory_google_books_id ON store_inventory(google_books_id) WHERE google_books_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_store_inventory_isbn ON store_inventory(isbn) WHERE isbn IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_store_inventory_status ON store_inventory(status);
CREATE INDEX IF NOT EXISTS idx_store_inventory_book_type ON store_inventory(book_type);
CREATE INDEX IF NOT EXISTS idx_store_inventory_location ON store_inventory(location);
CREATE INDEX IF NOT EXISTS idx_store_inventory_created_at ON store_inventory(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_store_inventory_title_author ON store_inventory(title, author);
CREATE INDEX IF NOT EXISTS idx_store_inventory_entry_method ON store_inventory(entry_method);

-- OCR scan sessions indexes
CREATE INDEX IF NOT EXISTS idx_ocr_scan_sessions_store_user ON ocr_scan_sessions(store_id, user_id);
CREATE INDEX IF NOT EXISTS idx_ocr_scan_sessions_created_at ON ocr_scan_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ocr_scan_sessions_status ON ocr_scan_sessions(status);

-- OCR detected books indexes
CREATE INDEX IF NOT EXISTS idx_ocr_detected_books_session_id ON ocr_detected_books(session_id);
CREATE INDEX IF NOT EXISTS idx_ocr_detected_books_google_books_id ON ocr_detected_books(google_books_id) WHERE google_books_id IS NOT NULL;

-- Duplicate matches indexes (UPDATED)
CREATE INDEX IF NOT EXISTS idx_inventory_duplicate_matches_store_status ON inventory_duplicate_matches(store_id, status);
CREATE INDEX IF NOT EXISTS idx_inventory_duplicate_matches_detected_book ON inventory_duplicate_matches(detected_book_id);
CREATE INDEX IF NOT EXISTS idx_inventory_duplicate_matches_existing_inventory ON inventory_duplicate_matches(existing_inventory_id);

-- =========================
-- Storage Bucket Setup
-- =========================

-- Create storage bucket for OCR scan images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ocr-scan-images',
  'ocr-scan-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for OCR scan images
CREATE POLICY "Store admins can upload OCR scan images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ocr-scan-images' AND
  EXISTS (
    SELECT 1 FROM store_administrators sa
    WHERE sa.user_id = auth.uid()
    AND sa.role IN ('owner', 'manager')
  )
);

CREATE POLICY "Anyone can view OCR scan images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'ocr-scan-images');

CREATE POLICY "Store admins can delete OCR scan images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'ocr-scan-images' AND
  EXISTS (
    SELECT 1 FROM store_administrators sa
    WHERE sa.user_id = auth.uid()
    AND sa.role IN ('owner', 'manager')
  )
);

-- =========================
-- Database Functions
-- =========================

-- Function to calculate similarity between two strings (for duplicate detection)
CREATE OR REPLACE FUNCTION calculate_string_similarity(str1 TEXT, str2 TEXT)
RETURNS DECIMAL(3,2)
LANGUAGE plpgsql
AS $$
DECLARE
    similarity_score DECIMAL(3,2);
BEGIN
    -- Simple Levenshtein distance-based similarity
    -- This is a simplified version - in production, consider using pg_trgm extension
    SELECT 1.0 - (levenshtein(LOWER(str1), LOWER(str2))::DECIMAL / GREATEST(LENGTH(str1), LENGTH(str2))) INTO similarity_score;
    RETURN GREATEST(0.0, LEAST(1.0, similarity_score));
END;
$$;

-- Function for 3-day automatic cleanup of temporary OCR data
CREATE OR REPLACE FUNCTION cleanup_expired_ocr_data()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_sessions INTEGER := 0;
    deleted_detected_books INTEGER := 0;
    deleted_matches INTEGER := 0;
BEGIN
    -- Delete OCR detected books older than 3 days
    DELETE FROM ocr_detected_books
    WHERE created_at < NOW() - INTERVAL '3 days';
    GET DIAGNOSTICS deleted_detected_books = ROW_COUNT;

    -- Delete scan sessions older than 3 days (cascade will handle related data)
    DELETE FROM ocr_scan_sessions
    WHERE created_at < NOW() - INTERVAL '3 days';
    GET DIAGNOSTICS deleted_sessions = ROW_COUNT;

    -- Delete resolved duplicate matches older than 7 days (keep for longer for analytics)
    DELETE FROM inventory_duplicate_matches
    WHERE resolved_at IS NOT NULL
    AND resolved_at < NOW() - INTERVAL '7 days';
    GET DIAGNOSTICS deleted_matches = ROW_COUNT;

    -- Log cleanup results
    RAISE NOTICE 'OCR Cleanup completed: % sessions, % detected books, % duplicate matches deleted',
        deleted_sessions, deleted_detected_books, deleted_matches;

    RETURN deleted_sessions + deleted_detected_books + deleted_matches;
END;
$$;

-- Function to find potential duplicate books (UPDATED for store_inventory)
CREATE OR REPLACE FUNCTION find_potential_inventory_duplicates(
    p_store_id UUID,
    p_title TEXT,
    p_author TEXT,
    p_book_type TEXT,
    p_location TEXT,
    p_google_books_id TEXT DEFAULT NULL,
    p_isbn TEXT DEFAULT NULL
)
RETURNS TABLE(
    inventory_id UUID,
    match_type TEXT,
    similarity_score DECIMAL(3,2),
    suggested_action TEXT,
    current_quantity INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Return exact Google Books ID matches (same type and location = quantity update)
    IF p_google_books_id IS NOT NULL THEN
        RETURN QUERY
        SELECT
            si.id,
            'google_books_id'::TEXT,
            1.0::DECIMAL(3,2),
            CASE
                WHEN si.book_type = p_book_type AND si.location = p_location THEN 'update_quantity'::TEXT
                WHEN si.book_type = p_book_type THEN 'update_location'::TEXT
                ELSE 'keep_separate'::TEXT
            END,
            si.quantity
        FROM store_inventory si
        WHERE si.store_id = p_store_id
        AND si.google_books_id = p_google_books_id;
    END IF;

    -- Return exact ISBN matches
    IF p_isbn IS NOT NULL THEN
        RETURN QUERY
        SELECT
            si.id,
            'isbn'::TEXT,
            1.0::DECIMAL(3,2),
            CASE
                WHEN si.book_type = p_book_type AND si.location = p_location THEN 'update_quantity'::TEXT
                WHEN si.book_type = p_book_type THEN 'update_location'::TEXT
                ELSE 'keep_separate'::TEXT
            END,
            si.quantity
        FROM store_inventory si
        WHERE si.store_id = p_store_id
        AND si.isbn = p_isbn
        AND (p_google_books_id IS NULL OR si.google_books_id != p_google_books_id);
    END IF;

    -- Return fuzzy title/author matches (similarity > 0.85)
    RETURN QUERY
    SELECT
        si.id,
        'fuzzy_match'::TEXT,
        (calculate_string_similarity(si.title, p_title) + calculate_string_similarity(si.author, p_author)) / 2.0,
        CASE
            WHEN si.book_type = p_book_type AND si.location = p_location THEN 'update_quantity'::TEXT
            WHEN si.book_type = p_book_type THEN 'update_location'::TEXT
            ELSE 'keep_separate'::TEXT
        END,
        si.quantity
    FROM store_inventory si
    WHERE si.store_id = p_store_id
    AND (calculate_string_similarity(si.title, p_title) + calculate_string_similarity(si.author, p_author)) / 2.0 > 0.85
    AND (p_google_books_id IS NULL OR si.google_books_id != p_google_books_id)
    AND (p_isbn IS NULL OR si.isbn != p_isbn);
END;
$$;

-- Function to update inventory quantity (for duplicate handling)
CREATE OR REPLACE FUNCTION update_inventory_quantity(
    p_inventory_id UUID,
    p_quantity_to_add INTEGER,
    p_updated_by UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_current_quantity INTEGER;
BEGIN
    -- Get current quantity
    SELECT quantity INTO v_current_quantity
    FROM store_inventory
    WHERE id = p_inventory_id;

    IF v_current_quantity IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Update quantity and metadata
    UPDATE store_inventory
    SET
        quantity = quantity + p_quantity_to_add,
        updated_at = now(),
        last_verified_at = now()
    WHERE id = p_inventory_id;

    RETURN TRUE;
END;
$$;

-- Function to update scan session statistics (ENHANCED)
CREATE OR REPLACE FUNCTION update_scan_session_stats(p_session_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_detected INTEGER;
    v_confirmed INTEGER;
    v_rejected INTEGER;
    v_manual INTEGER;
    v_success_rate DECIMAL(3,2);
BEGIN
    -- Count books in different states
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE user_confirmed = true),
        COUNT(*) FILTER (WHERE user_rejected = true),
        COUNT(*) FILTER (WHERE entry_method = 'manual_entry')
    INTO v_detected, v_confirmed, v_rejected, v_manual
    FROM ocr_detected_books
    WHERE session_id = p_session_id;

    -- Calculate success rate
    IF v_detected > 0 THEN
        v_success_rate := v_confirmed::DECIMAL / v_detected::DECIMAL;
    ELSE
        v_success_rate := 0.0;
    END IF;

    -- Update session record
    UPDATE ocr_scan_sessions
    SET
        books_detected = v_detected,
        books_confirmed = v_confirmed,
        books_rejected = v_rejected,
        books_manually_entered = v_manual,
        session_success_rate = v_success_rate,
        updated_at = now()
    WHERE id = p_session_id;
END;
$$;

-- Create automatic cleanup job (runs daily)
CREATE OR REPLACE FUNCTION schedule_ocr_cleanup()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    -- This would typically be set up as a cron job or scheduled task
    -- For now, we'll create a function that can be called manually or via scheduler
    PERFORM cleanup_expired_ocr_data();
END;
$$;
