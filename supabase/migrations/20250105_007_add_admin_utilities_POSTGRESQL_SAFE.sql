-- Admin Utilities for Subscription System (PostgreSQL-Safe Version)
-- Migration: 20250105_007_add_admin_utilities_POSTGRESQL_SAFE.sql
-- Purpose: Create admin views and utilities for subscription management
-- Development Phase: Essential admin tools for subscription oversight
-- CORRECTIONS: Fixed PostgreSQL column alias scoping issues, handles missing table dependencies

-- =========================
-- Helper function to check table existence
-- =========================
CREATE OR REPLACE FUNCTION table_exists(table_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = $1 AND table_schema = 'public'
  );
END;
$$ LANGUAGE plpgsql;

-- =========================
-- Admin Views for Subscription Management (PostgreSQL-Safe)
-- =========================

-- View for subscription system overview (handles missing tables gracefully)
CREATE OR REPLACE VIEW admin_subscription_overview AS
SELECT 
  -- Current subscription statistics (only if user_subscriptions exists)
  CASE WHEN table_exists('user_subscriptions') THEN
    (SELECT COUNT(CASE WHEN us.is_active = TRUE AND us.end_date > NOW() THEN 1 END) FROM user_subscriptions us)
  ELSE 0 END as active_subscriptions,
  
  CASE WHEN table_exists('user_subscriptions') THEN
    (SELECT COUNT(CASE WHEN us.is_active = TRUE AND us.end_date <= NOW() THEN 1 END) FROM user_subscriptions us)
  ELSE 0 END as expired_active_subscriptions,
  
  CASE WHEN table_exists('user_subscriptions') THEN
    (SELECT COUNT(CASE WHEN us.is_active = FALSE THEN 1 END) FROM user_subscriptions us)
  ELSE 0 END as inactive_subscriptions,
  
  -- Tier breakdown
  CASE WHEN table_exists('user_subscriptions') THEN
    (SELECT COUNT(CASE WHEN us.tier = 'privileged' AND us.is_active = TRUE AND us.end_date > NOW() THEN 1 END) FROM user_subscriptions us)
  ELSE 0 END as active_privileged,
  
  CASE WHEN table_exists('user_subscriptions') THEN
    (SELECT COUNT(CASE WHEN us.tier = 'privileged_plus' AND us.is_active = TRUE AND us.end_date > NOW() THEN 1 END) FROM user_subscriptions us)
  ELSE 0 END as active_privileged_plus,
  
  -- User tier mismatches (critical issues) - only if both tables exist
  CASE WHEN table_exists('user_subscriptions') AND table_exists('users') THEN
    (SELECT COUNT(*) FROM users u WHERE u.membership_tier IN ('PRIVILEGED', 'PRIVILEGED_PLUS') 
     AND NOT EXISTS (SELECT 1 FROM user_subscriptions us2 WHERE us2.user_id = u.id AND us2.is_active = TRUE AND us2.end_date > NOW()))
  ELSE 0 END as users_with_invalid_entitlements,
  
  -- Revenue indicators
  CASE WHEN table_exists('user_subscriptions') THEN
    (SELECT COUNT(CASE WHEN us.subscription_type = 'monthly' AND us.is_active = TRUE AND us.end_date > NOW() THEN 1 END) FROM user_subscriptions us)
  ELSE 0 END as active_monthly_subs,
  
  CASE WHEN table_exists('user_subscriptions') THEN
    (SELECT COUNT(CASE WHEN us.subscription_type = 'annual' AND us.is_active = TRUE AND us.end_date > NOW() THEN 1 END) FROM user_subscriptions us)
  ELSE 0 END as active_annual_subs,
  
  -- Expiry warnings (subscriptions expiring in next 7 days)
  CASE WHEN table_exists('user_subscriptions') THEN
    (SELECT COUNT(CASE WHEN us.is_active = TRUE AND us.end_date > NOW() AND us.end_date <= NOW() + INTERVAL '7 days' THEN 1 END) FROM user_subscriptions us)
  ELSE 0 END as expiring_soon,
  
  -- System health (only if subscription_health_checks table exists)
  CASE WHEN table_exists('subscription_health_checks') THEN
    (SELECT status FROM subscription_health_checks WHERE check_type = 'expired_subscriptions' ORDER BY checked_at DESC LIMIT 1)
  ELSE 'unknown' END as last_health_status,
  
  CASE WHEN table_exists('subscription_health_checks') THEN
    (SELECT checked_at FROM subscription_health_checks WHERE check_type = 'expired_subscriptions' ORDER BY checked_at DESC LIMIT 1)
  ELSE NULL END as last_health_check,
  
  -- Last update timestamp
  NOW() as report_generated_at;

