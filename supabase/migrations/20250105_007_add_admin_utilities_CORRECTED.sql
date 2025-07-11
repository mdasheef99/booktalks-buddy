-- Admin Utilities for Subscription Management (CORRECTED)
-- Migration: 20250105_007_add_admin_utilities_CORRECTED.sql
-- Purpose: Create admin utilities and views for subscription system management
-- Development Phase: Essential admin tools for subscription oversight
-- CORRECTIONS: Removed account_tier and updated_at column references

-- =========================
-- Admin Views for Subscription Management
-- =========================

-- View for subscription system overview
CREATE OR REPLACE VIEW admin_subscription_overview AS
SELECT 
  -- Current subscription statistics
  COUNT(CASE WHEN us.is_active = TRUE AND us.end_date > NOW() THEN 1 END) as active_subscriptions,
  COUNT(CASE WHEN us.is_active = TRUE AND us.end_date <= NOW() THEN 1 END) as expired_active_subscriptions,
  COUNT(CASE WHEN us.is_active = FALSE THEN 1 END) as inactive_subscriptions,
  
  -- Tier breakdown
  COUNT(CASE WHEN us.tier = 'privileged' AND us.is_active = TRUE AND us.end_date > NOW() THEN 1 END) as active_privileged,
  COUNT(CASE WHEN us.tier = 'privileged_plus' AND us.is_active = TRUE AND us.end_date > NOW() THEN 1 END) as active_privileged_plus,
  
  -- User tier mismatches (critical issues)
  (SELECT COUNT(*) FROM users u WHERE u.membership_tier IN ('PRIVILEGED', 'PRIVILEGED_PLUS') 
   AND NOT EXISTS (SELECT 1 FROM user_subscriptions us2 WHERE us2.user_id = u.id AND us2.is_active = TRUE AND us2.end_date > NOW())) as users_with_invalid_entitlements,
  
  -- Revenue indicators
  COUNT(CASE WHEN us.subscription_type = 'monthly' AND us.is_active = TRUE AND us.end_date > NOW() THEN 1 END) as active_monthly_subs,
  COUNT(CASE WHEN us.subscription_type = 'annual' AND us.is_active = TRUE AND us.end_date > NOW() THEN 1 END) as active_annual_subs,
  
  -- Expiry warnings (subscriptions expiring in next 7 days)
  COUNT(CASE WHEN us.is_active = TRUE AND us.end_date > NOW() AND us.end_date <= NOW() + INTERVAL '7 days' THEN 1 END) as expiring_soon,
  
  -- System health (only if subscription_health_checks table exists)
  COALESCE((
    SELECT status
    FROM subscription_health_checks
    WHERE check_type = 'expired_subscriptions'
    AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_health_checks')
    ORDER BY checked_at DESC
    LIMIT 1
  ), 'unknown') as last_health_status,

  COALESCE((
    SELECT checked_at
    FROM subscription_health_checks
    WHERE check_type = 'expired_subscriptions'
    AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_health_checks')
    ORDER BY checked_at DESC
    LIMIT 1
  ), NULL) as last_health_check,
  
  -- Last update timestamp
  NOW() as report_generated_at
FROM user_subscriptions us;

