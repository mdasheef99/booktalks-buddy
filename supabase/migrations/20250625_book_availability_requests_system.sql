-- Book Availability Requests System Migration
-- Generated on 2025-06-25
-- Purpose: Create table for customer book availability request feature

-- Enable pgcrypto for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- Table: book_availability_requests
-- =========================
CREATE TABLE IF NOT EXISTS book_availability_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
    
    -- Customer Information (Required)
    customer_name TEXT NOT NULL CHECK (char_length(customer_name) <= 100),
    customer_email TEXT NOT NULL CHECK (char_length(customer_email) <= 255),
    customer_phone TEXT NOT NULL CHECK (char_length(customer_phone) <= 20),
    
    -- Book Information (Required)
    book_title TEXT NOT NULL CHECK (char_length(book_title) <= 200),
    book_author TEXT NOT NULL CHECK (char_length(book_author) <= 100),
    
    -- Additional Details (Optional)
    description TEXT CHECK (char_length(description) <= 1000),
    
    -- Request Status and Management
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'responded', 'resolved')),
    store_owner_notes TEXT CHECK (char_length(store_owner_notes) <= 500),
    responded_by UUID REFERENCES auth.users(id),
    responded_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =========================
-- Indexes for Performance
-- =========================

-- Index for store-based queries (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_book_availability_requests_store_id 
ON book_availability_requests(store_id);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_book_availability_requests_status 
ON book_availability_requests(status);

-- Composite index for store + status queries (admin panel filtering)
CREATE INDEX IF NOT EXISTS idx_book_availability_requests_store_status 
ON book_availability_requests(store_id, status);

-- Index for timestamp-based ordering
CREATE INDEX IF NOT EXISTS idx_book_availability_requests_created_at 
ON book_availability_requests(created_at DESC);

-- Index for search functionality (book title and author)
CREATE INDEX IF NOT EXISTS idx_book_availability_requests_search 
ON book_availability_requests USING gin(
    to_tsvector('english', book_title || ' ' || book_author || ' ' || customer_name)
);

-- =========================
-- Enable RLS on book_availability_requests table
-- =========================
ALTER TABLE book_availability_requests ENABLE ROW LEVEL SECURITY;

-- =========================
-- RLS Policies for book_availability_requests table
-- =========================

-- Allow anyone (including anonymous users) to insert new book availability requests
CREATE POLICY "Public can create book availability requests"
ON book_availability_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Store owners can view all requests for their store
CREATE POLICY "Store owners can view their store requests"
ON book_availability_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM store_administrators sa
    WHERE sa.user_id = auth.uid()
    AND sa.store_id = book_availability_requests.store_id
    AND sa.role = 'owner'
  )
);

-- Store owners can update requests for their store
CREATE POLICY "Store owners can update their store requests"
ON book_availability_requests
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM store_administrators sa
    WHERE sa.user_id = auth.uid()
    AND sa.store_id = book_availability_requests.store_id
    AND sa.role = 'owner'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM store_administrators sa
    WHERE sa.user_id = auth.uid()
    AND sa.store_id = book_availability_requests.store_id
    AND sa.role = 'owner'
  )
);

-- Store owners can delete requests for their store (optional - for cleanup)
CREATE POLICY "Store owners can delete their store requests"
ON book_availability_requests
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM store_administrators sa
    WHERE sa.user_id = auth.uid()
    AND sa.store_id = book_availability_requests.store_id
    AND sa.role = 'owner'
  )
);

-- =========================
-- Trigger for updated_at timestamp
-- =========================

-- Create or replace function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for book_availability_requests table
DROP TRIGGER IF EXISTS update_book_availability_requests_updated_at ON book_availability_requests;
CREATE TRIGGER update_book_availability_requests_updated_at
    BEFORE UPDATE ON book_availability_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =========================
-- Comments for Documentation
-- =========================

COMMENT ON TABLE book_availability_requests IS 'Customer requests for book availability inquiries';
COMMENT ON COLUMN book_availability_requests.customer_name IS 'Customer full name (required)';
COMMENT ON COLUMN book_availability_requests.customer_email IS 'Customer email for contact (required)';
COMMENT ON COLUMN book_availability_requests.customer_phone IS 'Customer phone number for contact (required)';
COMMENT ON COLUMN book_availability_requests.book_title IS 'Title of the book being requested (required)';
COMMENT ON COLUMN book_availability_requests.book_author IS 'Author of the book being requested (required)';
COMMENT ON COLUMN book_availability_requests.description IS 'Additional details about the book request (optional)';
COMMENT ON COLUMN book_availability_requests.status IS 'Request status: pending, responded, resolved';
COMMENT ON COLUMN book_availability_requests.store_owner_notes IS 'Internal notes from store owner';
COMMENT ON COLUMN book_availability_requests.responded_by IS 'User ID of store owner who responded';
COMMENT ON COLUMN book_availability_requests.responded_at IS 'Timestamp when request was first responded to';