-- View for problematic users (simplified to avoid column alias issues)
CREATE OR REPLACE VIEW admin_problematic_users AS
WITH user_problems AS (
  SELECT 
    u.id,
    u.email,
    u.username,
    u.membership_tier,
    u.created_at as user_created_at,
    
    -- Subscription details (only if user_subscriptions exists)
    CASE WHEN table_exists('user_subscriptions') THEN us.id ELSE NULL END as subscription_id,
    CASE WHEN table_exists('user_subscriptions') THEN us.tier ELSE NULL END as subscription_tier,
    CASE WHEN table_exists('user_subscriptions') THEN us.subscription_type ELSE NULL END as subscription_type,
    CASE WHEN table_exists('user_subscriptions') THEN us.start_date ELSE NULL END as start_date,
    CASE WHEN table_exists('user_subscriptions') THEN us.end_date ELSE NULL END as end_date,
    CASE WHEN table_exists('user_subscriptions') THEN us.is_active ELSE NULL END as subscription_active,
    
    -- Problem classification (only if user_subscriptions exists)
    CASE 
      WHEN NOT table_exists('user_subscriptions') THEN 'subscription_table_missing'
      WHEN u.membership_tier IN ('PRIVILEGED', 'PRIVILEGED_PLUS') AND (us.id IS NULL OR us.end_date <= NOW() OR us.is_active = FALSE) THEN 'premium_tier_no_active_subscription'
      WHEN u.membership_tier = 'MEMBER' AND us.id IS NOT NULL AND us.is_active = TRUE AND us.end_date > NOW() THEN 'member_tier_with_active_subscription'
      WHEN u.membership_tier != CASE us.tier WHEN 'privileged' THEN 'PRIVILEGED' WHEN 'privileged_plus' THEN 'PRIVILEGED_PLUS' ELSE 'MEMBER' END THEN 'tier_mismatch'
      ELSE 'no_issues_detected'
    END as problem_type,
    
    -- Days since issue
    CASE 
      WHEN table_exists('user_subscriptions') AND us.end_date IS NOT NULL AND us.end_date <= NOW() THEN EXTRACT(DAYS FROM NOW() - us.end_date)
      ELSE NULL
    END as days_since_expiry,
    
    -- Priority for ordering (avoids column alias issues)
    CASE 
      WHEN NOT table_exists('user_subscriptions') THEN 0
      WHEN u.membership_tier IN ('PRIVILEGED', 'PRIVILEGED_PLUS') AND (us.id IS NULL OR us.end_date <= NOW() OR us.is_active = FALSE) THEN 1
      WHEN u.membership_tier != CASE us.tier WHEN 'privileged' THEN 'PRIVILEGED' WHEN 'privileged_plus' THEN 'PRIVILEGED_PLUS' ELSE 'MEMBER' END THEN 2
      WHEN u.membership_tier = 'MEMBER' AND us.id IS NOT NULL AND us.is_active = TRUE AND us.end_date > NOW() THEN 3
      ELSE 4
    END as priority_order
    
  FROM users u
  LEFT JOIN user_subscriptions us ON u.id = us.user_id AND table_exists('user_subscriptions')
  WHERE 
    -- Only show users with actual problems
    (
      NOT table_exists('user_subscriptions') OR
      (u.membership_tier IN ('PRIVILEGED', 'PRIVILEGED_PLUS') AND (us.id IS NULL OR us.end_date <= NOW() OR us.is_active = FALSE)) OR
      (u.membership_tier = 'MEMBER' AND us.id IS NOT NULL AND us.is_active = TRUE AND us.end_date > NOW()) OR
      (table_exists('user_subscriptions') AND u.membership_tier != CASE us.tier WHEN 'privileged' THEN 'PRIVILEGED' WHEN 'privileged_plus' THEN 'PRIVILEGED_PLUS' ELSE 'MEMBER' END)
    )
)
SELECT 
  id,
  email,
  username,
  membership_tier,
  user_created_at,
  subscription_id,
  subscription_tier,
  subscription_type,
  start_date,
  end_date,
  subscription_active,
  problem_type,
  days_since_expiry
