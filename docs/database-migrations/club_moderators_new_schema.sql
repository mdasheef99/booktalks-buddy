-- =====================================================
-- Club Moderators Schema Migration
-- NEW Entitlements-Based Moderator Management System
-- =====================================================

-- This migration updates the club_moderators table to support
-- the NEW entitlements-based permission system

-- Step 1: Create the new club_moderators table with enhanced schema
-- (This will replace the old simple schema)

CREATE TABLE IF NOT EXISTS club_moderators_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES book_clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  appointed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  appointed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  role TEXT NOT NULL DEFAULT 'moderator' CHECK (role IN ('moderator', 'lead')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Entitlements-based permissions
  analytics_access BOOLEAN NOT NULL DEFAULT false,
  meeting_management_access BOOLEAN NOT NULL DEFAULT false,
  customization_access BOOLEAN NOT NULL DEFAULT false,
  content_moderation_access BOOLEAN NOT NULL DEFAULT false,
  member_management_access BOOLEAN NOT NULL DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(club_id, user_id)
);

-- Step 2: Migrate existing data from old schema to new schema
-- (If old table exists with different schema)

DO $$
BEGIN
  -- Check if old table exists and has data
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'club_moderators' 
    AND table_schema = 'public'
  ) THEN
    
    -- Migrate existing moderator records
    INSERT INTO club_moderators_new (
      club_id,
      user_id,
      appointed_by,
      appointed_at,
      role,
      is_active,
      analytics_access,
      meeting_management_access,
      customization_access,
      content_moderation_access,
      member_management_access
    )
    SELECT 
      club_id,
      user_id,
      assigned_by_user_id as appointed_by,
      COALESCE(assigned_at, NOW()) as appointed_at,
      'moderator' as role,
      true as is_active,
      true as analytics_access,           -- Grant basic permissions to existing moderators
      false as meeting_management_access, -- Coming soon features default to false
      false as customization_access,      -- Coming soon features default to false
      true as content_moderation_access,  -- Core moderator permission
      true as member_management_access    -- Core moderator permission
    FROM club_moderators
    ON CONFLICT (club_id, user_id) DO NOTHING;
    
    -- Backup old table
    ALTER TABLE club_moderators RENAME TO club_moderators_old_backup;
    
  END IF;
END $$;

-- Step 3: Rename new table to final name
ALTER TABLE club_moderators_new RENAME TO club_moderators;

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_club_moderators_club_id ON club_moderators(club_id);
CREATE INDEX IF NOT EXISTS idx_club_moderators_user_id ON club_moderators(user_id);
CREATE INDEX IF NOT EXISTS idx_club_moderators_active ON club_moderators(is_active) WHERE is_active = true;

-- Step 5: Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_club_moderators_updated_at ON club_moderators;
CREATE TRIGGER update_club_moderators_updated_at
  BEFORE UPDATE ON club_moderators
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 6: Enable RLS (Row Level Security)
ALTER TABLE club_moderators ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies for the new schema
-- Policy: Users can view moderators of clubs they're members of
CREATE POLICY "Users can view club moderators" ON club_moderators
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM book_club_members 
      WHERE book_club_members.club_id = club_moderators.club_id 
      AND book_club_members.user_id = auth.uid()
    )
  );

-- Policy: Club leads can manage moderators
CREATE POLICY "Club leads can manage moderators" ON club_moderators
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM book_clubs 
      WHERE book_clubs.id = club_moderators.club_id 
      AND book_clubs.lead_user_id = auth.uid()
    )
  );

-- Policy: Moderators can view their own record
CREATE POLICY "Moderators can view own record" ON club_moderators
  FOR SELECT USING (user_id = auth.uid());

-- =====================================================
-- Verification Queries
-- =====================================================

-- Verify the new schema
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'club_moderators' 
ORDER BY ordinal_position;

-- Count migrated records
SELECT COUNT(*) as total_moderators FROM club_moderators;

-- Show sample data
SELECT 
  id,
  club_id,
  user_id,
  role,
  is_active,
  analytics_access,
  content_moderation_access,
  member_management_access,
  appointed_at
FROM club_moderators 
LIMIT 5;
