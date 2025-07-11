-- Security Enhancements for Subscription System (PostgreSQL-Safe Version)
-- Migration: 20250105_008_add_security_enhancements_POSTGRESQL_SAFE.sql
-- Purpose: Add security measures, audit logging, and access controls
-- Development Phase: Essential security hardening for subscription system
-- CORRECTIONS: Applied PostgreSQL-safe patterns, conditional table references, graceful degradation

-- =========================
-- Create audit log table (with conditional foreign keys)
-- =========================
CREATE TABLE IF NOT EXISTS subscription_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event details
  event_type TEXT NOT NULL CHECK (event_type IN (
    'subscription_created',
    'subscription_updated',
    'subscription_cancelled',
    'subscription_expired',
    'entitlement_granted',
    'entitlement_revoked',
    'payment_processed',
    'admin_action',
    'security_event',
    'data_access',
    'system_backup',
    'emergency_fix'
  )),
  
  -- Target information (nullable to avoid FK failures)
  target_user_id UUID, -- Will add FK constraint conditionally
  target_subscription_id UUID, -- Will add FK constraint conditionally
  target_store_id UUID, -- Will add FK constraint conditionally
  
  -- Actor information
  actor_user_id UUID, -- Will add FK constraint conditionally
  actor_type TEXT NOT NULL CHECK (actor_type IN ('user', 'admin', 'system', 'api')),
  actor_ip_address INET,
  actor_user_agent TEXT,
  
  -- Event context
  event_description TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  additional_context JSONB DEFAULT '{}',
  
  -- Security classification
  security_level TEXT NOT NULL DEFAULT 'normal' CHECK (security_level IN ('low', 'normal', 'high', 'critical')),
  requires_review BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  event_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- Create security alerts table
-- =========================
CREATE TABLE IF NOT EXISTS subscription_security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Alert details
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'suspicious_activity',
    'unauthorized_access',
    'data_breach_attempt',
    'privilege_escalation',
    'bulk_operations',
    'system_anomaly',
    'failed_authentication',
    'rate_limit_exceeded'
  )),
  
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')),
  
  -- Alert content
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  affected_user_id UUID, -- Will add FK constraint conditionally
  affected_resource_type TEXT,
  affected_resource_id UUID,
  
  -- Detection details
  detection_method TEXT NOT NULL,
  detection_timestamp TIMESTAMPTZ DEFAULT NOW(),
  source_ip INET,
  user_agent TEXT,
  
  -- Response tracking
  assigned_to UUID, -- Will add FK constraint conditionally
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  
  -- Context
  alert_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- Conditional Foreign Key Constraints (PostgreSQL-Safe)
-- =========================

-- Add foreign key constraints only if referenced tables exist
DO $$
BEGIN
  -- Add FK constraints for subscription_audit_log if tables exist
  IF table_exists('user_subscriptions') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_audit_log_subscription' 
                   AND table_name = 'subscription_audit_log') THEN
      ALTER TABLE subscription_audit_log 
      ADD CONSTRAINT fk_audit_log_subscription 
      FOREIGN KEY (target_subscription_id) REFERENCES user_subscriptions(id);
    END IF;
  END IF;
  
  IF table_exists('stores') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_audit_log_store' 
                   AND table_name = 'subscription_audit_log') THEN
      ALTER TABLE subscription_audit_log 
      ADD CONSTRAINT fk_audit_log_store 
      FOREIGN KEY (target_store_id) REFERENCES stores(id);
    END IF;
  END IF;
  
  -- Note: auth.users references are handled differently in Supabase
  -- We'll validate these in application logic rather than FK constraints
  
EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't fail the migration
  RAISE NOTICE 'Foreign key constraint creation failed: %', SQLERRM;
END $$;