FROM user_problems
ORDER BY priority_order, days_since_expiry DESC NULLS LAST;

-- View for subscription expiry tracking (dependency-safe)
CREATE OR REPLACE VIEW admin_subscription_expiry_tracking AS
WITH expiry_data AS (
  SELECT 
    CASE WHEN table_exists('user_subscriptions') THEN us.id ELSE NULL END as subscription_id,
    CASE WHEN table_exists('user_subscriptions') THEN us.user_id ELSE NULL END as user_id,
    CASE WHEN table_exists('user_subscriptions') THEN us.tier ELSE 'unknown' END as tier,
    CASE WHEN table_exists('user_subscriptions') THEN us.subscription_type ELSE 'unknown' END as subscription_type,
    CASE WHEN table_exists('user_subscriptions') THEN us.end_date ELSE NULL END as end_date,
    CASE WHEN table_exists('user_subscriptions') THEN us.is_active ELSE FALSE END as is_active,
    
    -- Days until expiry
    CASE 
      WHEN table_exists('user_subscriptions') AND us.end_date IS NOT NULL THEN EXTRACT(DAYS FROM us.end_date - NOW())
      ELSE NULL
    END as days_until_expiry,
    
    -- Expiry status
    CASE 
      WHEN NOT table_exists('user_subscriptions') THEN 'table_missing'
      WHEN us.end_date <= NOW() THEN 'expired'
      WHEN us.end_date <= NOW() + INTERVAL '7 days' THEN 'expiring_soon'
      WHEN us.end_date <= NOW() + INTERVAL '30 days' THEN 'expiring_this_month'
      ELSE 'active'
    END as expiry_status,
    
    -- Sort order
    CASE WHEN table_exists('user_subscriptions') THEN us.end_date ELSE NOW() END as sort_date
    
  FROM users u
  LEFT JOIN user_subscriptions us ON u.id = us.user_id AND table_exists('user_subscriptions')
  WHERE 
    table_exists('user_subscriptions') = FALSE OR
    (us.is_active = TRUE AND us.end_date IS NOT NULL)
)
SELECT 
  subscription_id,
  user_id,
  tier,
  subscription_type,
  end_date,
  is_active,
  days_until_expiry,
  expiry_status
FROM expiry_data
ORDER BY sort_date ASC;

-- =========================
-- Admin Utility Functions (PostgreSQL-Safe)
-- =========================

-- Function to get detailed user subscription status (handles missing tables)
CREATE OR REPLACE FUNCTION admin_get_user_subscription_status(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  user_info RECORD;
  subscription_info RECORD;
  payment_info RECORD;
  result JSONB;
  has_user_subscriptions BOOLEAN;
  has_payment_records BOOLEAN;
BEGIN
  -- Check table existence
  has_user_subscriptions := table_exists('user_subscriptions');
  has_payment_records := table_exists('payment_records');

  -- Get user information
  SELECT
    id, email, username, membership_tier, created_at
  INTO user_info
  FROM users
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'User not found');
  END IF;

  -- Get active subscription information (only if table exists)
  IF has_user_subscriptions THEN
    SELECT
      id, tier, subscription_type, start_date, end_date,
      is_active, auto_renew, created_at
    INTO subscription_info
    FROM user_subscriptions
    WHERE user_id = p_user_id
    AND is_active = TRUE
    ORDER BY end_date DESC
    LIMIT 1;
  END IF;

  -- Get payment information (only if table exists)
  IF has_payment_records THEN
    SELECT
      COUNT(*) as total_payments,
      SUM(amount) as total_amount,
      MAX(payment_date) as last_payment_date,
      MIN(payment_date) as first_payment_date
    INTO payment_info
    FROM payment_records
    WHERE user_id = p_user_id;
  END IF;

  -- Build comprehensive result
  result := json_build_object(
    'user', json_build_object(
      'id', user_info.id,
      'email', user_info.email,
      'username', user_info.username,
      'membership_tier', user_info.membership_tier,
      'created_at', user_info.created_at
    ),
    'subscription', CASE
      WHEN NOT has_user_subscriptions THEN json_build_object('error', 'user_subscriptions table missing')
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
      ELSE json_build_object('status', 'no_active_subscription')
    END,
    'payments', CASE
      WHEN NOT has_payment_records THEN json_build_object('error', 'payment_records table missing')
      ELSE json_build_object(
        'total_payments', COALESCE(payment_info.total_payments, 0),
        'total_amount', COALESCE(payment_info.total_amount, 0),
        'last_payment_date', payment_info.last_payment_date,
        'first_payment_date', payment_info.first_payment_date
      )
    END,
    'system_status', json_build_object(
      'has_user_subscriptions_table', has_user_subscriptions,
      'has_payment_records_table', has_payment_records,
      'has_validation_functions', EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'has_active_subscription')
    ),
    'generated_at', NOW()
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get system health summary (handles missing dependencies)
CREATE OR REPLACE FUNCTION admin_get_system_health_summary()
RETURNS JSONB AS $$
DECLARE
  health_summary JSONB;
  has_problematic_users_view BOOLEAN;
  has_subscription_overview_view BOOLEAN;
  has_scheduled_tasks BOOLEAN;
  critical_count INTEGER;
  mismatch_count INTEGER;
  total_count INTEGER;
