-- Subscription Monitoring and Metrics System
-- Migration: 20250105_003_add_subscription_monitoring.sql
-- Purpose: Create monitoring system for subscription health and metrics
-- Development Phase: Basic monitoring for subscription system validation

-- Enable pgcrypto for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- Create subscription_metrics table
-- =========================
CREATE TABLE IF NOT EXISTS subscription_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT NOT NULL CHECK (metric_type IN (
    'subscription_created',
    'subscription_expired',
    'subscription_renewed',
    'entitlement_granted',
    'entitlement_revoked',
    'cache_invalidated',
    'validation_error',
    'payment_recorded'
  )),
  
  -- Context data
  user_id UUID REFERENCES auth.users(id),
  store_id UUID,
  subscription_id UUID REFERENCES user_subscriptions(id),
  
  -- Metric details
  metric_value NUMERIC DEFAULT 1,
  metric_data JSONB DEFAULT '{}',
  
  -- Timestamps
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  event_date DATE DEFAULT CURRENT_DATE,
  
  -- Additional context
  source TEXT DEFAULT 'system' CHECK (source IN ('system', 'admin', 'user', 'api')),
  environment TEXT DEFAULT 'development' CHECK (environment IN ('development', 'staging', 'production'))
);

-- =========================
-- Create subscription_health_checks table
-- =========================
CREATE TABLE IF NOT EXISTS subscription_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_type TEXT NOT NULL CHECK (check_type IN (
    'expired_subscriptions',
    'invalid_entitlements',
    'cache_consistency',
    'payment_reconciliation',
    'tier_mismatch'
  )),
  
  -- Check results
  status TEXT NOT NULL CHECK (status IN ('healthy', 'warning', 'critical', 'error')),
  issues_found INTEGER DEFAULT 0,
  issues_resolved INTEGER DEFAULT 0,
  
  -- Details
  check_data JSONB DEFAULT '{}',
  error_details TEXT,
  
  -- Timestamps
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  
  -- Context
  checked_by UUID REFERENCES auth.users(id),
  auto_resolved BOOLEAN DEFAULT FALSE
);

-- =========================
-- Indexes for performance
-- =========================
CREATE INDEX IF NOT EXISTS idx_subscription_metrics_type_date ON subscription_metrics(metric_type, event_date);
CREATE INDEX IF NOT EXISTS idx_subscription_metrics_user_date ON subscription_metrics(user_id, recorded_at);
CREATE INDEX IF NOT EXISTS idx_subscription_metrics_store_date ON subscription_metrics(store_id, recorded_at);
CREATE INDEX IF NOT EXISTS idx_subscription_health_checks_type_status ON subscription_health_checks(check_type, status);
CREATE INDEX IF NOT EXISTS idx_subscription_health_checks_checked_at ON subscription_health_checks(checked_at);

-- =========================
-- RLS Policies
-- =========================
ALTER TABLE subscription_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_health_checks ENABLE ROW LEVEL SECURITY;

-- Store administrators can view all metrics for their stores
CREATE POLICY "Store admins can view store metrics" ON subscription_metrics
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM store_administrators sa
    WHERE sa.user_id = auth.uid()
    AND (sa.store_id = subscription_metrics.store_id OR subscription_metrics.store_id IS NULL)
  )
);

-- Users can view their own metrics
CREATE POLICY "Users can view own metrics" ON subscription_metrics
FOR SELECT TO authenticated USING (
  user_id = auth.uid()
);

-- Store administrators can view health checks
CREATE POLICY "Store admins can view health checks" ON subscription_health_checks
FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM store_administrators
    WHERE user_id = auth.uid()
  )
);

-- =========================
-- Monitoring Functions
-- =========================

-- Function to record subscription metric
CREATE OR REPLACE FUNCTION record_subscription_metric(
  p_metric_type TEXT,
  p_user_id UUID DEFAULT NULL,
  p_store_id UUID DEFAULT NULL,
  p_subscription_id UUID DEFAULT NULL,
  p_metric_value NUMERIC DEFAULT 1,
  p_metric_data JSONB DEFAULT '{}',
  p_source TEXT DEFAULT 'system'
) RETURNS UUID AS $$
DECLARE
  metric_id UUID;