-- View for problematic users (those with entitlement mismatches)
CREATE OR REPLACE VIEW admin_problematic_users AS
SELECT 
  u.id,
  u.email,
  u.username,
  u.membership_tier,
  -- REMOVED: u.account_tier (column doesn't exist in user's schema)
  u.created_at as user_created_at,
  -- REMOVED: u.updated_at (column doesn't exist in user's schema)
  
  -- Subscription details
  us.id as subscription_id,
  us.tier as subscription_tier,
  us.subscription_type,
  us.start_date,
  us.end_date,
  us.is_active as subscription_active,
  
  -- Problem classification
  CASE 
    WHEN u.membership_tier IN ('PRIVILEGED', 'PRIVILEGED_PLUS') AND (us.id IS NULL OR us.end_date <= NOW() OR us.is_active = FALSE) THEN 'premium_tier_no_active_subscription'
    WHEN u.membership_tier = 'MEMBER' AND us.id IS NOT NULL AND us.is_active = TRUE AND us.end_date > NOW() THEN 'member_tier_with_active_subscription'
    WHEN u.membership_tier != CASE us.tier WHEN 'privileged' THEN 'PRIVILEGED' WHEN 'privileged_plus' THEN 'PRIVILEGED_PLUS' ELSE 'MEMBER' END THEN 'tier_mismatch'
    ELSE 'unknown_issue'
  END as problem_type,
  
  -- Days since issue
  CASE 
    WHEN us.end_date IS NOT NULL AND us.end_date <= NOW() THEN EXTRACT(DAYS FROM NOW() - us.end_date)
    ELSE NULL
  END as days_since_expiry
  
FROM users u
LEFT JOIN user_subscriptions us ON u.id = us.user_id 
  AND us.is_active = TRUE 
  AND us.end_date = (
    SELECT MAX(end_date) FROM user_subscriptions us2 
    WHERE us2.user_id = u.id AND us2.is_active = TRUE
  )
WHERE 
  -- Users with premium tiers but no active subscription
  (u.membership_tier IN ('PRIVILEGED', 'PRIVILEGED_PLUS') AND (us.id IS NULL OR us.end_date <= NOW() OR us.is_active = FALSE))
  OR
  -- Users with member tier but active subscription
  (u.membership_tier = 'MEMBER' AND us.id IS NOT NULL AND us.is_active = TRUE AND us.end_date > NOW())
  OR
  -- Users with tier mismatches
  (u.membership_tier != CASE us.tier WHEN 'privileged' THEN 'PRIVILEGED' WHEN 'privileged_plus' THEN 'PRIVILEGED_PLUS' ELSE 'MEMBER' END)
ORDER BY 
  CASE problem_type
    WHEN 'premium_tier_no_active_subscription' THEN 1
    WHEN 'tier_mismatch' THEN 2
    WHEN 'member_tier_with_active_subscription' THEN 3
    ELSE 4
  END,
  days_since_expiry DESC NULLS LAST;

-- View for subscription expiry tracking
CREATE OR REPLACE VIEW admin_subscription_expiry_tracking AS
SELECT 
  us.id as subscription_id,
  us.user_id,
  u.email,
  u.username,
  u.membership_tier,
  us.tier as subscription_tier,
  us.subscription_type,
  us.start_date,
  us.end_date,
  us.is_active,
  
  -- Time calculations
  CASE 
    WHEN us.end_date > NOW() THEN EXTRACT(DAYS FROM us.end_date - NOW())
    ELSE -EXTRACT(DAYS FROM NOW() - us.end_date)
  END as days_until_expiry,
  
  -- Status classification
  CASE 
    WHEN us.end_date <= NOW() AND us.is_active = TRUE THEN 'expired_but_active'
    WHEN us.end_date <= NOW() AND us.is_active = FALSE THEN 'expired_and_inactive'
    WHEN us.end_date <= NOW() + INTERVAL '7 days' THEN 'expiring_soon'
    WHEN us.end_date <= NOW() + INTERVAL '30 days' THEN 'expiring_this_month'
    ELSE 'active'
  END as expiry_status,
  
  -- Payment information
  (SELECT COUNT(*) FROM payment_records pr WHERE pr.subscription_id = us.id) as payment_count,
  (SELECT MAX(payment_date) FROM payment_records pr WHERE pr.subscription_id = us.id) as last_payment_date
  
