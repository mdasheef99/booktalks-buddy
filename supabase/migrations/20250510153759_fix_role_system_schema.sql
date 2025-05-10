-- Role System Schema Migration Fix
-- Generated on 2025-05-10

-- =========================
-- Update users table
-- =========================
ALTER TABLE users
ADD COLUMN IF NOT EXISTS account_tier TEXT
CHECK (account_tier IN ('free', 'privileged', 'privileged_plus'))
DEFAULT 'free' NOT NULL;

-- =========================
-- Check stores table structure
-- =========================
DO $$
DECLARE
  description_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'stores' AND column_name = 'description'
  ) INTO description_exists;

  -- If stores table exists but doesn't have description column, add it
  IF NOT description_exists THEN
    ALTER TABLE stores ADD COLUMN description TEXT;
  END IF;
END $$;

-- =========================
-- Create store_administrators table
-- =========================
CREATE TABLE IF NOT EXISTS store_administrators (
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('owner', 'manager')) NOT NULL,
    assigned_at TIMESTAMPTZ DEFAULT now(),
    assigned_by UUID REFERENCES auth.users(id),
    PRIMARY KEY (store_id, user_id)
);

-- =========================
-- Update book_clubs table
-- =========================
-- First, ensure store_id exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'book_clubs' AND column_name = 'store_id'
    ) THEN
        ALTER TABLE book_clubs ADD COLUMN store_id UUID REFERENCES stores(id);
    END IF;
END $$;

-- Add lead_user_id column
ALTER TABLE book_clubs
ADD COLUMN IF NOT EXISTS lead_user_id UUID REFERENCES auth.users(id);

-- Add access_tier_required column
ALTER TABLE book_clubs
ADD COLUMN IF NOT EXISTS access_tier_required TEXT
CHECK (access_tier_required IN ('free', 'privileged_plus', 'all_premium'))
DEFAULT 'free';

-- =========================
-- Create club_moderators table
-- =========================
CREATE TABLE IF NOT EXISTS club_moderators (
    club_id UUID REFERENCES book_clubs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_by_user_id UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (club_id, user_id)
);

-- =========================
-- Data Migration
-- =========================

-- Set all users to 'free' tier by default
UPDATE users SET account_tier = 'free' WHERE account_tier IS NULL;

-- Create a default store if none exists
-- Use a safer approach that doesn't assume specific columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM stores LIMIT 1) THEN
    INSERT INTO stores (name) VALUES ('Default Store');
  END IF;
END $$;

-- Set store_id for all clubs that don't have one
UPDATE book_clubs
SET store_id = (SELECT id FROM stores ORDER BY created_at LIMIT 1)
WHERE store_id IS NULL;

-- Set lead_user_id for each club based on the first admin in club_members
UPDATE book_clubs bc
SET lead_user_id = cm.user_id
FROM (
    SELECT DISTINCT ON (club_id) club_id, user_id
    FROM club_members
    WHERE role = 'admin'
    ORDER BY club_id, joined_at
) cm
WHERE bc.id = cm.club_id AND bc.lead_user_id IS NULL;

-- If any clubs still don't have a lead_user_id, use the first member
UPDATE book_clubs bc
SET lead_user_id = cm.user_id
FROM (
    SELECT DISTINCT ON (club_id) club_id, user_id
    FROM club_members
    ORDER BY club_id, joined_at
) cm
WHERE bc.id = cm.club_id AND bc.lead_user_id IS NULL;

-- =========================
-- Add NOT NULL constraint to lead_user_id after migration
-- =========================
-- This ensures all clubs have a lead user
ALTER TABLE book_clubs ALTER COLUMN lead_user_id SET NOT NULL;

-- =========================
-- Create helper functions
-- =========================

-- Function to check if a user has a specific account tier
CREATE OR REPLACE FUNCTION has_account_tier(required_tier TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_tier TEXT;
BEGIN
  SELECT account_tier INTO user_tier FROM users WHERE id = auth.uid();

  IF required_tier = 'free' THEN
    RETURN TRUE;
  ELSIF required_tier = 'privileged' THEN
    RETURN user_tier IN ('privileged', 'privileged_plus');
  ELSIF required_tier = 'privileged_plus' THEN
    RETURN user_tier = 'privileged_plus';
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a user is a store administrator
CREATE OR REPLACE FUNCTION is_store_administrator(store_id UUID, required_role TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  admin_role TEXT;
BEGIN
  SELECT role INTO admin_role FROM store_administrators
  WHERE store_administrators.store_id = is_store_administrator.store_id
  AND user_id = auth.uid();

  IF admin_role IS NULL THEN
    RETURN FALSE;
  ELSIF required_role IS NULL THEN
    RETURN TRUE;
  ELSIF required_role = 'owner' THEN
    RETURN admin_role = 'owner';
  ELSIF required_role = 'manager' THEN
    RETURN admin_role IN ('owner', 'manager');
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a user is a club lead
CREATE OR REPLACE FUNCTION is_club_lead(club_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM book_clubs
    WHERE id = club_id
    AND lead_user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a user is a club moderator
CREATE OR REPLACE FUNCTION is_club_moderator(club_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM club_moderators
    WHERE club_id = is_club_moderator.club_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;