BEGIN
  INSERT INTO subscription_metrics (
    metric_type,
    user_id,
    store_id,
    subscription_id,
    metric_value,
    metric_data,
    source
  ) VALUES (
    p_metric_type,
    p_user_id,
    p_store_id,
    p_subscription_id,
    p_metric_value,
    p_metric_data,
    p_source
  ) RETURNING id INTO metric_id;
  
  RETURN metric_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check for expired subscriptions with invalid entitlements
CREATE OR REPLACE FUNCTION check_subscription_health()
RETURNS UUID AS $$
DECLARE
  check_id UUID;
  expired_with_premium INTEGER := 0;
  total_expired INTEGER := 0;
  issues_data JSONB;
BEGIN
  -- Count users with expired subscriptions but premium membership tiers
  SELECT COUNT(*) INTO expired_with_premium
  FROM users u
  WHERE u.membership_tier IN ('PRIVILEGED', 'PRIVILEGED_PLUS')
  AND NOT EXISTS (
    SELECT 1 FROM user_subscriptions us
    WHERE us.user_id = u.id
    AND us.is_active = TRUE
    AND us.end_date > NOW()
  );
  
  -- Count total expired subscriptions
  SELECT COUNT(*) INTO total_expired
  FROM user_subscriptions
  WHERE is_active = TRUE
  AND end_date <= NOW();
  
  -- Build issues data
  issues_data := json_build_object(
    'expired_with_premium_tier', expired_with_premium,
    'total_expired_subscriptions', total_expired,
    'check_timestamp', NOW(),
    'critical_threshold', 5
  );
  
  -- Insert health check record
  INSERT INTO subscription_health_checks (
    check_type,
    status,
    issues_found,
    check_data,
    checked_by
  ) VALUES (
    'expired_subscriptions',
    CASE 
      WHEN expired_with_premium = 0 THEN 'healthy'
      WHEN expired_with_premium < 5 THEN 'warning'
      ELSE 'critical'
    END,
    expired_with_premium,
    issues_data,
    auth.uid()
  ) RETURNING id INTO check_id;
  
  -- Record metrics
  PERFORM record_subscription_metric(
    'validation_error',
    NULL,
    NULL,
    NULL,
    expired_with_premium,
    json_build_object('check_id', check_id, 'type', 'expired_with_premium')
  );
  
  RETURN check_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get subscription metrics summary
