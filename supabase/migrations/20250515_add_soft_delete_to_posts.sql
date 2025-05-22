-- Add soft deletion fields to discussion_posts table
-- Generated on 2025-05-15

-- Add soft deletion fields to discussion_posts table
ALTER TABLE discussion_posts
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS deleted_by_moderator BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Create function to check if user is a club member if it doesn't exist
CREATE OR REPLACE FUNCTION is_club_member(club_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM club_members
    WHERE club_id = is_club_member.club_id
    AND user_id = auth.uid()
    AND role != 'pending'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies for discussion_posts to handle soft deletion
-- Members can view posts in topics they have access to (including soft-deleted ones)
DROP POLICY IF EXISTS "Members can view posts in topics they have access to" ON discussion_posts;
CREATE POLICY "Members can view posts in topics they have access to"
ON discussion_posts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM discussion_topics
    WHERE id = discussion_posts.topic_id
      AND is_club_member(club_id)
  )
);

-- Create function to check if user can moderate content
CREATE OR REPLACE FUNCTION can_moderate_content(club_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    -- User is club lead
    is_club_lead(club_id)
    OR
    -- User is club moderator
    is_club_moderator(club_id)
    OR
    -- User is store admin
    EXISTS (
      SELECT 1 FROM store_administrators sa
      JOIN book_clubs bc ON sa.store_id = bc.store_id
      WHERE bc.id = club_id
      AND sa.user_id = auth.uid()
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
