-- Subscription System Backup Infrastructure
-- Migration: 20250105_001_add_backup_system.sql
-- Purpose: Create backup system for safe subscription system changes
-- Development Phase: Streamlined approach for development environment

-- Enable pgcrypto for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- Create system_backups table
-- =========================
CREATE TABLE IF NOT EXISTS system_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_id TEXT UNIQUE NOT NULL,
  backup_type TEXT NOT NULL CHECK (backup_type IN ('subscription_system', 'user_data', 'full_system')),
  description TEXT,
  backup_data JSONB NOT NULL,
  table_counts JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  restored_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  
  -- Metadata for backup management
  backup_size_bytes BIGINT,
  compression_used BOOLEAN DEFAULT FALSE,
  backup_status TEXT DEFAULT 'completed' CHECK (backup_status IN ('in_progress', 'completed', 'failed', 'restored'))
);

-- =========================
-- Indexes for performance
-- =========================
CREATE INDEX IF NOT EXISTS idx_system_backups_backup_id ON system_backups(backup_id);
CREATE INDEX IF NOT EXISTS idx_system_backups_type_created ON system_backups(backup_type, created_at);
CREATE INDEX IF NOT EXISTS idx_system_backups_status ON system_backups(backup_status);
CREATE INDEX IF NOT EXISTS idx_system_backups_created_by ON system_backups(created_by);

-- =========================
-- RLS Policies
-- =========================
ALTER TABLE system_backups ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can create backups
CREATE POLICY "Authenticated users can create backups" ON system_backups
FOR INSERT TO authenticated WITH CHECK (
  created_by = auth.uid()
);

-- Users can view their own backups
CREATE POLICY "Users can view own backups" ON system_backups
FOR SELECT TO authenticated USING (
  created_by = auth.uid()
);

-- Store administrators can view all backups for their stores
CREATE POLICY "Store admins can view all backups" ON system_backups
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM store_administrators
    WHERE user_id = auth.uid()
  )
);

-- =========================
-- Backup Management Functions
-- =========================

-- Function to create subscription system backup
CREATE OR REPLACE FUNCTION create_subscription_backup(
  p_description TEXT DEFAULT 'Automated subscription backup'
) RETURNS TEXT AS $$
DECLARE
  backup_id TEXT;
  backup_data JSONB;
  user_count INTEGER;
  subscription_count INTEGER;
  payment_count INTEGER;
BEGIN
  -- Generate unique backup ID
  backup_id := 'sub_backup_' || EXTRACT(EPOCH FROM NOW())::BIGINT || '_' || SUBSTRING(gen_random_uuid()::TEXT, 1, 8);
  
  -- Collect subscription-related data
  WITH backup_collection AS (
    SELECT
      'users' as table_name,
      json_agg(
        json_build_object(
          'id', id,
          'membership_tier', membership_tier,
          'created_at', created_at,
          'updated_at', updated_at
        )
      ) as data
    FROM users
    WHERE membership_tier IS NOT NULL
    
    UNION ALL
    
    SELECT 
      'user_subscriptions' as table_name,
      json_agg(row_to_json(user_subscriptions.*)) as data
    FROM user_subscriptions
    
    UNION ALL
    
    SELECT 
      'payment_records' as table_name,
      json_agg(row_to_json(payment_records.*)) as data
    FROM payment_records
  )
  SELECT json_object_agg(table_name, data) INTO backup_data
  FROM backup_collection;
  
  -- Get record counts
  SELECT COUNT(*) INTO user_count FROM users WHERE membership_tier IS NOT NULL;
  SELECT COUNT(*) INTO subscription_count FROM user_subscriptions;
  SELECT COUNT(*) INTO payment_count FROM payment_records;
  
  -- Insert backup record
  INSERT INTO system_backups (
    backup_id,
    backup_type,
    description,
    backup_data,
    table_counts,
    created_by,
    backup_size_bytes
  ) VALUES (
    backup_id,
    'subscription_system',
    p_description,
    backup_data,
    json_build_object(
      'users', user_count,
      'subscriptions', subscription_count,
      'payments', payment_count,
      'total_records', user_count + subscription_count + payment_count
    ),
    auth.uid(),
    octet_length(backup_data::TEXT)
  );
  
  RETURN backup_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to restore from backup (emergency use)
CREATE OR REPLACE FUNCTION restore_subscription_backup(
  p_backup_id TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  backup_record RECORD;
  restore_data JSONB;
  user_data JSONB;
  subscription_data JSONB;
  payment_data JSONB;
  restored_count INTEGER := 0;
BEGIN
  -- Get backup data
  SELECT * INTO backup_record
  FROM system_backups
  WHERE backup_id = p_backup_id
  AND backup_type = 'subscription_system';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Backup not found: %', p_backup_id;
  END IF;
  
  restore_data := backup_record.backup_data;
  
  -- Extract data by table
  user_data := restore_data->'users';
  subscription_data := restore_data->'user_subscriptions';
  payment_data := restore_data->'payment_records';
  
  -- Restore user membership data (only membership_tier to avoid overwriting other data)
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
  
  -- Update backup record
  UPDATE system_backups
  SET 
    restored_at = NOW(),
    backup_status = 'restored'
  WHERE backup_id = p_backup_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old backups (keep last 10)
CREATE OR REPLACE FUNCTION cleanup_old_backups()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM system_backups
  WHERE id NOT IN (
    SELECT id FROM system_backups
    WHERE backup_type = 'subscription_system'
    ORDER BY created_at DESC
    LIMIT 10
  )
  AND backup_type = 'subscription_system'
  AND created_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =========================
-- Comments for documentation
-- =========================
COMMENT ON TABLE system_backups IS 'Stores backup data for critical system changes, particularly subscription-related modifications';
COMMENT ON FUNCTION create_subscription_backup(TEXT) IS 'Creates a comprehensive backup of subscription-related data before making changes';
COMMENT ON FUNCTION restore_subscription_backup(TEXT) IS 'Restores subscription data from a backup - USE WITH CAUTION';
COMMENT ON FUNCTION cleanup_old_backups() IS 'Removes old backup records to prevent table bloat - keeps last 10 subscription backups';
