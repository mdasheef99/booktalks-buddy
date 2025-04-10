-- Book Club MVP Phase 1 - RLS Policies
-- Generated on 2025-04-09 17:30:34 Asia/Calcutta

-- Assumes helper functions:
--   is_club_member(club_id uuid) RETURNS boolean
--   is_club_admin(club_id uuid) RETURNS boolean

-- Enable RLS on all tables
ALTER TABLE book_clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE current_books ENABLE ROW LEVEL SECURITY;

-- =========================
-- book_clubs policies
-- =========================

CREATE POLICY "Members can view their clubs"
ON book_clubs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM club_members
    WHERE club_id = book_clubs.id
      AND user_id = auth.uid()
  )
);

CREATE POLICY "Admins can insert clubs"
ON book_clubs
FOR INSERT
WITH CHECK (
  is_club_admin(NEW.id)
);

CREATE POLICY "Admins can update clubs"
ON book_clubs
FOR UPDATE
USING (
  is_club_admin(id)
);

CREATE POLICY "Admins can delete clubs"
ON book_clubs
FOR DELETE
USING (
  is_club_admin(id)
);

-- =========================
-- club_members policies
-- =========================

CREATE POLICY "Members can view their membership"
ON club_members
FOR SELECT
USING (
  user_id = auth.uid()
);

CREATE POLICY "Admins can insert members"
ON club_members
FOR INSERT
WITH CHECK (
  is_club_admin(NEW.club_id)
);

CREATE POLICY "Admins can update members"
ON club_members
FOR UPDATE
USING (
  is_club_admin(club_id)
);

CREATE POLICY "Admins can delete members"
ON club_members
FOR DELETE
USING (
  is_club_admin(club_id)
);

-- =========================
-- discussion_topics policies
-- =========================

CREATE POLICY "Members can view topics in their clubs"
ON discussion_topics
FOR SELECT
USING (
  is_club_member(club_id)
);

CREATE POLICY "Members can insert topics in their clubs"
ON discussion_topics
FOR INSERT
WITH CHECK (
  is_club_member(NEW.club_id)
);

-- =========================
-- discussion_posts policies
-- =========================

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

CREATE POLICY "Members can insert posts in topics they have access to"
ON discussion_posts
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM discussion_topics
    WHERE id = NEW.topic_id
      AND is_club_member(club_id)
  )
);

-- =========================
-- current_books policies
-- =========================

CREATE POLICY "Admins can insert current books"
ON current_books
FOR INSERT
WITH CHECK (
  is_club_admin(NEW.club_id)
);

CREATE POLICY "Admins can update current books"
ON current_books
FOR UPDATE
USING (
  is_club_admin(club_id)
);

CREATE POLICY "Admins can delete current books"
ON current_books
FOR DELETE
USING (
  is_club_admin(club_id)
);