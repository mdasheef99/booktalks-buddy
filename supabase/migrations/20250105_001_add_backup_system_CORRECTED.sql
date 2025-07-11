-- Subscription System Backup Infrastructure
-- Migration: 20250105_001_add_backup_system
-- Purpose: Create backup and restore capabilities for subscription system changes
-- CORRECTED VERSION: Only uses membership_tier (account_tier was removed)

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- Create backup tables
-- =========================

-- Main backup table for storing system snapshots (matching your existing schema)
CREATE TABLE IF NOT EXISTS system_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_id TEXT NOT NULL,
  backup_type TEXT DEFAULT 'subscription_system',
  description TEXT,
  backup_data JSONB NOT NULL,
  table_counts JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  restored_at TIMESTAMPTZ,
  created_by UUID,
  backup_size_bytes BIGINT,
  compression_used BOOLEAN DEFAULT FALSE,
  backup_status TEXT DEFAULT 'completed'
);

-- Index for faster backup retrieval
CREATE INDEX IF NOT EXISTS idx_system_backups_created_at
ON system_backups(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_backups_backup_id
ON system_backups(backup_id);

-- =========================
-- Backup functions
-- =========================

-- Function to create a comprehensive backup of subscription-related data
CREATE OR REPLACE FUNCTION create_subscription_backup(backup_description TEXT DEFAULT 'Subscription system backup')
RETURNS UUID AS $$
DECLARE
  backup_id UUID;
  backup_data JSONB;
  user_count INTEGER := 0;
  subscription_count INTEGER := 0;
  payment_count INTEGER := 0;
  backup_size INTEGER := 0;
BEGIN
  -- Generate backup ID
  backup_id := gen_random_uuid();
  
  -- Create comprehensive backup data
  WITH backup_collection AS (
    -- Users table (only membership_tier, no account_tier, no updated_at)
    SELECT
      'users' as table_name,
      json_agg(
        json_build_object(
          'id', id,
          'membership_tier', membership_tier,
          'created_at', created_at
        )
      ) as data
    FROM users
    WHERE membership_tier IS NOT NULL
    
    UNION ALL
    
    -- User subscriptions table
    SELECT 
      'user_subscriptions' as table_name,
      json_agg(row_to_json(user_subscriptions.*)) as data
    FROM user_subscriptions
    
    UNION ALL
    
    -- Payment records table (if exists)
    SELECT 
      'payment_records' as table_name,
      json_agg(row_to_json(payment_records.*)) as data
    FROM payment_records
    WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_records')
  )
  SELECT json_object_agg(table_name, data) INTO backup_data
  FROM backup_collection;
  
  -- Get record counts
  SELECT COUNT(*) INTO user_count FROM users WHERE membership_tier IS NOT NULL;
  SELECT COUNT(*) INTO subscription_count FROM user_subscriptions;
  SELECT COUNT(*) INTO payment_count FROM payment_records 
    WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_records');
  
  -- Calculate approximate backup size
  backup_size := octet_length(backup_data::text);
  
  -- Insert backup record (matching your existing schema)
  INSERT INTO system_backups (
    id,
    backup_id,
    backup_type,
    description,
    backup_data,
    table_counts,
    backup_size_bytes,
    backup_status
  ) VALUES (
    backup_id,
    'subscription_backup_' || to_char(NOW(), 'YYYY_MM_DD_HH24_MI_SS'),
    'subscription_system',
    backup_description,
    backup_data,
    json_build_object(
      'users', user_count,
      'user_subscriptions', subscription_count,
      'payment_records', payment_count,
      'total_records', user_count + subscription_count + payment_count
    ),
    backup_size,
    'completed'
  );
  
  -- Log the backup creation
  RAISE NOTICE 'Backup created: % (ID: %)', backup_description, backup_id;
  RAISE NOTICE 'Records backed up - Users: %, Subscriptions: %, Payments: %',
    user_count, subscription_count, payment_count;
  
  RETURN backup_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to restore from backup (emergency use only)
CREATE OR REPLACE FUNCTION restore_subscription_backup(backup_id UUID)
RETURNS JSONB AS $$
DECLARE
  backup_record RECORD;
  user_data JSONB;
  subscription_data JSONB;
  payment_data JSONB;
  restored_count INTEGER := 0;
  result JSONB;
BEGIN
  -- Get backup data
  SELECT * INTO backup_record FROM system_backups WHERE id = backup_id;
  
  IF backup_record IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Backup not found',
      'backup_id', backup_id
    );
  END IF;
  
  -- Extract table data
  user_data := backup_record.backup_data->'users';
  subscription_data := backup_record.backup_data->'user_subscriptions';
  payment_data := backup_record.backup_data->'payment_records';
  
  -- Restore users data (only membership_tier)
  IF user_data IS NOT NULL THEN
    WITH user_updates AS (
      SELECT 
        (value->>'id')::UUID as user_id,
        value->>'membership_tier' as membership_tier
      FROM jsonb_array_elements(user_data)
    )
    UPDATE users 
    SET 
      membership_tier = COALESCE(user_updates.membership_tier, users.membership_tier)
    FROM user_updates
    WHERE users.id = user_updates.user_id;
    
    GET DIAGNOSTICS restored_count = ROW_COUNT;
  END IF;
  
  -- Build result
  result := json_build_object(
    'success', true,
    'backup_id', backup_id,
    'backup_id_name', backup_record.backup_id,
    'backup_description', backup_record.description,
    'restored_users', restored_count,
    'restored_at', NOW()
  );

  -- Log the restore
  RAISE NOTICE 'Backup restored: % (% users updated)', backup_record.backup_id, restored_count;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to list available backups
CREATE OR REPLACE FUNCTION list_subscription_backups()
RETURNS TABLE (
  backup_uuid UUID,
  backup_name TEXT,
  backup_description TEXT,
  created_at TIMESTAMPTZ,
  record_count INTEGER,
  size_mb NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sb.id,
    sb.backup_id,
    sb.description,
    sb.created_at,
    COALESCE((sb.table_counts->>'total_records')::INTEGER, 0),
    ROUND(COALESCE(sb.backup_size_bytes, 0)::NUMERIC / 1024 / 1024, 2)
  FROM system_backups sb
  WHERE sb.backup_type = 'subscription_system'
  ORDER BY sb.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================
-- Comments for documentation
-- =========================
COMMENT ON TABLE system_backups IS 'Stores backup snapshots of subscription system data for emergency recovery';
COMMENT ON FUNCTION create_subscription_backup(TEXT) IS 'Creates a comprehensive backup of subscription-related data - CORRECTED to only use membership_tier';
COMMENT ON FUNCTION restore_subscription_backup(UUID) IS 'Restores subscription data from a backup - USE WITH EXTREME CAUTION';
COMMENT ON FUNCTION list_subscription_backups() IS 'Lists all available subscription system backups';

-- =========================
-- Initial backup creation
-- =========================
-- Create an initial backup to establish baseline
SELECT create_subscription_backup('Initial baseline backup - subscription system setup');
