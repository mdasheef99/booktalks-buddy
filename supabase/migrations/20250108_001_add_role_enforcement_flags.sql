-- Role-Based Subscription Enforcement Feature Flags
-- Migration: 20250108_001_add_role_enforcement_flags.sql
-- Purpose: Add feature flags for controlled rollout of role-based subscription enforcement
-- Development Phase: Phase 3.1 - Administrative Role Exemption System
-- 
-- IMPLEMENTATION STRATEGY:
-- This migration adds the role_based_subscription_enforcement feature flag to enable
-- controlled rollout of subscription validation for user roles while exempting
-- administrative roles from validation requirements.
--
-- ROLE CLASSIFICATION:
-- - ADMINISTRATIVE_EXEMPT: Platform Owner, Store Owner, Store Manager
-- - USER_ENFORCED: Club Leadership, Club Moderator
--
-- SAFETY APPROACH:
-- - Initial rollout set to 0% for safe testing
-- - Feature flag can be gradually increased for controlled deployment
-- - Maintains 100% backward compatibility when disabled

-- Enable pgcrypto for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- Add Role-Based Enforcement Feature Flag
-- =========================

-- Insert the main role-based subscription enforcement feature flag
INSERT INTO feature_flags (
  flag_key,
  flag_name,
  description,
  is_enabled,
  rollout_percentage,
  category,
  environment,
  enabled_for_all,
  created_at,
  updated_at
) VALUES (
  'role_based_subscription_enforcement',
  'Role-Based Subscription Enforcement',
  'Enable subscription validation for user roles (club leads, moderators) while exempting administrative roles (platform/store owners)',
  FALSE,  -- Disabled by default for safe rollout
  0,      -- 0% rollout initially
  'subscription',
  'development',
  FALSE,  -- Not enabled for all users initially
  NOW(),
  NOW()
) ON CONFLICT (flag_key) DO UPDATE SET
  flag_name = EXCLUDED.flag_name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- =========================
-- Add Supporting Feature Flags for Role Classification
-- =========================

-- Feature flag for administrative role exemption logging
INSERT INTO feature_flags (
  flag_key,
  flag_name,
  description,
  is_enabled,
  rollout_percentage,
  category,
  environment,
  enabled_for_all,
  created_at,
  updated_at
) VALUES (
  'role_classification_logging',
  'Role Classification Logging',
  'Enable detailed logging of role classification decisions for monitoring and debugging',
  TRUE,   -- Enabled for monitoring
  100,    -- Full rollout for logging
  'subscription',
  'development',
  TRUE,   -- Enabled for all users for monitoring
  NOW(),
  NOW()
) ON CONFLICT (flag_key) DO UPDATE SET
  flag_name = EXCLUDED.flag_name,
  description = EXCLUDED.description,
  is_enabled = EXCLUDED.is_enabled,
  rollout_percentage = EXCLUDED.rollout_percentage,
  enabled_for_all = EXCLUDED.enabled_for_all,
  updated_at = NOW();

-- Feature flag for graceful role degradation (future use)
INSERT INTO feature_flags (
  flag_key,
  flag_name,
  description,
  is_enabled,
  rollout_percentage,
  category,
  environment,
  enabled_for_all,
  created_at,
  updated_at
) VALUES (
  'graceful_role_degradation',
  'Graceful Role Degradation',
  'Enable graceful degradation of user roles when subscriptions expire, including grace periods and notifications',
  FALSE,  -- Disabled - for future Phase 3.3 implementation
  0,      -- 0% rollout initially
  'subscription',
  'development',
  FALSE,  -- Not enabled initially
  NOW(),
  NOW()
) ON CONFLICT (flag_key) DO UPDATE SET
  flag_name = EXCLUDED.flag_name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- =========================
-- Create Role Enforcement Configuration Table
-- =========================

