-- Fix RLS Policy for Book Availability Requests
-- Allow authenticated users to insert their own store requests

-- Enable RLS on book_availability_requests table (if not already enabled)
ALTER TABLE book_availability_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can insert their own store requests" ON book_availability_requests;
DROP POLICY IF EXISTS "Users can view their own store requests" ON book_availability_requests;
DROP POLICY IF EXISTS "Store owners can view requests for their store" ON book_availability_requests;
DROP POLICY IF EXISTS "Store owners can update requests for their store" ON book_availability_requests;
DROP POLICY IF EXISTS "Anonymous users can insert requests" ON book_availability_requests;

-- Policy 1: Allow authenticated users to insert their own store requests
CREATE POLICY "Users can insert their own store requests" ON book_availability_requests
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id OR 
        user_id IS NULL  -- Allow anonymous requests
    );

-- Policy 2: Allow users to view their own store requests
CREATE POLICY "Users can view their own store requests" ON book_availability_requests
    FOR SELECT 
    TO authenticated
    USING (
        auth.uid() = user_id OR
        user_id IS NULL  -- Allow viewing anonymous requests for store owners
    );

-- Policy 3: Allow store owners to view all requests for their store
CREATE POLICY "Store owners can view requests for their store" ON book_availability_requests
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM stores 
            WHERE stores.id = book_availability_requests.store_id 
            AND stores.owner_id = auth.uid()
        )
    );

-- Policy 4: Allow store owners to update requests for their store
CREATE POLICY "Store owners can update requests for their store" ON book_availability_requests
    FOR UPDATE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM stores 
            WHERE stores.id = book_availability_requests.store_id 
            AND stores.owner_id = auth.uid()
        )
    );

-- Policy 5: Allow anonymous users to insert requests (for public form)
CREATE POLICY "Anonymous users can insert requests" ON book_availability_requests
    FOR INSERT 
    TO anon
    WITH CHECK (
        user_id IS NULL AND 
        request_source = 'anonymous'
    );

-- Policy 6: Allow public to view store information (needed for joins)
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view store basic info" ON stores;
CREATE POLICY "Public can view store basic info" ON stores
    FOR SELECT 
    TO public
    USING (true);  -- Allow reading store name and basic info

-- Grant necessary permissions
GRANT SELECT, INSERT ON book_availability_requests TO authenticated;
GRANT SELECT, UPDATE ON book_availability_requests TO authenticated;
GRANT SELECT ON stores TO authenticated;
GRANT SELECT ON stores TO anon;
