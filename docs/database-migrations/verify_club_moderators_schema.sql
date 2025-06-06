-- =====================================================
-- Verify Club Moderators Schema
-- Check if the database has the correct schema for NEW system
-- =====================================================

-- Check if club_moderators table exists
SELECT 
  table_name,
  table_schema
FROM information_schema.tables 
WHERE table_name = 'club_moderators';

-- Check current schema of club_moderators table
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'club_moderators' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check for required NEW system columns
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'club_moderators' 
      AND column_name = 'analytics_access'
    ) THEN '✅ analytics_access exists'
    ELSE '❌ analytics_access MISSING'
  END as analytics_access_check,
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'club_moderators' 
      AND column_name = 'meeting_management_access'
    ) THEN '✅ meeting_management_access exists'
    ELSE '❌ meeting_management_access MISSING'
  END as meeting_management_check,
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'club_moderators' 
      AND column_name = 'content_moderation_access'
    ) THEN '✅ content_moderation_access exists'
    ELSE '❌ content_moderation_access MISSING'
  END as content_moderation_check,
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'club_moderators' 
      AND column_name = 'member_management_access'
    ) THEN '✅ member_management_access exists'
    ELSE '❌ member_management_access MISSING'
  END as member_management_check,
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'club_moderators' 
      AND column_name = 'customization_access'
    ) THEN '✅ customization_access exists'
    ELSE '❌ customization_access MISSING'
  END as customization_check,
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'club_moderators' 
      AND column_name = 'role'
    ) THEN '✅ role exists'
    ELSE '❌ role MISSING'
  END as role_check,
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'club_moderators' 
      AND column_name = 'is_active'
    ) THEN '✅ is_active exists'
    ELSE '❌ is_active MISSING'
  END as is_active_check;

-- Count existing moderator records
SELECT 
  COUNT(*) as total_moderators,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_moderators
FROM club_moderators;

-- Show sample data (if table exists and has data)
SELECT 
  id,
  club_id,
  user_id,
  COALESCE(role, 'unknown') as role,
  COALESCE(is_active, false) as is_active,
  COALESCE(analytics_access, false) as analytics_access,
  COALESCE(content_moderation_access, false) as content_moderation_access,
  appointed_at
FROM club_moderators 
LIMIT 3;
