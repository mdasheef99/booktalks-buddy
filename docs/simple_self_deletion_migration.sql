-- Ultra-Simple Self-Deletion Request System Migration
-- For BookTalks Buddy - Minimal complexity approach

-- =========================
-- Table: self_deletion_requests
-- =========================
CREATE TABLE IF NOT EXISTS self_deletion_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- User Context (simplified - no store_id needed for single store setup)
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Request Details
    reason TEXT CHECK (char_length(reason) <= 1000),
    clubs_owned JSONB NOT NULL, -- Array of {id, name} for display only

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =========================
-- Indexes for Performance
-- =========================

-- Index for user-based queries (prevent duplicate requests)
CREATE INDEX IF NOT EXISTS idx_self_deletion_requests_user_id
ON self_deletion_requests(user_id);

-- Index for timestamp-based ordering
CREATE INDEX IF NOT EXISTS idx_self_deletion_requests_created_at 
ON self_deletion_requests(created_at DESC);

-- =========================
-- Row Level Security (RLS)
-- =========================

-- Enable RLS
ALTER TABLE self_deletion_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own requests
CREATE POLICY "Users can view own deletion requests" ON self_deletion_requests
  FOR SELECT USING (user_id = auth.uid());

-- Policy: Users can create their own requests (prevent duplicates with unique constraint)
CREATE POLICY "Users can create own deletion requests" ON self_deletion_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policy: Store owners can view all deletion requests (single store setup)
CREATE POLICY "Store owners can view deletion requests" ON self_deletion_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM store_administrators sa
      WHERE sa.user_id = auth.uid()
      AND sa.role = 'owner'
    )
  );

-- Policy: Store owners can delete requests (when processing deletion)
CREATE POLICY "Store owners can delete deletion requests" ON self_deletion_requests
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM store_administrators sa
      WHERE sa.user_id = auth.uid()
      AND sa.role = 'owner'
    )
  );

-- =========================
-- Unique Constraint
-- =========================

-- Prevent duplicate requests from same user
ALTER TABLE self_deletion_requests 
ADD CONSTRAINT unique_user_deletion_request 
UNIQUE (user_id);

-- =========================
-- Helper Functions
-- =========================

-- Function to get user's owned clubs with details
CREATE OR REPLACE FUNCTION get_user_owned_clubs_simple(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    clubs_data JSONB;
BEGIN
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id', bc.id,
                'name', bc.name
            )
        ),
        '[]'::jsonb
    ) INTO clubs_data
    FROM book_clubs bc
    WHERE bc.lead_user_id = p_user_id;
    
    RETURN clubs_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================
-- Comments for Documentation
-- =========================

COMMENT ON TABLE self_deletion_requests IS 'Simple user self-deletion requests for store owner processing';
COMMENT ON COLUMN self_deletion_requests.clubs_owned IS 'JSONB array of club details for display purposes only';
