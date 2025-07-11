-- Feature Flags System for Safe Deployment
-- Migration: 20250105_002_add_feature_flags.sql
-- Purpose: Create feature flag system for controlled subscription system rollout
-- Development Phase: Basic feature flags for safe deployment

-- Enable pgcrypto for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- Create feature_flags table
-- =========================
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key TEXT UNIQUE NOT NULL,
  flag_name TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN DEFAULT FALSE,
  
  -- Targeting options
  enabled_for_all BOOLEAN DEFAULT FALSE,
  enabled_for_stores JSONB DEFAULT '[]', -- Array of store IDs
  enabled_for_users JSONB DEFAULT '[]',  -- Array of user IDs
  enabled_for_tiers JSONB DEFAULT '[]',  -- Array of membership tiers
  
  -- Rollout percentage (0-100)
  rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Environment and category
  environment TEXT DEFAULT 'development' CHECK (environment IN ('development', 'staging', 'production')),
  category TEXT DEFAULT 'subscription' CHECK (category IN ('subscription', 'ui', 'api', 'security', 'performance'))
);

-- =========================
-- Create feature_flag_logs table for audit trail
-- =========================
CREATE TABLE IF NOT EXISTS feature_flag_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('created', 'enabled', 'disabled', 'updated', 'deleted')),
  old_value JSONB,
  new_value JSONB,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT
);

-- =========================
-- Indexes for performance
-- =========================
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(flag_key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(is_enabled);
CREATE INDEX IF NOT EXISTS idx_feature_flags_category ON feature_flags(category);
CREATE INDEX IF NOT EXISTS idx_feature_flags_environment ON feature_flags(environment);
CREATE INDEX IF NOT EXISTS idx_feature_flag_logs_key_date ON feature_flag_logs(flag_key, changed_at);

-- =========================
-- RLS Policies
-- =========================
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flag_logs ENABLE ROW LEVEL SECURITY;

-- Store administrators can manage feature flags
CREATE POLICY "Store admins can manage feature flags" ON feature_flags
FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM store_administrators
    WHERE user_id = auth.uid()
  )
);

-- All authenticated users can read feature flags (for client-side checks)
CREATE POLICY "Authenticated users can read feature flags" ON feature_flags
FOR SELECT TO authenticated USING (true);

-- Store administrators can view feature flag logs
CREATE POLICY "Store admins can view feature flag logs" ON feature_flag_logs
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM store_administrators
    WHERE user_id = auth.uid()
  )
);

-- =========================
-- Feature Flag Management Functions
-- =========================

