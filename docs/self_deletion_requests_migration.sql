-- Self-Deletion Request System Migration
-- Generated for BookTalks Buddy self-deletion integration
-- Follows established patterns from book_availability_requests

-- =========================
-- Table: self_deletion_requests
-- =========================
CREATE TABLE IF NOT EXISTS self_deletion_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User and Store Context
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    
    -- Request Details
    reason TEXT NOT NULL CHECK (char_length(reason) >= 10 AND char_length(reason) <= 1000),
    clubs_owned JSONB NOT NULL, -- Array of {id, name, member_count} for owned clubs
    
    -- Status Management (following book_availability_requests pattern)
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
    
    -- Store Owner Actions
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    store_owner_notes TEXT CHECK (char_length(store_owner_notes) <= 500),
    
    -- Club Transfer Tracking
    transfer_decisions JSONB, -- Array of {club_id, action: 'transfer'|'dissolve', new_owner_id?, reason}
    transfer_completed_at TIMESTAMPTZ,
    
    -- Account Deletion Tracking
    deletion_type TEXT CHECK (deletion_type IN ('soft', 'hard')) DEFAULT 'soft',
    deletion_completed_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraints
    CONSTRAINT valid_status_progression CHECK (
        (status = 'pending' AND reviewed_by IS NULL) OR
        (status IN ('in_progress', 'completed', 'rejected') AND reviewed_by IS NOT NULL)
    ),
    
    CONSTRAINT valid_completion_data CHECK (
        (status = 'completed' AND deletion_completed_at IS NOT NULL) OR
        (status != 'completed')
    )
);

-- =========================
-- Indexes for Performance
-- =========================

-- Index for store-based queries (primary query pattern)
CREATE INDEX IF NOT EXISTS idx_self_deletion_requests_store_id 
ON self_deletion_requests(store_id);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_self_deletion_requests_status 
ON self_deletion_requests(status);

-- Composite index for store + status queries (admin panel filtering)
CREATE INDEX IF NOT EXISTS idx_self_deletion_requests_store_status 
ON self_deletion_requests(store_id, status);

-- Index for user queries (check existing requests)
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

-- Policy: Users can create their own requests
CREATE POLICY "Users can create own deletion requests" ON self_deletion_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policy: Store owners can view requests for their store
CREATE POLICY "Store owners can view store deletion requests" ON self_deletion_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM store_administrators sa
      WHERE sa.store_id = self_deletion_requests.store_id
      AND sa.user_id = auth.uid()
      AND sa.role = 'owner'
    )
  );

-- Policy: Store owners can update requests for their store
CREATE POLICY "Store owners can update store deletion requests" ON self_deletion_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM store_administrators sa
      WHERE sa.store_id = self_deletion_requests.store_id
      AND sa.user_id = auth.uid()
      AND sa.role = 'owner'
    )
  );

-- =========================
-- Trigger Functions
-- =========================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_self_deletion_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_self_deletion_requests_updated_at
    BEFORE UPDATE ON self_deletion_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_self_deletion_requests_updated_at();

-- =========================
-- Helper Functions
-- =========================

-- Function to get user's store context
CREATE OR REPLACE FUNCTION get_user_store_context(p_user_id UUID)
RETURNS TABLE(store_id UUID, store_name TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT s.id, s.name
    FROM stores s
    JOIN users u ON u.store_id = s.id
    WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's owned clubs with details
CREATE OR REPLACE FUNCTION get_user_owned_clubs_details(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    clubs_data JSONB;
BEGIN
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id', bc.id,
                'name', bc.name,
                'member_count', COALESCE(member_counts.count, 0),
                'created_at', bc.created_at
            )
        ),
        '[]'::jsonb
    ) INTO clubs_data
    FROM book_clubs bc
    LEFT JOIN (
        SELECT club_id, COUNT(*) as count
        FROM club_members
        WHERE role != 'pending'
        GROUP BY club_id
    ) member_counts ON member_counts.club_id = bc.id
    WHERE bc.lead_user_id = p_user_id;
    
    RETURN clubs_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================
-- Comments for Documentation
-- =========================

COMMENT ON TABLE self_deletion_requests IS 'Stores user self-deletion requests for store owner review and approval';
COMMENT ON COLUMN self_deletion_requests.clubs_owned IS 'JSONB array of club details at time of request creation';
COMMENT ON COLUMN self_deletion_requests.transfer_decisions IS 'JSONB array of store owner decisions for each owned club';
COMMENT ON COLUMN self_deletion_requests.status IS 'Request workflow status: pending -> in_progress -> completed/rejected';
