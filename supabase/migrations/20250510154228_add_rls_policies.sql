-- RLS Policies for Role System
-- Generated on 2025-05-10

-- =========================
-- Enable RLS on tables
-- =========================
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_administrators ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_moderators ENABLE ROW LEVEL SECURITY;

-- =========================
-- Stores policies
-- =========================
-- Anyone can view stores
CREATE POLICY "Anyone can view stores"
ON stores
FOR SELECT
USING (true);

-- Only platform owner can insert stores
CREATE POLICY "Only platform owner can insert stores"
ON stores
FOR INSERT
WITH CHECK (false); -- To be replaced with actual platform owner check

-- Only platform owner can update stores
CREATE POLICY "Only platform owner can update stores"
ON stores
FOR UPDATE
USING (false); -- To be replaced with actual platform owner check

-- Only platform owner can delete stores
CREATE POLICY "Only platform owner can delete stores"
ON stores
FOR DELETE
USING (false); -- To be replaced with actual platform owner check

-- =========================
-- Store administrators policies
-- =========================
-- Anyone can view store administrators
CREATE POLICY "Anyone can view store administrators"
ON store_administrators
FOR SELECT
USING (true);

-- Only store owners can insert store administrators
CREATE POLICY "Only store owners can insert store administrators"
ON store_administrators
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM store_administrators
    WHERE store_id = NEW.store_id
    AND user_id = auth.uid()
    AND role = 'owner'
  )
);

-- Only store owners can update store administrators
CREATE POLICY "Only store owners can update store administrators"
ON store_administrators
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM store_administrators
    WHERE store_id = store_administrators.store_id
    AND user_id = auth.uid()
    AND role = 'owner'
  )
);

-- Only store owners can delete store administrators
CREATE POLICY "Only store owners can delete store administrators"
ON store_administrators
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM store_administrators
    WHERE store_id = store_administrators.store_id
    AND user_id = auth.uid()
    AND role = 'owner'
  )
);

-- =========================
-- Club moderators policies
-- =========================
-- Anyone can view club moderators
CREATE POLICY "Anyone can view club moderators"
ON club_moderators
FOR SELECT
USING (true);

-- Club leads and store admins can insert club moderators
CREATE POLICY "Club leads and store admins can insert club moderators"
ON club_moderators
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM book_clubs
    WHERE id = NEW.club_id
    AND lead_user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM store_administrators sa
    JOIN book_clubs bc ON sa.store_id = bc.store_id
    WHERE bc.id = NEW.club_id
    AND sa.user_id = auth.uid()
  )
);

-- Club leads and store admins can delete club moderators
CREATE POLICY "Club leads and store admins can delete club moderators"
ON club_moderators
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM book_clubs
    WHERE id = club_moderators.club_id
    AND lead_user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM store_administrators sa
    JOIN book_clubs bc ON sa.store_id = bc.store_id
    WHERE bc.id = club_moderators.club_id
    AND sa.user_id = auth.uid()
  )
);

-- =========================
-- Book clubs policies
-- =========================
-- Users can view clubs based on their tier
CREATE OR REPLACE POLICY "Users can view clubs based on their tier"
ON book_clubs
FOR SELECT
USING (
  access_tier_required = 'free'
  OR (
    access_tier_required = 'all_premium' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND
      account_tier IN ('privileged', 'privileged_plus')
    )
  )
  OR (
    access_tier_required = 'privileged_plus' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND
      account_tier = 'privileged_plus'
    )
  )
  OR lead_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM store_administrators
    WHERE user_id = auth.uid() AND
    store_id = book_clubs.store_id
  )
);