-- Function to check if feature is enabled for user
CREATE OR REPLACE FUNCTION is_feature_enabled(
  p_flag_key TEXT,
  p_user_id UUID DEFAULT auth.uid(),
  p_store_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  flag_record RECORD;
  user_tier TEXT;
  random_value INTEGER;
BEGIN
  -- Get feature flag
  SELECT * INTO flag_record
  FROM feature_flags
  WHERE flag_key = p_flag_key;
  
  -- If flag doesn't exist, return false
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- If flag is globally disabled, return false
  IF NOT flag_record.is_enabled THEN
    RETURN FALSE;
  END IF;
  
  -- If enabled for all, return true
  IF flag_record.enabled_for_all THEN
    RETURN TRUE;
  END IF;
  
  -- Check store-specific enablement
  IF p_store_id IS NOT NULL AND flag_record.enabled_for_stores ? p_store_id::TEXT THEN
    RETURN TRUE;
  END IF;
  
  -- Check user-specific enablement
  IF p_user_id IS NOT NULL AND flag_record.enabled_for_users ? p_user_id::TEXT THEN
    RETURN TRUE;
  END IF;
  
  -- Check tier-specific enablement
  IF p_user_id IS NOT NULL THEN
    SELECT membership_tier INTO user_tier FROM users WHERE id = p_user_id;
    IF user_tier IS NOT NULL AND flag_record.enabled_for_tiers ? user_tier THEN
      RETURN TRUE;
    END IF;
  END IF;
  
  -- Check rollout percentage
  IF flag_record.rollout_percentage > 0 THEN
    -- Use user ID for consistent rollout (same user always gets same result)
    random_value := (hashtext(COALESCE(p_user_id::TEXT, 'anonymous')) % 100) + 1;
    IF random_value <= flag_record.rollout_percentage THEN
      RETURN TRUE;
    END IF;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create or update feature flag
CREATE OR REPLACE FUNCTION upsert_feature_flag(
  p_flag_key TEXT,
  p_flag_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_is_enabled BOOLEAN DEFAULT FALSE,
  p_category TEXT DEFAULT 'subscription'
) RETURNS UUID AS $$
DECLARE
  flag_id UUID;
  old_record RECORD;
BEGIN
  -- Get existing record for logging
  SELECT * INTO old_record FROM feature_flags WHERE flag_key = p_flag_key;
  
  -- Insert or update
  INSERT INTO feature_flags (
    flag_key,
    flag_name,
    description,
    is_enabled,
    category,
    created_by,
    updated_by
  ) VALUES (
    p_flag_key,
    p_flag_name,
    p_description,
    p_is_enabled,
    p_category,
    auth.uid(),
    auth.uid()
  )
  ON CONFLICT (flag_key) DO UPDATE SET
    flag_name = EXCLUDED.flag_name,
    description = EXCLUDED.description,
    is_enabled = EXCLUDED.is_enabled,
    category = EXCLUDED.category,
    updated_by = auth.uid(),
    updated_at = NOW()
  RETURNING id INTO flag_id;
  
  -- Log the change
  INSERT INTO feature_flag_logs (
    flag_key,
    action,
    old_value,
    new_value,
    changed_by,
    reason
  ) VALUES (
    p_flag_key,
    CASE WHEN old_record.flag_key IS NULL THEN 'created' ELSE 'updated' END,
    CASE WHEN old_record.flag_key IS NULL THEN NULL ELSE row_to_json(old_record) END,
    json_build_object(
      'flag_name', p_flag_name,
      'description', p_description,
      'is_enabled', p_is_enabled,
      'category', p_category
    ),
    auth.uid(),
    'Feature flag upserted via function'
  );
  
  RETURN flag_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to toggle feature flag
CREATE OR REPLACE FUNCTION toggle_feature_flag(
  p_flag_key TEXT,
  p_reason TEXT DEFAULT 'Manual toggle'
) RETURNS BOOLEAN AS $$
DECLARE
  old_enabled BOOLEAN;
  new_enabled BOOLEAN;
BEGIN
  -- Get current state and toggle
  UPDATE feature_flags
  SET 
    is_enabled = NOT is_enabled,
    updated_by = auth.uid(),
    updated_at = NOW()
  WHERE flag_key = p_flag_key
  RETURNING is_enabled, (NOT is_enabled) INTO new_enabled, old_enabled;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Feature flag not found: %', p_flag_key;
  END IF;
  
  -- Log the change
  INSERT INTO feature_flag_logs (
    flag_key,
    action,
    old_value,
    new_value,
    changed_by,
    reason
  ) VALUES (
    p_flag_key,
    CASE WHEN new_enabled THEN 'enabled' ELSE 'disabled' END,
    json_build_object('is_enabled', old_enabled),
    json_build_object('is_enabled', new_enabled),
    auth.uid(),
    p_reason
  );
  
  RETURN new_enabled;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================
-- Insert default subscription feature flags
-- =========================
INSERT INTO feature_flags (
  flag_key,
  flag_name,
  description,
  is_enabled,
  category,
  environment
) VALUES 
  (
    'subscription_validation_fix',
    'Subscription Validation Fix',
    'Enable the fixed subscription validation that checks actual subscription expiry dates',
    FALSE,
    'subscription',
    'development'
  ),
  (
    'subscription_cache_invalidation',
    'Subscription Cache Invalidation',
    'Enable automatic cache invalidation when subscriptions expire',
    FALSE,
    'subscription',
    'development'
  ),
  (
    'subscription_monitoring',
    'Subscription Monitoring',
    'Enable enhanced subscription monitoring and metrics collection',
    FALSE,
    'subscription',
    'development'
  )
ON CONFLICT (flag_key) DO NOTHING;

-- =========================
-- Comments for documentation
-- =========================
COMMENT ON TABLE feature_flags IS 'Feature flags for controlled rollout of new functionality, particularly subscription system fixes';
COMMENT ON TABLE feature_flag_logs IS 'Audit trail for all feature flag changes';
COMMENT ON FUNCTION is_feature_enabled(TEXT, UUID, UUID) IS 'Check if a feature flag is enabled for a specific user/store context';
COMMENT ON FUNCTION upsert_feature_flag(TEXT, TEXT, TEXT, BOOLEAN, TEXT) IS 'Create or update a feature flag with automatic logging';
COMMENT ON FUNCTION toggle_feature_flag(TEXT, TEXT) IS 'Toggle a feature flag on/off with audit logging';