-- Table to store role-specific enforcement configuration
CREATE TABLE IF NOT EXISTS role_enforcement_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_type TEXT NOT NULL CHECK (role_type IN (
    'PLATFORM_OWNER',
    'STORE_OWNER', 
    'STORE_MANAGER',
    'CLUB_LEADERSHIP',
    'CLUB_MODERATOR'
  )),
  enforcement_type TEXT NOT NULL CHECK (enforcement_type IN (
    'EXEMPT',      -- Exempt from subscription validation
    'ENFORCED',    -- Requires subscription validation
    'CONDITIONAL'  -- Conditional enforcement based on other factors
  )),
  
  -- Configuration details
  requires_subscription BOOLEAN NOT NULL DEFAULT FALSE,
  grace_period_days INTEGER DEFAULT 0,
  notification_enabled BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Ensure unique role type
  UNIQUE(role_type)
);

-- =========================
-- Insert Default Role Enforcement Configuration
-- =========================

-- Administrative roles (exempt from subscription validation)
INSERT INTO role_enforcement_config (
  role_type,
  enforcement_type,
  requires_subscription,
  grace_period_days,
  notification_enabled,
  description
) VALUES 
  (
    'PLATFORM_OWNER',
    'EXEMPT',
    FALSE,
    0,
    FALSE,
    'Platform owner is exempt from all subscription validation for operational continuity'
  ),
  (
    'STORE_OWNER',
    'EXEMPT', 
    FALSE,
    0,
    FALSE,
    'Store owners are exempt from subscription validation to ensure business operations continue'
  ),
  (
    'STORE_MANAGER',
    'EXEMPT',
    FALSE,
    0,
    FALSE,
    'Store managers are exempt from subscription validation as administrative role'
  ),
  
  -- User roles (require subscription validation)
  (
    'CLUB_LEADERSHIP',
    'ENFORCED',
    TRUE,
    7,  -- 7-day grace period for club continuity
    TRUE,
    'Club leaders require active subscription to maintain leadership privileges'
  ),
  (
    'CLUB_MODERATOR',
    'ENFORCED',
    TRUE,
    3,  -- 3-day grace period for moderation continuity
    TRUE,
    'Club moderators require active subscription to maintain moderation privileges'
  )
ON CONFLICT (role_type) DO UPDATE SET
  enforcement_type = EXCLUDED.enforcement_type,
  requires_subscription = EXCLUDED.requires_subscription,
  grace_period_days = EXCLUDED.grace_period_days,
  notification_enabled = EXCLUDED.notification_enabled,
  description = EXCLUDED.description,
  updated_at = NOW();

-- =========================
-- Create Indexes for Performance
-- =========================

-- Index for role enforcement lookups
CREATE INDEX IF NOT EXISTS idx_role_enforcement_config_role_type 
ON role_enforcement_config(role_type);

CREATE INDEX IF NOT EXISTS idx_role_enforcement_config_enforcement_type 
ON role_enforcement_config(enforcement_type);

-- =========================
-- RLS Policies for Role Enforcement Config
-- =========================

ALTER TABLE role_enforcement_config ENABLE ROW LEVEL SECURITY;

-- Store administrators can view role enforcement configuration
CREATE POLICY "Store admins can view role enforcement config" ON role_enforcement_config
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM store_administrators
    WHERE user_id = auth.uid()
  )
);

-- Only platform owners can modify role enforcement configuration
CREATE POLICY "Platform owners can manage role enforcement config" ON role_enforcement_config
FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM platform_settings
    WHERE key = 'platform_owner_id'
    AND value = auth.uid()::TEXT
  )
);

-- =========================
-- Helper Functions for Role Enforcement
-- =========================

-- Function to check if role enforcement is enabled
CREATE OR REPLACE FUNCTION is_role_enforcement_enabled()
RETURNS BOOLEAN AS $$
DECLARE
  flag_enabled BOOLEAN := FALSE;
