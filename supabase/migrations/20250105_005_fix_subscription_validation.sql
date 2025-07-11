-- Fix Subscription Validation System
-- Migration: 20250105_005_fix_subscription_validation.sql
-- Purpose: Fix the critical subscription validation bug in entitlement system
-- Development Phase: Core fix for subscription expiry validation

-- =========================
-- Enhanced subscription validation functions
-- =========================

-- Drop existing function first to avoid parameter name conflicts
DROP FUNCTION IF EXISTS has_active_subscription(UUID);

-- Improved has_active_subscription function with better error handling
CREATE OR REPLACE FUNCTION has_active_subscription(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  has_subscription BOOLEAN := FALSE;
  subscription_count INTEGER := 0;
BEGIN
  -- Check for active, non-expired subscriptions
  SELECT 
    EXISTS (
      SELECT 1
      FROM user_subscriptions
      WHERE user_id = p_user_id
      AND is_active = TRUE
      AND end_date > NOW()
    ),
    COUNT(*)
  INTO has_subscription, subscription_count
  FROM user_subscriptions
  WHERE user_id = p_user_id
  AND is_active = TRUE;
  
  -- Record metric for monitoring
  PERFORM record_subscription_metric(
    'subscription_validation_check',
    p_user_id,
    NULL,
    NULL,
    1,
    json_build_object(
      'has_active', has_subscription,
      'total_active_subscriptions', subscription_count,
      'check_timestamp', NOW()
    ),
    'system'
  );
  
  RETURN has_subscription;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's current subscription tier based on active subscriptions
CREATE OR REPLACE FUNCTION get_user_subscription_tier(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  subscription_tier TEXT := NULL;
  highest_tier TEXT := 'MEMBER';
BEGIN
  -- Get the highest tier from active subscriptions
  SELECT 
    CASE us.tier
      WHEN 'privileged_plus' THEN 'PRIVILEGED_PLUS'
      WHEN 'privileged' THEN 'PRIVILEGED'
      ELSE 'MEMBER'
    END
  INTO subscription_tier
  FROM user_subscriptions us
  WHERE us.user_id = p_user_id
  AND us.is_active = TRUE
  AND us.end_date > NOW()
  ORDER BY 
    CASE us.tier
      WHEN 'privileged_plus' THEN 3
      WHEN 'privileged' THEN 2
      ELSE 1
    END DESC
  LIMIT 1;
  
  -- Return the subscription tier or default to MEMBER
  RETURN COALESCE(subscription_tier, 'MEMBER');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate and fix user entitlements
CREATE OR REPLACE FUNCTION validate_user_entitlements(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  current_membership_tier TEXT;
  subscription_tier TEXT;
  has_active BOOLEAN;
  needs_update BOOLEAN := FALSE;
  result JSONB;
BEGIN
  -- Get current user data
  SELECT membership_tier INTO current_membership_tier
  FROM users
  WHERE id = p_user_id;
  
  -- Get subscription-based tier
  subscription_tier := get_user_subscription_tier(p_user_id);
  has_active := has_active_subscription(p_user_id);
  
  -- Check if update is needed
  needs_update := (current_membership_tier != subscription_tier);
  
  -- Update if necessary
  IF needs_update THEN
    UPDATE users
    SET
      membership_tier = subscription_tier,
      updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Record the correction
    PERFORM record_subscription_metric(
      CASE 
        WHEN subscription_tier = 'MEMBER' THEN 'entitlement_revoked'
        ELSE 'entitlement_granted'
      END,
      p_user_id,
      NULL,
      NULL,
      1,
      json_build_object(
        'old_tier', current_membership_tier,
        'new_tier', subscription_tier,
        'has_active_subscription', has_active,
        'correction_reason', 'entitlement_validation'
      ),
      'system'
    );
  END IF;
  
  -- Build result
  result := json_build_object(
    'user_id', p_user_id,
    'old_membership_tier', current_membership_tier,
    'new_membership_tier', subscription_tier,
    'has_active_subscription', has_active,
    'was_updated', needs_update,
    'validated_at', NOW()
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to batch validate all user entitlements
CREATE OR REPLACE FUNCTION batch_validate_entitlements(p_limit INTEGER DEFAULT 100)
RETURNS JSONB AS $$
DECLARE
  user_record RECORD;
  validation_result JSONB;
  total_processed INTEGER := 0;
  total_updated INTEGER := 0;
  results JSONB := '[]'::JSONB;
BEGIN
  -- Process users in batches
  FOR user_record IN
    SELECT id, membership_tier
    FROM users
    WHERE membership_tier IS NOT NULL
    ORDER BY updated_at ASC
    LIMIT p_limit
  LOOP
    -- Validate each user
    validation_result := validate_user_entitlements(user_record.id);
    
    -- Track statistics
    total_processed := total_processed + 1;
    IF (validation_result->>'was_updated')::BOOLEAN THEN
      total_updated := total_updated + 1;
    END IF;
    
    -- Add to results if updated
    IF (validation_result->>'was_updated')::BOOLEAN THEN
      results := results || validation_result;
    END IF;
  END LOOP;
  
  -- Record batch validation metric
  PERFORM record_subscription_metric(
    'entitlement_batch_validation',
    NULL,
    NULL,
    NULL,
    total_processed,
    json_build_object(
      'total_processed', total_processed,
      'total_updated', total_updated,
      'batch_size', p_limit,
      'validation_timestamp', NOW()
    ),
    'system'
  );
  
  RETURN json_build_object(
    'total_processed', total_processed,
    'total_updated', total_updated,
    'updated_users', results,
    'batch_completed_at', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================
-- Subscription expiry management
-- =========================

-- Function to automatically handle expired subscriptions
CREATE OR REPLACE FUNCTION process_expired_subscriptions()
RETURNS JSONB AS $$
DECLARE
  expired_subscription RECORD;
  processed_count INTEGER := 0;
  deactivated_count INTEGER := 0;
  results JSONB := '[]'::JSONB;
BEGIN
  -- Find and process expired subscriptions
  FOR expired_subscription IN
    SELECT 
      id,
      user_id,
      store_id,
      tier,
      end_date
    FROM user_subscriptions
    WHERE is_active = TRUE
    AND end_date <= NOW()
    ORDER BY end_date ASC
    LIMIT 50 -- Process in batches
  LOOP
    -- Deactivate the expired subscription
    UPDATE user_subscriptions
    SET 
      is_active = FALSE,
      updated_at = NOW()
    WHERE id = expired_subscription.id;
    
    -- Validate user entitlements after subscription expiry
    PERFORM validate_user_entitlements(expired_subscription.user_id);
    
    -- Record the expiry
    PERFORM record_subscription_metric(
      'subscription_expired',
      expired_subscription.user_id,
      expired_subscription.store_id,
      expired_subscription.id,
      1,
      json_build_object(
        'tier', expired_subscription.tier,
        'end_date', expired_subscription.end_date,
        'processed_at', NOW()
      ),
      'system'
    );
    
    processed_count := processed_count + 1;
    deactivated_count := deactivated_count + 1;
    
    -- Add to results
    results := results || json_build_object(
      'subscription_id', expired_subscription.id,
      'user_id', expired_subscription.user_id,
      'tier', expired_subscription.tier,
      'end_date', expired_subscription.end_date
    );
  END LOOP;
  
  RETURN json_build_object(
    'processed_count', processed_count,
    'deactivated_count', deactivated_count,
    'expired_subscriptions', results,
    'processed_at', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================
-- Cache invalidation functions
-- =========================

-- Function to invalidate entitlement cache for user
CREATE OR REPLACE FUNCTION invalidate_user_entitlement_cache(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Record cache invalidation metric
  PERFORM record_subscription_metric(
    'cache_invalidated',
    p_user_id,
    NULL,
    NULL,
    1,
    json_build_object(
      'cache_type', 'user_entitlements',
      'invalidated_at', NOW(),
      'reason', 'subscription_change'
    ),
    'system'
  );
  
  -- In a real implementation, this would trigger cache invalidation
  -- For now, we just record the event
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================
-- Triggers for automatic validation
-- =========================

-- Trigger function to validate entitlements when subscriptions change
CREATE OR REPLACE FUNCTION trigger_validate_entitlements()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate entitlements for the affected user
  PERFORM validate_user_entitlements(
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.user_id
      ELSE NEW.user_id
    END
  );
  
  -- Invalidate cache
  PERFORM invalidate_user_entitlement_cache(
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.user_id
      ELSE NEW.user_id
    END
  );
  
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on user_subscriptions table
DROP TRIGGER IF EXISTS trigger_subscription_entitlement_validation ON user_subscriptions;
CREATE TRIGGER trigger_subscription_entitlement_validation
  AFTER INSERT OR UPDATE OR DELETE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_validate_entitlements();

-- =========================
-- Emergency functions
-- =========================

-- Emergency function to fix all entitlement mismatches
CREATE OR REPLACE FUNCTION emergency_fix_all_entitlements()
RETURNS JSONB AS $$
DECLARE
  total_fixed INTEGER := 0;
  batch_result JSONB;
  final_result JSONB;
BEGIN
  -- Create emergency backup first
  PERFORM create_subscription_backup('Emergency fix - before entitlement correction');
  
  -- Process all users in batches
  LOOP
    batch_result := batch_validate_entitlements(100);
    total_fixed := total_fixed + (batch_result->>'total_updated')::INTEGER;
    
    -- Exit if no more updates needed
    EXIT WHEN (batch_result->>'total_updated')::INTEGER = 0;
  END LOOP;
  
  -- Process expired subscriptions
  PERFORM process_expired_subscriptions();
  
  -- Run health check
  PERFORM check_subscription_health();
  
  final_result := json_build_object(
    'total_users_fixed', total_fixed,
    'emergency_fix_completed_at', NOW(),
    'backup_created', TRUE
  );
  
  RETURN final_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================
-- Comments for documentation
-- =========================
COMMENT ON FUNCTION has_active_subscription(UUID) IS 'Enhanced subscription validation with monitoring - checks for truly active, non-expired subscriptions';
COMMENT ON FUNCTION get_user_subscription_tier(UUID) IS 'Returns the correct membership tier based on active subscriptions';
COMMENT ON FUNCTION validate_user_entitlements(UUID) IS 'Validates and corrects user entitlements based on actual subscription status';
COMMENT ON FUNCTION batch_validate_entitlements(INTEGER) IS 'Batch processes entitlement validation for multiple users';
COMMENT ON FUNCTION process_expired_subscriptions() IS 'Automatically processes and deactivates expired subscriptions';
COMMENT ON FUNCTION emergency_fix_all_entitlements() IS 'Emergency function to fix all entitlement mismatches - USE WITH CAUTION';
