-- Platform Owner Implementation
-- Generated on 2025-05-20

-- Create platform_settings table
CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add your user ID as the platform owner
-- Replace with your actual user ID
INSERT INTO platform_settings (key, value)
VALUES ('platform_owner_id', 'efdf6150-d861-4f2c-b59c-5d71c115493b')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Create a function to check if a user is the platform owner
CREATE OR REPLACE FUNCTION is_platform_owner()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM platform_settings 
    WHERE key = 'platform_owner_id' 
    AND value = auth.uid()::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the store insertion policy to use the platform owner check
DROP POLICY IF EXISTS "Only platform owner can insert stores" ON stores;
CREATE POLICY "Only platform owner can insert stores"
ON stores
FOR INSERT
WITH CHECK (is_platform_owner());

-- Add policy for platform settings
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Only platform owner can view platform settings
CREATE POLICY "Only platform owner can view platform settings"
ON platform_settings
FOR SELECT
USING (is_platform_owner());

-- Only platform owner can update platform settings
CREATE POLICY "Only platform owner can update platform settings"
ON platform_settings
FOR UPDATE
USING (is_platform_owner());