CREATE OR REPLACE FUNCTION get_subscription_metrics_summary(
  p_days INTEGER DEFAULT 7,
  p_store_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  WITH daily_metrics AS (
    SELECT 
      event_date,
      metric_type,
      COUNT(*) as count,
      SUM(metric_value) as total_value
    FROM subscription_metrics
    WHERE recorded_at >= NOW() - (p_days || ' days')::INTERVAL
    AND (p_store_id IS NULL OR store_id = p_store_id)
    GROUP BY event_date, metric_type
  ),
  summary_stats AS (
    SELECT 
      metric_type,
      COUNT(*) as total_events,
      SUM(total_value) as total_value,
      AVG(total_value) as avg_daily_value,
      MAX(total_value) as max_daily_value
    FROM daily_metrics
    GROUP BY metric_type
  )
  SELECT json_object_agg(metric_type, json_build_object(
    'total_events', total_events,
    'total_value', total_value,
    'avg_daily_value', ROUND(avg_daily_value, 2),
    'max_daily_value', max_daily_value
  )) INTO result
  FROM summary_stats;
  
  RETURN COALESCE(result, '{}'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-resolve expired subscription issues
CREATE OR REPLACE FUNCTION auto_resolve_expired_subscriptions()
RETURNS INTEGER AS $$
DECLARE
  resolved_count INTEGER := 0;
  user_record RECORD;
BEGIN
  -- Find users with expired subscriptions but premium tiers
  FOR user_record IN
    SELECT u.id, u.membership_tier, u.account_tier
    FROM users u
    WHERE u.membership_tier IN ('PRIVILEGED', 'PRIVILEGED_PLUS')
    AND NOT EXISTS (
      SELECT 1 FROM user_subscriptions us
      WHERE us.user_id = u.id
      AND us.is_active = TRUE
      AND us.end_date > NOW()
    )
    LIMIT 100 -- Process in batches
  LOOP
    -- Downgrade to MEMBER tier
    UPDATE users
    SET 
      membership_tier = 'MEMBER',
      account_tier = 'free',
      updated_at = NOW()
    WHERE id = user_record.id;
    
    -- Record the metric
    PERFORM record_subscription_metric(
      'entitlement_revoked',
      user_record.id,
      NULL,
      NULL,
      1,
      json_build_object(
        'old_membership_tier', user_record.membership_tier,
        'old_account_tier', user_record.account_tier,
        'new_membership_tier', 'MEMBER',
        'new_account_tier', 'free',
        'reason', 'auto_resolved_expired_subscription'
      ),
      'system'
    );
    
    resolved_count := resolved_count + 1;
  END LOOP;
  
  -- Record health check if any issues were resolved
  IF resolved_count > 0 THEN
    INSERT INTO subscription_health_checks (
      check_type,
      status,
      issues_found,
      issues_resolved,
      check_data,
      auto_resolved
    ) VALUES (
      'expired_subscriptions',
      'healthy',
      resolved_count,
      resolved_count,
      json_build_object(
        'resolved_users', resolved_count,
        'action', 'auto_downgrade_expired',
        'timestamp', NOW()
      ),
      TRUE
    );
  END IF;
  
  RETURN resolved_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================
-- Create view for subscription dashboard
-- =========================
CREATE OR REPLACE VIEW subscription_dashboard AS
SELECT 
  -- Current subscription stats
  (SELECT COUNT(*) FROM user_subscriptions WHERE is_active = TRUE AND end_date > NOW()) as active_subscriptions,
  (SELECT COUNT(*) FROM user_subscriptions WHERE is_active = TRUE AND end_date <= NOW()) as expired_subscriptions,
  (SELECT COUNT(*) FROM users WHERE membership_tier = 'PRIVILEGED') as privileged_users,
  (SELECT COUNT(*) FROM users WHERE membership_tier = 'PRIVILEGED_PLUS') as privileged_plus_users,
  
  -- Health indicators
  (SELECT COUNT(*) FROM users u WHERE u.membership_tier IN ('PRIVILEGED', 'PRIVILEGED_PLUS') 
   AND NOT EXISTS (SELECT 1 FROM user_subscriptions us WHERE us.user_id = u.id AND us.is_active = TRUE AND us.end_date > NOW())) as users_with_invalid_entitlements,
  
  -- Recent metrics (last 24 hours)
  (SELECT COUNT(*) FROM subscription_metrics WHERE metric_type = 'subscription_created' AND recorded_at >= NOW() - INTERVAL '24 hours') as subscriptions_created_24h,
  (SELECT COUNT(*) FROM subscription_metrics WHERE metric_type = 'subscription_expired' AND recorded_at >= NOW() - INTERVAL '24 hours') as subscriptions_expired_24h,
  
  -- Last health check
  (SELECT status FROM subscription_health_checks WHERE check_type = 'expired_subscriptions' ORDER BY checked_at DESC LIMIT 1) as last_health_check_status,
  (SELECT checked_at FROM subscription_health_checks WHERE check_type = 'expired_subscriptions' ORDER BY checked_at DESC LIMIT 1) as last_health_check_time;

-- =========================
-- Comments for documentation
-- =========================
COMMENT ON TABLE subscription_metrics IS 'Tracks subscription-related events and metrics for monitoring and analytics';
COMMENT ON TABLE subscription_health_checks IS 'Records results of automated health checks for subscription system integrity';
COMMENT ON FUNCTION record_subscription_metric IS 'Records a subscription-related metric event';
COMMENT ON FUNCTION check_subscription_health IS 'Performs comprehensive health check of subscription system';
COMMENT ON FUNCTION auto_resolve_expired_subscriptions IS 'Automatically resolves users with expired subscriptions but premium entitlements';
COMMENT ON VIEW subscription_dashboard IS 'Real-time dashboard view of subscription system health and metrics';
