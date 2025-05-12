-- Migration: Add subscription and payment tables
-- Description: Extends the database schema to support subscription management

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL,
  tier VARCHAR NOT NULL CHECK (tier IN ('privileged', 'privileged_plus')),
  subscription_type VARCHAR NOT NULL CHECK (subscription_type IN ('monthly', 'annual')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  auto_renew BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_store_id ON user_subscriptions(store_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_is_active ON user_subscriptions(is_active);

-- Create payment_records table
CREATE TABLE IF NOT EXISTS payment_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL,
  amount DECIMAL(10, 2),
  currency VARCHAR DEFAULT 'USD',
  payment_method VARCHAR NOT NULL DEFAULT 'offline',
  payment_reference VARCHAR,
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  recorded_by UUID NOT NULL REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_records_user_id ON payment_records(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_subscription_id ON payment_records(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_store_id ON payment_records(store_id);

-- Enable RLS on the new tables
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_subscriptions
CREATE POLICY "Store admins can view all subscriptions" ON user_subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM store_administrators
      WHERE user_id = auth.uid() AND store_id = user_subscriptions.store_id
    )
  );

CREATE POLICY "Store admins can manage subscriptions" ON user_subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM store_administrators
      WHERE user_id = auth.uid() AND store_id = user_subscriptions.store_id
    )
  );

CREATE POLICY "Users can view their own subscriptions" ON user_subscriptions
  FOR SELECT USING (user_id = auth.uid());

-- RLS policies for payment_records
CREATE POLICY "Store admins can view all payments" ON payment_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM store_administrators
      WHERE user_id = auth.uid() AND store_id = payment_records.store_id
    )
  );

CREATE POLICY "Store admins can manage payments" ON payment_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM store_administrators
      WHERE user_id = auth.uid() AND store_id = payment_records.store_id
    )
  );

CREATE POLICY "Users can view their own payments" ON payment_records
  FOR SELECT USING (user_id = auth.uid());

-- Add function to calculate subscription end date
CREATE OR REPLACE FUNCTION calculate_subscription_end_date(
  start_date TIMESTAMP WITH TIME ZONE,
  subscription_type VARCHAR
) RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
  IF subscription_type = 'monthly' THEN
    RETURN start_date + INTERVAL '1 month';
  ELSIF subscription_type = 'annual' THEN
    RETURN start_date + INTERVAL '1 year';
  ELSE
    RAISE EXCEPTION 'Invalid subscription type: %', subscription_type;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to automatically set end_date based on subscription_type
CREATE OR REPLACE FUNCTION set_subscription_end_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.end_date := calculate_subscription_end_date(NEW.start_date, NEW.subscription_type);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create separate triggers for INSERT and UPDATE to avoid using TG_OP in WHEN clause
CREATE TRIGGER set_subscription_end_date_insert_trigger
BEFORE INSERT ON user_subscriptions
FOR EACH ROW
WHEN (NEW.end_date IS NULL)
EXECUTE FUNCTION set_subscription_end_date();

CREATE TRIGGER set_subscription_end_date_update_trigger
BEFORE UPDATE ON user_subscriptions
FOR EACH ROW
WHEN (NEW.end_date IS NULL OR NEW.subscription_type <> OLD.subscription_type)
EXECUTE FUNCTION set_subscription_end_date();

-- Add trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_subscriptions_updated_at
BEFORE UPDATE ON user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
