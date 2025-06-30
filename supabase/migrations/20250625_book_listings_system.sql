-- Second-Hand Book Listings System Migration
-- Generated on 2025-06-25
-- Purpose: Create tables and storage for customer book listing feature

-- Enable pgcrypto for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- Table: book_listings
-- =========================
CREATE TABLE IF NOT EXISTS book_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
    
    -- Customer Information
    customer_name TEXT NOT NULL CHECK (char_length(customer_name) <= 100),
    customer_email TEXT NOT NULL CHECK (char_length(customer_email) <= 255),
    customer_phone TEXT CHECK (char_length(customer_phone) <= 20),
    
    -- Book Information
    book_title TEXT NOT NULL CHECK (char_length(book_title) <= 200),
    book_author TEXT NOT NULL CHECK (char_length(book_author) <= 100),
    book_isbn TEXT CHECK (char_length(book_isbn) <= 20), -- Optional
    book_condition TEXT NOT NULL CHECK (book_condition IN ('excellent', 'very_good', 'good', 'fair', 'poor')),
    book_description TEXT CHECK (char_length(book_description) <= 1000), -- Optional
    asking_price DECIMAL(10,2) CHECK (asking_price >= 0), -- Optional
    
    -- Book Images (3 images max)
    image_1_url TEXT,
    image_2_url TEXT,
    image_3_url TEXT,
    
    -- Status and Management
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    store_owner_notes TEXT CHECK (char_length(store_owner_notes) <= 500),
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =========================
-- Indexes for Performance
-- =========================
CREATE INDEX IF NOT EXISTS idx_book_listings_store_id ON book_listings(store_id);
CREATE INDEX IF NOT EXISTS idx_book_listings_status ON book_listings(status);
CREATE INDEX IF NOT EXISTS idx_book_listings_created_at ON book_listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_book_listings_store_status ON book_listings(store_id, status);

-- =========================
-- Create Storage Bucket for Book Listing Images
-- =========================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'book-listing-images',
  'book-listing-images',
  true,
  3145728, -- 3MB limit per image
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- =========================
-- Enable RLS on book_listings table
-- =========================
ALTER TABLE book_listings ENABLE ROW LEVEL SECURITY;

-- =========================
-- RLS Policies for book_listings table
-- =========================

-- Store owners can view all listings for their store
CREATE POLICY "Store owners can view their store listings"
ON book_listings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM store_administrators sa
    WHERE sa.user_id = auth.uid()
    AND sa.store_id = book_listings.store_id
    AND sa.role = 'owner'
  )
);

-- Store owners can update listings for their store
CREATE POLICY "Store owners can update their store listings"
ON book_listings
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM store_administrators sa
    WHERE sa.user_id = auth.uid()
    AND sa.store_id = book_listings.store_id
    AND sa.role = 'owner'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM store_administrators sa
    WHERE sa.user_id = auth.uid()
    AND sa.store_id = book_listings.store_id
    AND sa.role = 'owner'
  )
);

-- Anyone can insert new book listings (customers)
CREATE POLICY "Anyone can create book listings"
ON book_listings
FOR INSERT
TO public
WITH CHECK (true);

-- =========================
-- Storage RLS Policies for Book Listing Images
-- =========================

-- Anyone can upload book listing images (customers)
CREATE POLICY "Anyone can upload book listing images"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'book-listing-images'
);

-- Anyone can view book listing images
CREATE POLICY "Anyone can view book listing images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'book-listing-images');

-- Store owners can delete book listing images for their store
CREATE POLICY "Store owners can delete book listing images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'book-listing-images' AND
  EXISTS (
    SELECT 1 FROM book_listings bl
    JOIN store_administrators sa ON sa.store_id = bl.store_id
    WHERE sa.user_id = auth.uid()
    AND sa.role = 'owner'
    AND (
      bl.image_1_url LIKE '%' || name || '%' OR
      bl.image_2_url LIKE '%' || name || '%' OR
      bl.image_3_url LIKE '%' || name || '%'
    )
  )
);

-- =========================
-- Update Trigger for updated_at
-- =========================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_book_listings_updated_at
    BEFORE UPDATE ON book_listings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =========================
-- Comments for Documentation
-- =========================
COMMENT ON TABLE book_listings IS 'Customer submissions for second-hand books they want to sell to the store';
COMMENT ON COLUMN book_listings.book_condition IS 'Physical condition of the book: excellent, very_good, good, fair, poor';
COMMENT ON COLUMN book_listings.status IS 'Review status: pending (default), approved, rejected';
COMMENT ON COLUMN book_listings.asking_price IS 'Optional price customer is asking for the book';
COMMENT ON COLUMN book_listings.store_owner_notes IS 'Private notes from store owner about the listing';
