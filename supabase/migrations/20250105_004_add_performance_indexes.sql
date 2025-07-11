-- Performance Indexes for Subscription System
-- Migration: 20250105_004_add_performance_indexes.sql
-- Purpose: Add critical indexes for subscription validation performance
-- Development Phase: Essential indexes for subscription queries

-- =========================
-- Subscription-related indexes
-- =========================

-- Critical index for subscription validation queries
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_active_end_date 
ON user_subscriptions(user_id, is_active, end_date) 
WHERE is_active = TRUE;

-- Index for subscription expiry checks
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_end_date_active 
ON user_subscriptions(end_date, is_active) 
WHERE is_active = TRUE;

-- Index for store-specific subscription queries
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_store_active 
ON user_subscriptions(store_id, is_active, end_date) 
WHERE is_active = TRUE;

-- Composite index for subscription tier queries
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_tier_active_end 
ON user_subscriptions(tier, is_active, end_date) 
WHERE is_active = TRUE;

-- =========================
-- User membership indexes
-- =========================

-- Index for membership tier queries (critical for entitlement checks)
CREATE INDEX IF NOT EXISTS idx_users_membership_tier 
ON users(membership_tier) 
WHERE membership_tier IS NOT NULL;

-- Index for users with membership tiers (simplified - account_tier was removed)
CREATE INDEX IF NOT EXISTS idx_users_membership_tier_not_null
ON users(membership_tier)
WHERE membership_tier IS NOT NULL;

-- Index for users with premium tiers (for health checks)
CREATE INDEX IF NOT EXISTS idx_users_premium_tiers 
ON users(id, membership_tier) 
WHERE membership_tier IN ('PRIVILEGED', 'PRIVILEGED_PLUS');

-- =========================
-- Payment records indexes
-- =========================

-- Index for payment record lookups by user
CREATE INDEX IF NOT EXISTS idx_payment_records_user_date 
ON payment_records(user_id, payment_date DESC);

-- Index for payment record lookups by subscription
CREATE INDEX IF NOT EXISTS idx_payment_records_subscription_date 
ON payment_records(subscription_id, payment_date DESC) 
WHERE subscription_id IS NOT NULL;

-- Index for store payment queries
CREATE INDEX IF NOT EXISTS idx_payment_records_store_date 
ON payment_records(store_id, payment_date DESC);

-- =========================
-- Partial indexes for common queries
-- =========================

-- Index for finding expired subscriptions that are still marked active
-- Note: Removed NOW() from predicate as it's not immutable - filter will be applied at query time
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_expired_but_active
ON user_subscriptions(user_id, end_date, is_active)
WHERE is_active = TRUE;

-- Index for finding users with mismatched entitlements
CREATE INDEX IF NOT EXISTS idx_users_potential_entitlement_issues 
ON users(id, membership_tier) 
WHERE membership_tier IN ('PRIVILEGED', 'PRIVILEGED_PLUS');

-- =========================
-- Indexes for monitoring tables
-- =========================

-- Index for subscription metrics queries
CREATE INDEX IF NOT EXISTS idx_subscription_metrics_type_recorded 
ON subscription_metrics(metric_type, recorded_at DESC);

-- Index for user-specific metrics
CREATE INDEX IF NOT EXISTS idx_subscription_metrics_user_recorded 
ON subscription_metrics(user_id, recorded_at DESC) 
WHERE user_id IS NOT NULL;

-- Index for health check queries
CREATE INDEX IF NOT EXISTS idx_subscription_health_checks_type_checked 
ON subscription_health_checks(check_type, checked_at DESC);

-- =========================
-- Function-based indexes for complex queries
-- =========================

-- Index to support the has_active_subscription function
-- Note: Removed NOW() from predicate as it's not immutable - filter will be applied at query time
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_active_check
ON user_subscriptions(user_id, end_date, is_active)
WHERE is_active = TRUE;

-- =========================
-- Constraints and checks
-- =========================