FROM user_subscriptions us
JOIN users u ON us.user_id = u.id
WHERE us.is_active = TRUE
ORDER BY 
  CASE 
    WHEN us.end_date <= NOW() THEN 1
    WHEN us.end_date <= NOW() + INTERVAL '7 days' THEN 2
    WHEN us.end_date <= NOW() + INTERVAL '30 days' THEN 3
    ELSE 4
  END,
  us.end_date ASC;

-- =========================
-- Admin Utility Functions
-- =========================

-- Function to get detailed user subscription status
CREATE OR REPLACE FUNCTION admin_get_user_subscription_status(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  user_info RECORD;
  subscription_info RECORD;
  payment_info RECORD;
  result JSONB;
BEGIN
  -- Get user information
  SELECT
    id, email, username, membership_tier,
    -- REMOVED: account_tier (column doesn't exist in user's schema)
    created_at
    -- REMOVED: updated_at (column doesn't exist in user's schema)
  INTO user_info
  FROM users
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'User not found');
  END IF;

  -- Get active subscription information
  SELECT
    id, tier, subscription_type, start_date, end_date,
    is_active, auto_renew, created_at
  INTO subscription_info
  FROM user_subscriptions
  WHERE user_id = p_user_id
  AND is_active = TRUE
  ORDER BY end_date DESC
  LIMIT 1;

  -- Get payment information
  SELECT
    COUNT(*) as total_payments,
    SUM(amount) as total_amount,
    MAX(payment_date) as last_payment_date,
    MIN(payment_date) as first_payment_date
  INTO payment_info
  FROM payment_records
  WHERE user_id = p_user_id;

  -- Build comprehensive result
  result := json_build_object(
    'user', json_build_object(
      'id', user_info.id,
      'email', user_info.email,
      'username', user_info.username,
      'membership_tier', user_info.membership_tier,
      -- REMOVED: 'account_tier', user_info.account_tier (column doesn't exist)
      'created_at', user_info.created_at
      -- REMOVED: 'updated_at', user_info.updated_at (column doesn't exist)
    ),
    'subscription', CASE
      WHEN subscription_info.id IS NOT NULL THEN json_build_object(
        'id', subscription_info.id,
        'tier', subscription_info.tier,
        'subscription_type', subscription_info.subscription_type,
        'start_date', subscription_info.start_date,
        'end_date', subscription_info.end_date,
        'is_active', subscription_info.is_active,
        'auto_renew', subscription_info.auto_renew,
        'created_at', subscription_info.created_at,
        'days_until_expiry', EXTRACT(DAYS FROM subscription_info.end_date - NOW()),
        'is_expired', subscription_info.end_date <= NOW()
      )
      ELSE NULL
    END,
    'payments', json_build_object(
      'total_payments', COALESCE(payment_info.total_payments, 0),
      'total_amount', COALESCE(payment_info.total_amount, 0),
      'last_payment_date', payment_info.last_payment_date,
      'first_payment_date', payment_info.first_payment_date
    ),
    'validation', json_build_object(
      'has_active_subscription', has_active_subscription(p_user_id),
      'correct_tier', get_user_subscription_tier(p_user_id),
      'needs_correction', user_info.membership_tier != get_user_subscription_tier(p_user_id)
    ),
    'generated_at', NOW()
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to fix specific user's entitlements (admin tool)
CREATE OR REPLACE FUNCTION admin_fix_user_entitlements(
  p_user_id UUID,
  p_reason TEXT DEFAULT 'Admin correction'
) RETURNS JSONB AS $$
DECLARE
  validation_result JSONB;
  backup_id TEXT;
BEGIN
  -- Create backup before making changes
  backup_id := create_subscription_backup('Admin fix for user ' || p_user_id || ' - ' || p_reason);

  -- Validate and fix entitlements
  validation_result := validate_user_entitlements(p_user_id);

  -- Add admin context to result
  validation_result := validation_result || json_build_object(
    'admin_action', TRUE,
    'reason', p_reason,
    'backup_id', backup_id,
    'fixed_by', auth.uid(),
    'fixed_at', NOW()
  );

  -- Record admin action metric
  PERFORM record_subscription_metric(
    'admin_entitlement_fix',
    p_user_id,
    NULL,
    NULL,
    1,
    json_build_object(
      'reason', p_reason,
      'backup_id', backup_id,
      'was_updated', validation_result->>'was_updated',
      'admin_user', auth.uid()
    ),
    'admin'
  );

  RETURN validation_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get system health summary for admin dashboard
CREATE OR REPLACE FUNCTION admin_get_system_health_summary()
RETURNS JSONB AS $$
DECLARE
  health_summary JSONB;
  recent_metrics JSONB;
  task_status JSONB;
BEGIN
  -- Get current health status
  WITH health_stats AS (
    SELECT
      COUNT(CASE WHEN problem_type = 'premium_tier_no_active_subscription' THEN 1 END) as critical_issues,
      COUNT(CASE WHEN problem_type = 'tier_mismatch' THEN 1 END) as tier_mismatches,
      COUNT(*) as total_issues
    FROM admin_problematic_users
  ),
  subscription_stats AS (
    SELECT * FROM admin_subscription_overview
  ),
  recent_task_runs AS (
    SELECT
      COALESCE(task_name, 'no_tasks') as task_name,
      COALESCE(last_run_status, 'unknown') as last_run_status,
      last_run_at,
      last_error_message
    FROM scheduled_tasks
    WHERE is_enabled = TRUE
    AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'scheduled_tasks')
    UNION ALL
    SELECT 'no_tasks' as task_name, 'table_missing' as last_run_status, NULL as last_run_at, 'scheduled_tasks table does not exist' as last_error_message
    WHERE NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'scheduled_tasks')
  )
  SELECT json_build_object(
    'critical_issues', h.critical_issues,
    'tier_mismatches', h.tier_mismatches,
    'total_issues', h.total_issues,
    'active_subscriptions', s.active_subscriptions,
    'expired_active_subscriptions', s.expired_active_subscriptions,
    'users_with_invalid_entitlements', s.users_with_invalid_entitlements,
    'expiring_soon', s.expiring_soon,
    'last_health_status', s.last_health_status,
    'last_health_check', s.last_health_check,
    'automated_tasks', json_agg(
      json_build_object(
        'task_name', t.task_name,
        'status', t.last_run_status,
        'last_run', t.last_run_at,
        'error', t.last_error_message
      )
    ),
    'report_generated_at', NOW()
  ) INTO health_summary
  FROM health_stats h, subscription_stats s, recent_task_runs t
  GROUP BY h.critical_issues, h.tier_mismatches, h.total_issues,
           s.active_subscriptions, s.expired_active_subscriptions,
           s.users_with_invalid_entitlements, s.expiring_soon,
           s.last_health_status, s.last_health_check;

  RETURN health_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================
-- RLS Policies for Admin Views
-- =========================

-- Only store administrators can access admin views
CREATE POLICY "Store admins can access admin views" ON admin_subscription_overview
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM store_administrators
    WHERE user_id = auth.uid()
  )
);

-- =========================
-- Comments for documentation
-- =========================
COMMENT ON VIEW admin_subscription_overview IS 'Comprehensive overview of subscription system status for administrators';
COMMENT ON VIEW admin_problematic_users IS 'Users with subscription/entitlement mismatches requiring admin attention';
COMMENT ON VIEW admin_subscription_expiry_tracking IS 'Detailed tracking of subscription expiry dates and status';
COMMENT ON FUNCTION admin_get_user_subscription_status(UUID) IS 'Get comprehensive subscription status for a specific user';
COMMENT ON FUNCTION admin_fix_user_entitlements(UUID, TEXT) IS 'Admin tool to fix entitlements for a specific user with backup';
COMMENT ON FUNCTION admin_get_system_health_summary() IS 'Get comprehensive system health summary for admin dashboard';