BEGIN
  -- Check if role-based subscription enforcement flag is enabled
  SELECT is_enabled INTO flag_enabled
  FROM feature_flags
  WHERE flag_key = 'role_based_subscription_enforcement';
  
  RETURN COALESCE(flag_enabled, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get role enforcement configuration
CREATE OR REPLACE FUNCTION get_role_enforcement_config(p_role_type TEXT)
RETURNS TABLE (
  enforcement_type TEXT,
  requires_subscription BOOLEAN,
  grace_period_days INTEGER,
  notification_enabled BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rec.enforcement_type,
    rec.requires_subscription,
    rec.grace_period_days,
    rec.notification_enabled
  FROM role_enforcement_config rec
  WHERE rec.role_type = p_role_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if role requires subscription validation
CREATE OR REPLACE FUNCTION role_requires_subscription_validation(p_role_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  requires_validation BOOLEAN := FALSE;
  enforcement_enabled BOOLEAN := FALSE;
BEGIN
  -- First check if role enforcement is globally enabled
  enforcement_enabled := is_role_enforcement_enabled();
  
  IF NOT enforcement_enabled THEN
    RETURN FALSE; -- No enforcement if feature is disabled
  END IF;
  
  -- Get role-specific configuration
  SELECT requires_subscription INTO requires_validation
  FROM role_enforcement_config
  WHERE role_type = p_role_type;
  
  RETURN COALESCE(requires_validation, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================
-- Create View for Role Enforcement Dashboard
-- =========================

CREATE OR REPLACE VIEW role_enforcement_dashboard AS
SELECT 
  -- Feature flag status
  (SELECT is_enabled FROM feature_flags WHERE flag_key = 'role_based_subscription_enforcement') as enforcement_enabled,
  (SELECT rollout_percentage FROM feature_flags WHERE flag_key = 'role_based_subscription_enforcement') as rollout_percentage,
  
  -- Role configuration summary
  (SELECT COUNT(*) FROM role_enforcement_config WHERE enforcement_type = 'EXEMPT') as exempt_roles_count,
  (SELECT COUNT(*) FROM role_enforcement_config WHERE enforcement_type = 'ENFORCED') as enforced_roles_count,
  
  -- Current enforcement status
  (SELECT COUNT(*) FROM role_enforcement_config WHERE requires_subscription = TRUE) as roles_requiring_subscription,
  
  -- Last configuration update
  (SELECT MAX(updated_at) FROM role_enforcement_config) as last_config_update,
  (SELECT MAX(updated_at) FROM feature_flags WHERE flag_key LIKE '%role%') as last_flag_update;

-- =========================
-- Comments for Documentation
-- =========================

COMMENT ON TABLE role_enforcement_config IS 'Configuration table for role-based subscription enforcement rules';
COMMENT ON FUNCTION is_role_enforcement_enabled() IS 'Check if role-based subscription enforcement feature flag is enabled';
COMMENT ON FUNCTION get_role_enforcement_config(TEXT) IS 'Get enforcement configuration for a specific role type';
COMMENT ON FUNCTION role_requires_subscription_validation(TEXT) IS 'Check if a specific role type requires subscription validation';
COMMENT ON VIEW role_enforcement_dashboard IS 'Dashboard view showing current role enforcement configuration and status';

-- =========================
-- Log Migration Completion
-- =========================

-- Log the successful completion of this migration
DO $$
BEGIN
  RAISE NOTICE 'Migration 20250108_001_add_role_enforcement_flags completed successfully';
  RAISE NOTICE 'Role-based subscription enforcement feature flag added (disabled by default)';
  RAISE NOTICE 'Role enforcement configuration table created with default rules';
  RAISE NOTICE 'Administrative roles (Platform Owner, Store Owner, Store Manager) configured as EXEMPT';
  RAISE NOTICE 'User roles (Club Leadership, Club Moderator) configured as ENFORCED';
  RAISE NOTICE 'Feature flag rollout set to 0%% for safe testing';
END $$;