-- Add constraint to ensure subscription end_date is after start_date
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'chk_subscription_date_order'
    AND table_name = 'user_subscriptions'
  ) THEN
    ALTER TABLE user_subscriptions
    ADD CONSTRAINT chk_subscription_date_order
    CHECK (end_date > start_date);
  END IF;
END $$;

-- Add constraint to ensure payment amounts are positive
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'chk_payment_amount_positive'
    AND table_name = 'payment_records'
  ) THEN
    ALTER TABLE payment_records
    ADD CONSTRAINT chk_payment_amount_positive
    CHECK (amount IS NULL OR amount > 0);
  END IF;
END $$;

-- Add constraint to ensure subscription tiers match expected values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'chk_subscription_tier_valid'
    AND table_name = 'user_subscriptions'
  ) THEN
    ALTER TABLE user_subscriptions
    ADD CONSTRAINT chk_subscription_tier_valid
    CHECK (tier IN ('privileged', 'privileged_plus'));
  END IF;
END $$;

-- =========================
-- Update table statistics for better query planning
-- =========================

-- Analyze tables to update statistics
ANALYZE users;
ANALYZE user_subscriptions;
ANALYZE payment_records;
ANALYZE subscription_metrics;
ANALYZE subscription_health_checks;

-- =========================
-- Create function to monitor index usage
-- =========================
CREATE OR REPLACE FUNCTION get_subscription_index_usage()
RETURNS TABLE (
  schemaname TEXT,
  tablename TEXT,
  indexname TEXT,
  idx_scan BIGINT,
  idx_tup_read BIGINT,
  idx_tup_fetch BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.schemaname::TEXT,
    s.tablename::TEXT,
    s.indexname::TEXT,
    s.idx_scan,
    s.idx_tup_read,
    s.idx_tup_fetch
  FROM pg_stat_user_indexes s
  JOIN pg_index i ON s.indexrelid = i.indexrelid
  WHERE s.tablename IN ('users', 'user_subscriptions', 'payment_records', 'subscription_metrics', 'subscription_health_checks')
  AND s.indexname LIKE 'idx_%'
  ORDER BY s.idx_scan DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================
-- Create function to identify missing indexes
-- =========================
CREATE OR REPLACE FUNCTION analyze_subscription_query_performance()
RETURNS TABLE (
  query_type TEXT,
  table_name TEXT,
  suggested_index TEXT,
  reason TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'subscription_validation'::TEXT as query_type,
    'user_subscriptions'::TEXT as table_name,
    'idx_user_subscriptions_user_active_end_date'::TEXT as suggested_index,
    'Critical for has_active_subscription() function performance'::TEXT as reason
  
  UNION ALL
  
  SELECT 
    'entitlement_check'::TEXT,
    'users'::TEXT,
    'idx_users_membership_tier'::TEXT,
    'Essential for membership tier lookups in entitlement calculations'::TEXT
  
  UNION ALL
  
  SELECT 
    'health_monitoring'::TEXT,
    'user_subscriptions'::TEXT,
    'idx_user_subscriptions_end_date_active'::TEXT,
    'Required for efficient expired subscription detection'::TEXT
  
  UNION ALL
  
  SELECT 
    'payment_tracking'::TEXT,
    'payment_records'::TEXT,
    'idx_payment_records_user_date'::TEXT,
    'Optimizes payment history queries for users'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================
-- Comments for documentation
-- =========================
COMMENT ON INDEX idx_user_subscriptions_user_active_end_date IS 'Critical index for subscription validation - supports has_active_subscription() function';
COMMENT ON INDEX idx_users_membership_tier IS 'Essential index for entitlement calculations based on membership tier';
COMMENT ON INDEX idx_user_subscriptions_end_date_active IS 'Supports efficient queries for expired subscription detection';
COMMENT ON FUNCTION get_subscription_index_usage() IS 'Monitor index usage statistics for subscription-related tables';
COMMENT ON FUNCTION analyze_subscription_query_performance() IS 'Analyze and suggest performance optimizations for subscription queries';
