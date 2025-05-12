-- Migration: Add helper functions for subscription management
-- Description: Adds utility functions for subscription management

-- Function to check if a user has an active subscription
CREATE OR REPLACE FUNCTION has_active_subscription(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  has_subscription BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM user_subscriptions
    WHERE user_id = $1
    AND is_active = TRUE
    AND end_date > NOW()
  ) INTO has_subscription;

  RETURN has_subscription;
END;
$$ LANGUAGE plpgsql;

-- Function to get a user's active subscription
CREATE OR REPLACE FUNCTION get_active_subscription(user_id UUID)
RETURNS SETOF user_subscriptions AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM user_subscriptions
  WHERE user_id = $1
  AND is_active = TRUE
  AND end_date > NOW()
  ORDER BY end_date DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to create a subscription with payment record
CREATE OR REPLACE FUNCTION create_subscription_with_payment(
  p_user_id UUID,
  p_store_id UUID,
  p_tier VARCHAR,
  p_subscription_type VARCHAR,
  p_recorded_by UUID,
  p_amount DECIMAL = NULL,
  p_payment_reference VARCHAR = NULL,
  p_notes TEXT = NULL
) RETURNS UUID AS $$
DECLARE
  subscription_id UUID;
BEGIN
  -- Insert subscription
  INSERT INTO user_subscriptions (
    user_id,
    store_id,
    tier,
    subscription_type,
    start_date,
    is_active,
    auto_renew
  ) VALUES (
    p_user_id,
    p_store_id,
    p_tier,
    p_subscription_type,
    NOW(),
    TRUE,
    FALSE
  ) RETURNING id INTO subscription_id;

  -- Insert payment record
  INSERT INTO payment_records (
    subscription_id,
    user_id,
    store_id,
    amount,
    payment_method,
    payment_reference,
    payment_date,
    recorded_by,
    notes
  ) VALUES (
    subscription_id,
    p_user_id,
    p_store_id,
    p_amount,
    'offline',
    p_payment_reference,
    NOW(),
    p_recorded_by,
    p_notes
  );

  RETURN subscription_id;
END;
$$ LANGUAGE plpgsql;
