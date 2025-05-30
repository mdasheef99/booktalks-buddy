-- Add UPDATE policies for users table to allow tier management
-- Generated on 2025-01-01

-- =========================
-- Drop existing UPDATE policies to avoid conflicts
-- =========================
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Store admins can update user tiers" ON public.users;
DROP POLICY IF EXISTS "Emergency admin can update any user" ON public.users;

-- =========================
-- Users table UPDATE policies
-- =========================

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (
    id = auth.uid()
  )
  WITH CHECK (
    id = auth.uid()
  );

-- Policy: Store administrators can update user tiers for users in their store context
CREATE POLICY "Store admins can update user tiers" ON public.users
  FOR UPDATE USING (
    -- Store owners and managers can update any user's tier
    EXISTS (
      SELECT 1 FROM public.store_administrators sa
      WHERE sa.user_id = auth.uid()
      AND sa.role IN ('owner', 'manager')
    )
  )
  WITH CHECK (
    -- Store owners and managers can update any user's tier
    EXISTS (
      SELECT 1 FROM public.store_administrators sa
      WHERE sa.user_id = auth.uid()
      AND sa.role IN ('owner', 'manager')
    )
  );

-- Policy: Emergency admin access - allows specific admin user to update any user
-- This is a temporary policy that can be updated with proper platform owner detection
CREATE POLICY "Emergency admin can update any user" ON public.users
  FOR UPDATE USING (
    -- Allow the current platform owner user to update any user
    -- Replace 'efdf6150-d861-4f2c-b59c-5d71c115493b' with your actual platform owner user ID
    auth.uid() = 'efdf6150-d861-4f2c-b59c-5d71c115493b'::uuid
  )
  WITH CHECK (
    -- Allow the current platform owner user to update any user
    -- Replace 'efdf6150-d861-4f2c-b59c-5d71c115493b' with your actual platform owner user ID
    auth.uid() = 'efdf6150-d861-4f2c-b59c-5d71c115493b'::uuid
  );