BEGIN
  -- Check if views and tables exist
  has_problematic_users_view := EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'admin_problematic_users');
  has_subscription_overview_view := EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'admin_subscription_overview');
  has_scheduled_tasks := table_exists('scheduled_tasks');

  -- Get problem counts safely
  IF has_problematic_users_view THEN
    SELECT
      COUNT(CASE WHEN problem_type = 'premium_tier_no_active_subscription' THEN 1 END),
      COUNT(CASE WHEN problem_type = 'tier_mismatch' THEN 1 END),
      COUNT(*)
    INTO critical_count, mismatch_count, total_count
    FROM admin_problematic_users;
  ELSE
    critical_count := -1;
    mismatch_count := -1;
    total_count := -1;
  END IF;

  -- Build health summary with dependency checks
  health_summary := json_build_object(
    'system_status', json_build_object(
      'has_problematic_users_view', has_problematic_users_view,
      'has_subscription_overview_view', has_subscription_overview_view,
      'has_scheduled_tasks_table', has_scheduled_tasks,
      'has_user_subscriptions_table', table_exists('user_subscriptions'),
      'has_subscription_health_checks_table', table_exists('subscription_health_checks')
    ),
    'critical_issues', critical_count,
    'tier_mismatches', mismatch_count,
    'total_issues', total_count,
    'subscription_stats', CASE
      WHEN has_subscription_overview_view THEN
        (SELECT row_to_json(admin_subscription_overview.*) FROM admin_subscription_overview LIMIT 1)
      ELSE json_build_object('error', 'admin_subscription_overview view missing')
    END,
    'automated_tasks', CASE
      WHEN has_scheduled_tasks THEN
        (SELECT json_agg(
          json_build_object(
            'task_name', task_name,
            'status', last_run_status,
            'last_run', last_run_at,
            'error', last_error_message,
            'is_enabled', is_enabled
          )
        ) FROM scheduled_tasks WHERE is_enabled = TRUE)
      ELSE json_build_array(json_build_object('error', 'scheduled_tasks table missing'))
    END,
    'report_generated_at', NOW()
  );

  RETURN health_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================
-- Comments for documentation
-- =========================
COMMENT ON FUNCTION table_exists(TEXT) IS 'Helper function to safely check if a table exists before referencing it';
COMMENT ON VIEW admin_subscription_overview IS 'PostgreSQL-safe comprehensive overview of subscription system status for administrators';
COMMENT ON VIEW admin_problematic_users IS 'PostgreSQL-safe view of users with subscription/entitlement mismatches requiring admin attention';
COMMENT ON VIEW admin_subscription_expiry_tracking IS 'PostgreSQL-safe detailed tracking of subscription expiry dates and status';
COMMENT ON FUNCTION admin_get_user_subscription_status(UUID) IS 'Get comprehensive subscription status for a specific user with dependency checking';
COMMENT ON FUNCTION admin_get_system_health_summary() IS 'Get comprehensive system health summary for admin dashboard with dependency validation';