-- =========================
-- Indexes for performance and security
-- =========================
CREATE INDEX IF NOT EXISTS idx_subscription_audit_log_event_timestamp ON subscription_audit_log(event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_subscription_audit_log_target_user ON subscription_audit_log(target_user_id, event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_subscription_audit_log_actor_user ON subscription_audit_log(actor_user_id, event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_subscription_audit_log_event_type ON subscription_audit_log(event_type, event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_subscription_audit_log_security_level ON subscription_audit_log(security_level, requires_review);

CREATE INDEX IF NOT EXISTS idx_security_alerts_status_severity ON subscription_security_alerts(status, severity);
CREATE INDEX IF NOT EXISTS idx_security_alerts_detection_timestamp ON subscription_security_alerts(detection_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_security_alerts_affected_user ON subscription_security_alerts(affected_user_id, detection_timestamp DESC);

-- =========================
-- RLS Policies (PostgreSQL-Safe)
-- =========================
ALTER TABLE subscription_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_security_alerts ENABLE ROW LEVEL SECURITY;

-- Conditional RLS policies that handle missing store_administrators table
DO $$
BEGIN
  -- Only create RLS policies if store_administrators table exists
  IF table_exists('store_administrators') THEN
    -- Only store administrators can access audit logs
    DROP POLICY IF EXISTS "Store admins can access audit logs" ON subscription_audit_log;
    CREATE POLICY "Store admins can access audit logs" ON subscription_audit_log
    FOR SELECT TO authenticated USING (
      EXISTS (
        SELECT 1 FROM store_administrators
        WHERE user_id = auth.uid()
      )
    );
    
    -- Only store administrators can access security alerts
    DROP POLICY IF EXISTS "Store admins can manage security alerts" ON subscription_security_alerts;
    CREATE POLICY "Store admins can manage security alerts" ON subscription_security_alerts
    FOR ALL TO authenticated USING (
      EXISTS (
        SELECT 1 FROM store_administrators
        WHERE user_id = auth.uid()
      )
    );
    
    RAISE NOTICE 'RLS policies created successfully - store_administrators table exists';
  ELSE
    -- Create fallback policies that deny access until store_administrators table is created
    DROP POLICY IF EXISTS "Deny access until store_administrators exists" ON subscription_audit_log;
    CREATE POLICY "Deny access until store_administrators exists" ON subscription_audit_log
    FOR ALL TO authenticated USING (false);
    
    DROP POLICY IF EXISTS "Deny access until store_administrators exists" ON subscription_security_alerts;
    CREATE POLICY "Deny access until store_administrators exists" ON subscription_security_alerts
    FOR ALL TO authenticated USING (false);
    
    RAISE NOTICE 'Fallback RLS policies created - store_administrators table missing';
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'RLS policy creation encountered an issue: %', SQLERRM;
END $$;

-- =========================
-- Audit logging functions (PostgreSQL-Safe)
-- =========================

-- Function to log subscription events (with table existence checks)
CREATE OR REPLACE FUNCTION log_subscription_event(
  p_event_type TEXT,
  p_target_user_id UUID,
  p_target_subscription_id UUID DEFAULT NULL,
  p_target_store_id UUID DEFAULT NULL,
  p_event_description TEXT,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_additional_context JSONB DEFAULT '{}',
  p_security_level TEXT DEFAULT 'normal'
) RETURNS UUID AS $$
DECLARE
  audit_id UUID;
  current_user_id UUID;
  user_ip INET;
  user_agent TEXT;
  is_admin BOOLEAN := FALSE;
BEGIN
  -- Get current user context
  current_user_id := auth.uid();

  -- Check if user is admin (only if store_administrators table exists)
  IF table_exists('store_administrators') THEN
    SELECT EXISTS (
      SELECT 1 FROM store_administrators
      WHERE user_id = current_user_id
    ) INTO is_admin;
  END IF;

  -- Try to get IP and user agent from context (if available)
  BEGIN
    user_ip := (current_setting('request.headers', true)::json->>'x-forwarded-for')::inet;
  EXCEPTION WHEN OTHERS THEN
    user_ip := NULL;
  END;

  BEGIN
    user_agent := current_setting('request.headers', true)::json->>'user-agent';
  EXCEPTION WHEN OTHERS THEN
    user_agent := NULL;
  END;

  -- Insert audit log entry
  INSERT INTO subscription_audit_log (
    event_type,
    target_user_id,
    target_subscription_id,
    target_store_id,
    actor_user_id,
    actor_type,
    actor_ip_address,
    actor_user_agent,
    event_description,
    old_values,
    new_values,
    additional_context,
    security_level,
    requires_review
  ) VALUES (
    p_event_type,
    p_target_user_id,
    p_target_subscription_id,
    p_target_store_id,
    current_user_id,
    CASE
      WHEN current_user_id IS NULL THEN 'system'
      WHEN is_admin THEN 'admin'
      ELSE 'user'
    END,
    user_ip,
    user_agent,
    p_event_description,
    p_old_values,
    p_new_values,
    p_additional_context,
    p_security_level,
    p_security_level IN ('high', 'critical')
  ) RETURNING id INTO audit_id;

  -- Create security alert for high-risk events (only if function exists)
  IF p_security_level = 'critical' THEN
    BEGIN
      PERFORM create_security_alert(
        'system_anomaly',
        'critical',
        'Critical subscription event detected',
        'Critical event: ' || p_event_type || ' - ' || p_event_description,
        p_target_user_id,
        'subscription',
        p_target_subscription_id,
        'automated_detection',
        json_build_object(
          'audit_log_id', audit_id,
          'event_type', p_event_type,
          'security_level', p_security_level
        )
      );
    EXCEPTION WHEN OTHERS THEN
      -- If create_security_alert function doesn't exist yet, just log the attempt
      RAISE NOTICE 'Could not create security alert - function may not exist yet: %', SQLERRM;
    END;
  END IF;

  RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create security alerts (PostgreSQL-Safe)
CREATE OR REPLACE FUNCTION create_security_alert(
  p_alert_type TEXT,
  p_severity TEXT,
  p_title TEXT,
  p_description TEXT,
  p_affected_user_id UUID DEFAULT NULL,
  p_affected_resource_type TEXT DEFAULT NULL,
  p_affected_resource_id UUID DEFAULT NULL,
  p_detection_method TEXT DEFAULT 'manual',
  p_alert_data JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  alert_id UUID;
  user_ip INET;
  user_agent TEXT;
BEGIN
  -- Try to get IP and user agent from context
  BEGIN
    user_ip := (current_setting('request.headers', true)::json->>'x-forwarded-for')::inet;
  EXCEPTION WHEN OTHERS THEN
    user_ip := NULL;
  END;

  BEGIN
    user_agent := current_setting('request.headers', true)::json->>'user-agent';
  EXCEPTION WHEN OTHERS THEN
    user_agent := NULL;
  END;

  -- Insert security alert
  INSERT INTO subscription_security_alerts (
    alert_type,
    severity,
    title,
    description,
    affected_user_id,
    affected_resource_type,
    affected_resource_id,
    detection_method,
    source_ip,
    user_agent,
    alert_data
  ) VALUES (
    p_alert_type,
    p_severity,
    p_title,
    p_description,
    p_affected_user_id,
    p_affected_resource_type,
    p_affected_resource_id,
    p_detection_method,
    user_ip,
    user_agent,
    p_alert_data
  ) RETURNING id INTO alert_id;

  -- Log the alert creation (recursive call protection)
  BEGIN
    PERFORM log_subscription_event(
      'security_event',
      p_affected_user_id,
      NULL,
      NULL,
      'Security alert created: ' || p_title,
      NULL,
      json_build_object(
        'alert_id', alert_id,
        'alert_type', p_alert_type,
        'severity', p_severity
      ),
      p_alert_data,
      CASE p_severity
        WHEN 'critical' THEN 'high' -- Avoid infinite recursion
        WHEN 'high' THEN 'normal'
        ELSE 'low'
      END
    );
  EXCEPTION WHEN OTHERS THEN
    -- If logging fails, don't fail the alert creation
    RAISE NOTICE 'Alert logging failed but alert created: %', SQLERRM;
  END;

  RETURN alert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================
-- Enhanced security validation functions (PostgreSQL-Safe)
-- =========================

-- Function to validate subscription access permissions (with table existence checks)
CREATE OR REPLACE FUNCTION validate_subscription_access(
  p_user_id UUID,
  p_subscription_id UUID,
  p_operation TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  subscription_owner UUID;
  is_admin BOOLEAN := FALSE;
  access_granted BOOLEAN := FALSE;
BEGIN
  -- Check if user is admin (only if store_administrators table exists)
  IF table_exists('store_administrators') THEN
    SELECT EXISTS (
      SELECT 1 FROM store_administrators
      WHERE user_id = auth.uid()
    ) INTO is_admin;
  END IF;

  -- Get subscription owner (only if user_subscriptions table exists)
  IF table_exists('user_subscriptions') THEN
    SELECT user_id INTO subscription_owner
    FROM user_subscriptions
    WHERE id = p_subscription_id;
  ELSE
    -- If table doesn't exist, deny access
    subscription_owner := NULL;
  END IF;

  -- Determine access
  access_granted := (
    is_admin OR
    (subscription_owner = auth.uid() AND p_operation IN ('read', 'update')) OR
    (subscription_owner = p_user_id AND p_operation = 'read')
  );

  -- Log access attempt
  BEGIN
    PERFORM log_subscription_event(
      'data_access',
      p_user_id,
      p_subscription_id,
      NULL,
      'Subscription access attempt: ' || p_operation,
      NULL,
      json_build_object(
        'operation', p_operation,
        'access_granted', access_granted,
        'requesting_user', auth.uid(),
        'is_admin', is_admin
      ),
      '{}',
      CASE WHEN NOT access_granted THEN 'high' ELSE 'low' END
    );
  EXCEPTION WHEN OTHERS THEN
    -- If logging fails, don't fail the validation
    RAISE NOTICE 'Access validation logging failed: %', SQLERRM;
  END;

  -- Create security alert for unauthorized access attempts
  IF NOT access_granted THEN
    BEGIN
      PERFORM create_security_alert(
        'unauthorized_access',
        'high',
        'Unauthorized subscription access attempt',
        'User attempted to access subscription without permission',
        auth.uid(),
        'subscription',
        p_subscription_id,
        'access_validation',
        json_build_object(
          'operation', p_operation,
          'target_user', p_user_id,
          'subscription_id', p_subscription_id
        )
      );
    EXCEPTION WHEN OTHERS THEN
      -- If alert creation fails, don't fail the validation
      RAISE NOTICE 'Security alert creation failed: %', SQLERRM;
    END;
  END IF;

  RETURN access_granted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to detect suspicious subscription activities (PostgreSQL-Safe)
CREATE OR REPLACE FUNCTION detect_suspicious_subscription_activity()
RETURNS JSONB AS $$
DECLARE
  suspicious_activities JSONB := '[]'::JSONB;
  activity RECORD;
  alert_id UUID;
BEGIN
  -- Only proceed if audit log table exists and has data
  IF NOT table_exists('subscription_audit_log') THEN
    RETURN json_build_object(
      'detection_timestamp', NOW(),
      'error', 'subscription_audit_log table does not exist',
      'suspicious_activities_found', 0,
      'activities', '[]'::JSONB
    );
  END IF;

  -- Check for multiple subscription creations from same IP in short time
  FOR activity IN
    SELECT
      actor_ip_address,
      COUNT(*) as event_count,
      MIN(event_timestamp) as first_event,
      MAX(event_timestamp) as last_event,
      array_agg(DISTINCT target_user_id) as affected_users
    FROM subscription_audit_log
    WHERE event_type = 'subscription_created'
    AND event_timestamp > NOW() - INTERVAL '1 hour'
    AND actor_ip_address IS NOT NULL
    GROUP BY actor_ip_address
    HAVING COUNT(*) > 5
  LOOP
    -- Create alert for suspicious bulk subscription creation
    BEGIN
      alert_id := create_security_alert(
        'bulk_operations',
        'high',
        'Suspicious bulk subscription creation detected',
        format('IP %s created %s subscriptions in 1 hour', activity.actor_ip_address, activity.event_count),
        NULL,
        'ip_address',
        NULL,
        'automated_detection',
        json_build_object(
          'ip_address', activity.actor_ip_address,
          'event_count', activity.event_count,
          'time_window', '1 hour',
          'affected_users', activity.affected_users
        )
      );

      suspicious_activities := suspicious_activities || json_build_object(
        'type', 'bulk_subscription_creation',
        'ip_address', activity.actor_ip_address,
        'event_count', activity.event_count,
        'alert_id', alert_id
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Failed to create bulk operations alert: %', SQLERRM;
    END;
  END LOOP;

  -- Check for privilege escalation attempts
  FOR activity IN
    SELECT
      target_user_id,
      COUNT(*) as escalation_attempts,
      array_agg(event_timestamp ORDER BY event_timestamp DESC) as attempt_times
    FROM subscription_audit_log
    WHERE event_type = 'entitlement_granted'
    AND event_timestamp > NOW() - INTERVAL '24 hours'
    AND security_level = 'high'
    GROUP BY target_user_id
    HAVING COUNT(*) > 3
  LOOP
    -- Create alert for potential privilege escalation
    BEGIN
      alert_id := create_security_alert(
        'privilege_escalation',
        'critical',
        'Potential privilege escalation detected',
        format('User received %s high-security entitlement grants in 24 hours', activity.escalation_attempts),
        activity.target_user_id,
        'user',
        activity.target_user_id,
        'automated_detection',
        json_build_object(
          'escalation_attempts', activity.escalation_attempts,
          'time_window', '24 hours',
          'attempt_times', activity.attempt_times
        )
      );

      suspicious_activities := suspicious_activities || json_build_object(
        'type', 'privilege_escalation',
        'user_id', activity.target_user_id,
        'escalation_attempts', activity.escalation_attempts,
        'alert_id', alert_id
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Failed to create privilege escalation alert: %', SQLERRM;
    END;
  END LOOP;

  RETURN json_build_object(
    'detection_timestamp', NOW(),
    'suspicious_activities_found', jsonb_array_length(suspicious_activities),
    'activities', suspicious_activities
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================
-- Update existing functions to include audit logging (PostgreSQL-Safe)
-- =========================

-- Update the subscription validation trigger to include audit logging (PostgreSQL-Safe)
CREATE OR REPLACE FUNCTION trigger_validate_entitlements_with_audit()
RETURNS TRIGGER AS $$
DECLARE
  old_tier TEXT;
  new_tier TEXT;
BEGIN
  -- Get tier information for logging
  IF TG_OP = 'DELETE' THEN
    old_tier := OLD.tier;
    new_tier := NULL;
  ELSIF TG_OP = 'INSERT' THEN
    old_tier := NULL;
    new_tier := NEW.tier;
  ELSE
    old_tier := OLD.tier;
    new_tier := NEW.tier;
  END IF;

  -- Log the subscription change (only if logging function exists)
  BEGIN
    PERFORM log_subscription_event(
      CASE TG_OP
        WHEN 'INSERT' THEN 'subscription_created'
        WHEN 'UPDATE' THEN 'subscription_updated'
        WHEN 'DELETE' THEN 'subscription_cancelled'
      END,
      CASE WHEN TG_OP = 'DELETE' THEN OLD.user_id ELSE NEW.user_id END,
      CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
      CASE WHEN TG_OP = 'DELETE' THEN OLD.store_id ELSE NEW.store_id END,
      'Subscription ' || TG_OP || ' triggered entitlement validation',
      CASE WHEN TG_OP != 'INSERT' THEN row_to_json(OLD) ELSE NULL END,
      CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) ELSE NULL END,
      json_build_object('trigger_operation', TG_OP),
      'normal'
    );
  EXCEPTION WHEN OTHERS THEN
    -- If logging fails, don't fail the trigger
    RAISE NOTICE 'Audit logging failed in subscription trigger: %', SQLERRM;
  END;

  -- Validate entitlements for the affected user (only if function exists)
  BEGIN
    PERFORM validate_user_entitlements(
      CASE
        WHEN TG_OP = 'DELETE' THEN OLD.user_id
        ELSE NEW.user_id
      END
    );
  EXCEPTION WHEN OTHERS THEN
    -- If validation function doesn't exist, log but don't fail
    RAISE NOTICE 'Entitlement validation function not available: %', SQLERRM;
  END;

  -- Invalidate cache (only if function exists)
  BEGIN
    PERFORM invalidate_user_entitlement_cache(
      CASE
        WHEN TG_OP = 'DELETE' THEN OLD.user_id
        ELSE NEW.user_id
      END
    );
  EXCEPTION WHEN OTHERS THEN
    -- If cache function doesn't exist, log but don't fail
    RAISE NOTICE 'Cache invalidation function not available: %', SQLERRM;
  END;

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

-- Update the trigger to use the new audit-enabled function (only if user_subscriptions table exists)
DO $$
BEGIN
  IF table_exists('user_subscriptions') THEN
    DROP TRIGGER IF EXISTS trigger_subscription_entitlement_validation ON user_subscriptions;
    CREATE TRIGGER trigger_subscription_entitlement_validation
      AFTER INSERT OR UPDATE OR DELETE ON user_subscriptions
      FOR EACH ROW
      EXECUTE FUNCTION trigger_validate_entitlements_with_audit();

    RAISE NOTICE 'Subscription audit trigger created successfully';
  ELSE
    RAISE NOTICE 'user_subscriptions table does not exist - trigger not created';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Failed to create subscription audit trigger: %', SQLERRM;
END $$;

-- =========================
-- Comments for documentation
-- =========================
COMMENT ON TABLE subscription_audit_log IS 'Comprehensive audit log for all subscription-related events and security monitoring';
COMMENT ON TABLE subscription_security_alerts IS 'Security alerts and incidents related to subscription system';
COMMENT ON FUNCTION log_subscription_event IS 'Log subscription events with full audit trail and security context (PostgreSQL-Safe)';
COMMENT ON FUNCTION create_security_alert IS 'Create and track security alerts with automated escalation (PostgreSQL-Safe)';
COMMENT ON FUNCTION validate_subscription_access IS 'Validate user permissions for subscription operations with audit logging (PostgreSQL-Safe)';
COMMENT ON FUNCTION detect_suspicious_subscription_activity IS 'Automated detection of suspicious patterns in subscription activities (PostgreSQL-Safe)';

-- =========================
-- Migration completion notice
-- =========================
DO $$
BEGIN
  RAISE NOTICE '=== PostgreSQL-Safe Security Enhancements Migration Completed ===';
  RAISE NOTICE 'Tables created: subscription_audit_log, subscription_security_alerts';
  RAISE NOTICE 'Functions created: log_subscription_event, create_security_alert, validate_subscription_access, detect_suspicious_subscription_activity';
  RAISE NOTICE 'Conditional foreign keys and RLS policies applied based on table existence';
  RAISE NOTICE 'All functions include graceful degradation for missing dependencies';
  RAISE NOTICE '=== Migration 8 PostgreSQL-Safe Version Complete ===';
END $$;
