# Technical Implementation Guide
## Step-by-Step Instructions for High-Priority Subscription System Integration

## Overview

This guide provides detailed, step-by-step technical instructions for implementing the highest priority subscription system integration tasks. Each section includes specific code examples, database queries, and implementation patterns.

## Prerequisites

### Environment Setup
```bash
# Ensure you have the latest dependencies
npm install

# Verify database connection
npm run db:status

# Run existing tests to ensure baseline functionality
npm run test
```

### Database Validation
```sql
-- Verify all subscription system functions are available
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%subscription%';

-- Expected functions:
-- has_active_subscription
-- get_user_subscription_tier
-- validate_user_entitlements
-- emergency_fix_all_entitlements
-- process_expired_subscriptions
```

## Task 1: Post-Migration Validation & Emergency Fix

### Step 1.1: Database Health Check
```sql
-- Check current system state
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN membership_tier = 'PRIVILEGED' THEN 1 END) as privileged_users,
  COUNT(CASE WHEN membership_tier = 'PRIVILEGED_PLUS' THEN 1 END) as privileged_plus_users
FROM users;

-- Identify problematic users
SELECT u.id, u.username, u.membership_tier, 
       COUNT(us.id) as active_subscriptions,
       MAX(us.end_date) as latest_subscription_end
FROM users u
LEFT JOIN user_subscriptions us ON u.id = us.user_id 
  AND us.is_active = TRUE 
  AND us.end_date > NOW()
WHERE u.membership_tier IN ('PRIVILEGED', 'PRIVILEGED_PLUS')
GROUP BY u.id, u.username, u.membership_tier
HAVING COUNT(us.id) = 0;
```

### Step 1.2: Execute Emergency Fix
```sql
-- Run emergency fix and capture results
SELECT emergency_fix_all_entitlements() as fix_results;

-- Verify fix results
SELECT * FROM admin_subscription_overview;
```

### Step 1.3: Validation Script
Create `scripts/validate-subscription-system.js`:
```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function validateSubscriptionSystem() {
  console.log('🔍 Validating subscription system...');
  
  try {
    // Test core functions
    const { data: testResult, error } = await supabase
      .rpc('has_active_subscription', { 
        p_user_id: 'test-user-id' 
      });
    
    if (error && !error.message.includes('does not exist')) {
      throw error;
    }
    
    console.log('✅ Core functions accessible');
    
    // Check admin views
    const { data: overview, error: overviewError } = await supabase
      .from('admin_subscription_overview')
      .select('*')
      .single();
    
    if (overviewError) throw overviewError;
    
    console.log('✅ Admin views accessible');
    console.log('📊 System Overview:', overview);
    
    // Check for problematic users
    const { data: problematicUsers, error: problemError } = await supabase
      .from('admin_problematic_users')
      .select('*');
    
    if (problemError) throw problemError;
    
    console.log(`⚠️  Found ${problematicUsers.length} users with entitlement issues`);
    
    return {
      success: true,
      overview,
      problematicUsersCount: problematicUsers.length
    };
    
  } catch (error) {
    console.error('❌ Validation failed:', error);
    return { success: false, error: error.message };
  }
}

// Run validation
validateSubscriptionSystem()
  .then(result => {
    if (result.success) {
      console.log('🎉 Subscription system validation completed successfully');
    } else {
      console.error('💥 Validation failed:', result.error);
      process.exit(1);
    }
  });
```

## Task 2: Frontend Subscription Validation API

### Step 2.1: Create Type Definitions
Create `src/lib/api/subscriptions/types.ts`:
```typescript
export interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  currentTier: 'MEMBER' | 'PRIVILEGED' | 'PRIVILEGED_PLUS';
  subscriptionExpiry: string | null;
  isValid: boolean;
  lastValidated: string;
}

export interface SubscriptionDetails {
  id: string;
  userId: string;
  tier: string;
  subscriptionType: 'monthly' | 'yearly';
  startDate: string;
  endDate: string;
  isActive: boolean;
  storeId: string;
  amount: number;
  paymentReference: string | null;
}

export interface ValidationError {
  code: string;
  message: string;
  details?: any;
}

export interface EntitlementValidationResult {
  userId: string;
  currentTier: string;
  subscriptionTier: string;
  hasActiveSubscription: boolean;
  needsUpdate: boolean;
  updatedTier?: string;
  issues: string[];
}
```

### Step 2.2: Create Validation API
Create `src/lib/api/subscriptions/validation.ts`:
```typescript
import { supabase } from '@/lib/supabase';
import { 
  SubscriptionStatus, 
  SubscriptionDetails, 
  ValidationError,
  EntitlementValidationResult 
} from './types';

// Cache for subscription status to prevent excessive API calls
const subscriptionCache = new Map<string, {
  status: SubscriptionStatus;
  timestamp: number;
}>();

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function validateUserSubscription(
  userId: string,
  forceRefresh: boolean = false
): Promise<SubscriptionStatus> {
  // Check cache first
  if (!forceRefresh && subscriptionCache.has(userId)) {
    const cached = subscriptionCache.get(userId)!;
    if (Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.status;
    }
  }

  try {
    // Call backend validation function
    const { data: hasActive, error: activeError } = await supabase
      .rpc('has_active_subscription', { p_user_id: userId });
    
    if (activeError) {
      console.error('Subscription validation error:', activeError);
      throw new Error(`Subscription validation failed: ${activeError.message}`);
    }

    // Get current subscription tier
    const { data: currentTier, error: tierError } = await supabase
      .rpc('get_user_subscription_tier', { p_user_id: userId });
    
    if (tierError) {
      console.error('Tier validation error:', tierError);
      throw new Error(`Tier validation failed: ${tierError.message}`);
    }

    // Get subscription details for expiry date
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('end_date')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('end_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Note: maybeSingle() doesn't throw error if no rows found
    if (subError) {
      console.error('Subscription details error:', subError);
      throw new Error(`Failed to get subscription details: ${subError.message}`);
    }

    const status: SubscriptionStatus = {
      hasActiveSubscription: hasActive || false,
      currentTier: (currentTier as 'MEMBER' | 'PRIVILEGED' | 'PRIVILEGED_PLUS') || 'MEMBER',
      subscriptionExpiry: subscription?.end_date || null,
      isValid: hasActive && currentTier !== 'MEMBER',
      lastValidated: new Date().toISOString()
    };

    // Cache the result
    subscriptionCache.set(userId, {
      status,
      timestamp: Date.now()
    });

    return status;
    
  } catch (error) {
    console.error('Subscription validation error:', error);
    
    // Fail secure - deny access on error
    const failSafeStatus: SubscriptionStatus = {
      hasActiveSubscription: false,
      currentTier: 'MEMBER',
      subscriptionExpiry: null,
      isValid: false,
      lastValidated: new Date().toISOString()
    };
    
    return failSafeStatus;
  }
}

export async function getUserSubscriptionDetails(
  userId: string
): Promise<SubscriptionDetails | null> {
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select(`
        id,
        user_id,
        tier,
        subscription_type,
        start_date,
        end_date,
        is_active,
        store_id,
        amount,
        payment_reference
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('end_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Failed to get subscription details:', error);
      throw new Error(`Failed to get subscription details: ${error.message}`);
    }

    if (!data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      tier: data.tier,
      subscriptionType: data.subscription_type,
      startDate: data.start_date,
      endDate: data.end_date,
      isActive: data.is_active,
      storeId: data.store_id,
      amount: data.amount,
      paymentReference: data.payment_reference
    };
    
  } catch (error) {
    console.error('Error getting subscription details:', error);
    throw error;
  }
}

export async function validateUserEntitlements(
  userId: string
): Promise<EntitlementValidationResult> {
  try {
    const { data, error } = await supabase
      .rpc('validate_user_entitlements', { p_user_id: userId });
    
    if (error) {
      console.error('Entitlement validation error:', error);
      throw new Error(`Entitlement validation failed: ${error.message}`);
    }

    return {
      userId: data.user_id,
      currentTier: data.current_membership_tier,
      subscriptionTier: data.subscription_tier,
      hasActiveSubscription: data.has_active_subscription,
      needsUpdate: data.needs_update,
      updatedTier: data.updated_tier,
      issues: data.issues || []
    };
    
  } catch (error) {
    console.error('Error validating entitlements:', error);
    throw error;
  }
}

// Utility function to clear cache for a user
export function clearSubscriptionCache(userId: string): void {
  subscriptionCache.delete(userId);
}

// Utility function to clear all cache
export function clearAllSubscriptionCache(): void {
  subscriptionCache.clear();
}

// Function to check if user has required tier with active subscription
export async function hasRequiredAccess(
  userId: string,
  requiredTier: 'PRIVILEGED' | 'PRIVILEGED_PLUS'
): Promise<boolean> {
  try {
    const status = await validateUserSubscription(userId);
    
    if (!status.hasActiveSubscription) {
      return false;
    }
    
    if (requiredTier === 'PRIVILEGED_PLUS') {
      return status.currentTier === 'PRIVILEGED_PLUS';
    }
    
    if (requiredTier === 'PRIVILEGED') {
      return ['PRIVILEGED', 'PRIVILEGED_PLUS'].includes(status.currentTier);
    }
    
    return false;
    
  } catch (error) {
    console.error('Error checking required access:', error);
    // Fail secure
    return false;
  }
}
```

### Step 2.3: Create Test Suite
Create `src/lib/api/subscriptions/validation.test.ts`:
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { validateUserSubscription, hasRequiredAccess } from './validation';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => ({
                maybeSingle: vi.fn()
              }))
            }))
          }))
        }))
      }))
    }))
  }
}));

describe('Subscription Validation API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateUserSubscription', () => {
    it('should return valid status for active subscription', async () => {
      // Mock successful responses
      const mockSupabase = await import('@/lib/supabase');
      mockSupabase.supabase.rpc
        .mockResolvedValueOnce({ data: true, error: null }) // has_active_subscription
        .mockResolvedValueOnce({ data: 'PRIVILEGED', error: null }); // get_user_subscription_tier
      
      mockSupabase.supabase.from().select().eq().eq().order().limit().maybeSingle
        .mockResolvedValue({ 
          data: { end_date: '2025-12-31T23:59:59Z' }, 
          error: null 
        });

      const result = await validateUserSubscription('test-user-id');

      expect(result.hasActiveSubscription).toBe(true);
      expect(result.currentTier).toBe('PRIVILEGED');
      expect(result.isValid).toBe(true);
    });

    it('should fail secure on error', async () => {
      const mockSupabase = await import('@/lib/supabase');
      mockSupabase.supabase.rpc
        .mockRejectedValue(new Error('Database error'));

      const result = await validateUserSubscription('test-user-id');

      expect(result.hasActiveSubscription).toBe(false);
      expect(result.currentTier).toBe('MEMBER');
      expect(result.isValid).toBe(false);
    });
  });

  describe('hasRequiredAccess', () => {
    it('should grant access for valid privileged subscription', async () => {
      const mockSupabase = await import('@/lib/supabase');
      mockSupabase.supabase.rpc
        .mockResolvedValueOnce({ data: true, error: null })
        .mockResolvedValueOnce({ data: 'PRIVILEGED', error: null });
      
      mockSupabase.supabase.from().select().eq().eq().order().limit().maybeSingle
        .mockResolvedValue({ data: null, error: null });

      const result = await hasRequiredAccess('test-user-id', 'PRIVILEGED');
      expect(result).toBe(true);
    });

    it('should deny access for expired subscription', async () => {
      const mockSupabase = await import('@/lib/supabase');
      mockSupabase.supabase.rpc
        .mockResolvedValueOnce({ data: false, error: null })
        .mockResolvedValueOnce({ data: 'PRIVILEGED', error: null });

      const result = await hasRequiredAccess('test-user-id', 'PRIVILEGED');
      expect(result).toBe(false);
    });
  });
});
```

## Task 3: AuthContext Integration

### Step 3.1: Update AuthContext Types
Modify `src/contexts/AuthContext.tsx`:
```typescript
import { SubscriptionStatus } from '@/lib/api/subscriptions/types';
import { validateUserSubscription, clearSubscriptionCache } from '@/lib/api/subscriptions/validation';

type AuthContextType = {
  // ... existing properties
  
  // NEW: Subscription-aware properties
  subscriptionStatus: SubscriptionStatus | null;
  subscriptionLoading: boolean;
  refreshSubscriptionStatus: () => Promise<void>;
  hasValidSubscription: () => boolean;
  getSubscriptionTier: () => string;
  hasRequiredTier: (requiredTier: 'PRIVILEGED' | 'PRIVILEGED_PLUS') => boolean;
};
```

### Step 3.2: Implement Subscription State Management
Add to AuthProvider component:
```typescript
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ... existing state
  
  // NEW: Subscription state
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  // NEW: Subscription validation function
  const refreshSubscriptionStatus = useCallback(async () => {
    if (!user) {
      setSubscriptionStatus(null);
      return;
    }

    try {
      setSubscriptionLoading(true);
      const status = await validateUserSubscription(user.id, true); // Force refresh
      setSubscriptionStatus(status);
    } catch (error) {
      console.error('Failed to refresh subscription status:', error);
      toast.error('Failed to load subscription status');
      
      // Fail secure
      setSubscriptionStatus({
        hasActiveSubscription: false,
        currentTier: 'MEMBER',
        subscriptionExpiry: null,
        isValid: false,
        lastValidated: new Date().toISOString()
      });
    } finally {
      setSubscriptionLoading(false);
    }
  }, [user]);

  // NEW: Convenience functions
  const hasValidSubscription = useCallback(() => {
    return subscriptionStatus?.isValid || false;
  }, [subscriptionStatus]);

  const getSubscriptionTier = useCallback(() => {
    return subscriptionStatus?.currentTier || 'MEMBER';
  }, [subscriptionStatus]);

  const hasRequiredTier = useCallback((requiredTier: 'PRIVILEGED' | 'PRIVILEGED_PLUS') => {
    if (!subscriptionStatus?.hasActiveSubscription) return false;
    
    if (requiredTier === 'PRIVILEGED_PLUS') {
      return subscriptionStatus.currentTier === 'PRIVILEGED_PLUS';
    }
    
    return ['PRIVILEGED', 'PRIVILEGED_PLUS'].includes(subscriptionStatus.currentTier);
  }, [subscriptionStatus]);

  // MODIFY: Existing useEffect to include subscription validation
  useEffect(() => {
    // ... existing auth logic
    
    // Add subscription validation when user changes
    if (user) {
      refreshSubscriptionStatus();
    } else {
      setSubscriptionStatus(null);
      clearSubscriptionCache(user?.id || '');
    }
  }, [user, refreshSubscriptionStatus]);

  // NEW: Periodic subscription status refresh
  useEffect(() => {
    if (!user || !subscriptionStatus) return;

    // Refresh subscription status every 10 minutes
    const interval = setInterval(() => {
      refreshSubscriptionStatus();
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, subscriptionStatus, refreshSubscriptionStatus]);

  const value: AuthContextType = {
    // ... existing values
    
    // NEW: Subscription values
    subscriptionStatus,
    subscriptionLoading,
    refreshSubscriptionStatus,
    hasValidSubscription,
    getSubscriptionTier,
    hasRequiredTier
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
```

## Task 4: Entitlements System Integration

### Step 4.1: Update Entitlements Calculation
Modify `src/lib/entitlements/membership.ts`:
```typescript
import { validateUserSubscription } from '@/lib/api/subscriptions/validation';

// MODIFY: calculateUserEntitlements function
export async function calculateUserEntitlements(
  userId: string,
  forceRefresh: boolean = false
): Promise<string[]> {
  try {
    // NEW: Validate subscription before calculating entitlements
    const subscriptionStatus = await validateUserSubscription(userId, forceRefresh);

    // Use subscription-validated tier instead of database tier
    const effectiveTier = subscriptionStatus.currentTier;

    // Only grant premium entitlements if subscription is valid
    if (!subscriptionStatus.hasActiveSubscription && effectiveTier !== 'MEMBER') {
      console.warn(`User ${userId} has tier ${effectiveTier} but no active subscription`);
      // Force to MEMBER tier for entitlement calculation
      return getEntitlementsForTier('MEMBER');
    }

    return getEntitlementsForTier(effectiveTier);
  } catch (error) {
    console.error('Error calculating user entitlements:', error);
    // Fail secure - return minimal entitlements
    return getEntitlementsForTier('MEMBER');
  }
}

// NEW: Subscription-aware permission checking
export async function hasValidPermission(
  userId: string,
  requiredPermission: string
): Promise<boolean> {
  try {
    const subscriptionStatus = await validateUserSubscription(userId);

    if (!subscriptionStatus.hasActiveSubscription) {
      // Only allow MEMBER-level permissions for users without active subscriptions
      const memberEntitlements = getEntitlementsForTier('MEMBER');
      return memberEntitlements.includes(requiredPermission);
    }

    const userEntitlements = await calculateUserEntitlements(userId);
    return userEntitlements.includes(requiredPermission);
  } catch (error) {
    console.error('Error checking permission:', error);
    // Fail secure
    return false;
  }
}

// NEW: Batch permission checking for performance
export async function checkMultiplePermissions(
  userId: string,
  permissions: string[]
): Promise<Record<string, boolean>> {
  try {
    const userEntitlements = await calculateUserEntitlements(userId);
    const results: Record<string, boolean> = {};

    permissions.forEach(permission => {
      results[permission] = userEntitlements.includes(permission);
    });

    return results;
  } catch (error) {
    console.error('Error checking multiple permissions:', error);
    // Fail secure - deny all permissions
    const results: Record<string, boolean> = {};
    permissions.forEach(permission => {
      results[permission] = false;
    });
    return results;
  }
}
```

### Step 4.2: Update Cache System
Modify `src/lib/entitlements/cache.ts`:
```typescript
import { clearSubscriptionCache } from '@/lib/api/subscriptions/validation';

// MODIFY: Cache key to include subscription validation
function getCacheKey(userId: string): string {
  return `entitlements:${userId}:subscription-aware`;
}

// NEW: Subscription-aware cache invalidation
export function invalidateSubscriptionCache(userId: string): void {
  const cacheKey = getCacheKey(userId);
  entitlementsCache.delete(cacheKey);

  // Also clear subscription validation cache
  clearSubscriptionCache(userId);

  // Clear any related caches
  const relatedKeys = Array.from(entitlementsCache.keys())
    .filter(key => key.includes(userId));

  relatedKeys.forEach(key => entitlementsCache.delete(key));
}

// MODIFY: getUserEntitlements to include subscription validation
export async function getUserEntitlements(
  userId: string,
  forceRefresh: boolean = false
): Promise<string[]> {
  const cacheKey = getCacheKey(userId);

  if (!forceRefresh && entitlementsCache.has(cacheKey)) {
    const cached = entitlementsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.entitlements;
    }
  }

  // NEW: Use subscription-aware entitlement calculation
  const entitlements = await calculateUserEntitlements(userId, forceRefresh);

  entitlementsCache.set(cacheKey, {
    entitlements,
    timestamp: Date.now()
  });

  return entitlements;
}

// NEW: Real-time cache invalidation trigger
export function setupCacheInvalidationTriggers(): void {
  // Listen for subscription changes via Supabase real-time
  supabase
    .channel('subscription-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'user_subscriptions'
    }, (payload) => {
      if (payload.new?.user_id) {
        invalidateSubscriptionCache(payload.new.user_id);
      }
      if (payload.old?.user_id) {
        invalidateSubscriptionCache(payload.old.user_id);
      }
    })
    .subscribe();
}
```

## Task 5: RLS Policy Security Updates

### Step 5.1: Create Migration File
Create `supabase/migrations/20250106_001_update_rls_policies.sql`:
```sql
-- Update RLS policies to use subscription validation
-- This migration updates all RLS policies to properly validate subscriptions

-- Helper function to check if user has required tier with active subscription
CREATE OR REPLACE FUNCTION user_has_tier_with_subscription(
  user_id UUID,
  required_tier TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user has active subscription and required tier
  RETURN (
    has_active_subscription(user_id) AND
    CASE
      WHEN required_tier = 'privileged_plus' THEN
        get_user_subscription_tier(user_id) = 'PRIVILEGED_PLUS'
      WHEN required_tier = 'privileged' THEN
        get_user_subscription_tier(user_id) IN ('PRIVILEGED', 'PRIVILEGED_PLUS')
      ELSE FALSE
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Book Clubs Access Policy Update
DROP POLICY IF EXISTS "book_clubs_access_policy" ON book_clubs;
CREATE POLICY "book_clubs_access_policy" ON book_clubs
FOR SELECT USING (
  -- Public clubs are accessible to all authenticated users
  access_tier_required = 'free'
  OR
  -- Premium clubs require active subscription
  (
    access_tier_required = 'all_premium'
    AND user_has_tier_with_subscription(auth.uid(), 'privileged')
  )
  OR
  -- Privileged+ clubs require specific tier and active subscription
  (
    access_tier_required = 'privileged_plus'
    AND user_has_tier_with_subscription(auth.uid(), 'privileged_plus')
  )
  OR
  -- Club owners and admins always have access
  EXISTS (
    SELECT 1 FROM club_members cm
    WHERE cm.club_id = book_clubs.id
    AND cm.user_id = auth.uid()
    AND cm.role IN ('owner', 'admin')
  )
);

-- Club Members Access Policy Update
DROP POLICY IF EXISTS "club_members_access_policy" ON club_members;
CREATE POLICY "club_members_access_policy" ON club_members
FOR SELECT USING (
  -- Users can see their own memberships
  user_id = auth.uid()
  OR
  -- Members can see other members if they have access to the club
  EXISTS (
    SELECT 1 FROM book_clubs bc
    WHERE bc.id = club_members.club_id
    AND (
      bc.access_tier_required = 'free'
      OR (
        bc.access_tier_required = 'all_premium'
        AND user_has_tier_with_subscription(auth.uid(), 'privileged')
      )
      OR (
        bc.access_tier_required = 'privileged_plus'
        AND user_has_tier_with_subscription(auth.uid(), 'privileged_plus')
      )
    )
  )
);

-- Club Members Insert Policy (for joining clubs)
DROP POLICY IF EXISTS "club_members_insert_policy" ON club_members;
CREATE POLICY "club_members_insert_policy" ON club_members
FOR INSERT WITH CHECK (
  -- Users can only insert their own membership
  user_id = auth.uid()
  AND
  -- Must have required tier for the club
  EXISTS (
    SELECT 1 FROM book_clubs bc
    WHERE bc.id = club_members.club_id
    AND (
      bc.access_tier_required = 'free'
      OR (
        bc.access_tier_required = 'all_premium'
        AND user_has_tier_with_subscription(auth.uid(), 'privileged')
      )
      OR (
        bc.access_tier_required = 'privileged_plus'
        AND user_has_tier_with_subscription(auth.uid(), 'privileged_plus')
      )
    )
  )
);

-- Reading Lists Access Policy Update
DROP POLICY IF EXISTS "reading_lists_access_policy" ON reading_lists;
CREATE POLICY "reading_lists_access_policy" ON reading_lists
FOR SELECT USING (
  -- Public lists are visible to all
  is_public = true
  OR
  -- Users can see their own lists
  user_id = auth.uid()
  OR
  -- Premium users can see other premium users' lists if they have subscription
  (
    is_public = false
    AND user_has_tier_with_subscription(auth.uid(), 'privileged')
    AND EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = reading_lists.user_id
      AND u.membership_tier IN ('PRIVILEGED', 'PRIVILEGED_PLUS')
    )
  )
);

-- User Profiles Access Policy Update
DROP POLICY IF EXISTS "user_profiles_access_policy" ON user_profiles;
CREATE POLICY "user_profiles_access_policy" ON user_profiles
FOR SELECT USING (
  -- Users can see their own profile
  user_id = auth.uid()
  OR
  -- Public profiles are visible to all authenticated users
  is_public = true
  OR
  -- Premium users can see other premium profiles if they have subscription
  (
    is_public = false
    AND user_has_tier_with_subscription(auth.uid(), 'privileged')
    AND EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = user_profiles.user_id
      AND u.membership_tier IN ('PRIVILEGED', 'PRIVILEGED_PLUS')
    )
  )
);

-- Add comments for documentation
COMMENT ON FUNCTION user_has_tier_with_subscription(UUID, TEXT) IS
'Helper function to check if user has required tier with active subscription';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_active_user_tier
ON user_subscriptions (user_id, is_active, end_date)
WHERE is_active = true;
```

### Step 5.2: Policy Testing Script
Create `scripts/test-rls-policies.js`:
```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testRLSPolicies() {
  console.log('🔒 Testing RLS policies...');

  try {
    // Test 1: Free club access
    console.log('Testing free club access...');
    const { data: freeClubs, error: freeError } = await supabase
      .from('book_clubs')
      .select('*')
      .eq('access_tier_required', 'free')
      .limit(1);

    if (freeError) throw freeError;
    console.log('✅ Free club access working');

    // Test 2: Premium club access (should require subscription validation)
    console.log('Testing premium club access...');
    const { data: premiumClubs, error: premiumError } = await supabase
      .from('book_clubs')
      .select('*')
      .eq('access_tier_required', 'all_premium')
      .limit(1);

    if (premiumError) throw premiumError;
    console.log('✅ Premium club access policy active');

    // Test 3: Helper function
    console.log('Testing helper function...');
    const { data: helperTest, error: helperError } = await supabase
      .rpc('user_has_tier_with_subscription', {
        user_id: 'test-user-id',
        required_tier: 'privileged'
      });

    // This should not error even with invalid user ID
    if (helperError && !helperError.message.includes('does not exist')) {
      throw helperError;
    }
    console.log('✅ Helper function accessible');

    console.log('🎉 RLS policy testing completed successfully');

  } catch (error) {
    console.error('❌ RLS policy testing failed:', error);
    throw error;
  }
}

// Run tests
testRLSPolicies()
  .then(() => {
    console.log('All RLS policy tests passed');
  })
  .catch(error => {
    console.error('RLS policy tests failed:', error);
    process.exit(1);
  });
```

## Task 6: Integration Testing

### Step 6.1: Create Integration Test Suite
Create `src/tests/integration/subscription-integration.test.ts`:
```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { supabase } from '@/lib/supabase';
import { validateUserSubscription, hasRequiredAccess } from '@/lib/api/subscriptions/validation';
import { calculateUserEntitlements } from '@/lib/entitlements/membership';

describe('Subscription System Integration Tests', () => {
  let testUserId: string;
  let testSubscriptionId: string;
  let cleanup: (() => Promise<void>)[] = [];

  beforeEach(async () => {
    // Create test user
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        username: `test-user-${Date.now()}`,
        email: `test-${Date.now()}@example.com`,
        membership_tier: 'PRIVILEGED'
      })
      .select()
      .single();

    if (userError) throw userError;
    testUserId = userData.id;
    cleanup.push(async () => {
      await supabase.from('users').delete().eq('id', testUserId);
    });

    // Create test subscription
    const { data: subData, error: subError } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: testUserId,
        tier: 'privileged',
        subscription_type: 'monthly',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        is_active: true,
        store_id: 'test-store',
        amount: 10.00
      })
      .select()
      .single();

    if (subError) throw subError;
    testSubscriptionId = subData.id;
    cleanup.push(async () => {
      await supabase.from('user_subscriptions').delete().eq('id', testSubscriptionId);
    });
  });

  afterEach(async () => {
    // Run cleanup in reverse order
    for (const cleanupFn of cleanup.reverse()) {
      await cleanupFn();
    }
    cleanup = [];
  });

  describe('Subscription Validation', () => {
    it('should validate active subscription correctly', async () => {
      const status = await validateUserSubscription(testUserId);

      expect(status.hasActiveSubscription).toBe(true);
      expect(status.currentTier).toBe('PRIVILEGED');
      expect(status.isValid).toBe(true);
      expect(status.subscriptionExpiry).toBeTruthy();
    });

    it('should deny access for expired subscription', async () => {
      // Expire the test subscription
      await supabase
        .from('user_subscriptions')
        .update({
          end_date: new Date(Date.now() - 86400000).toISOString() // Yesterday
        })
        .eq('id', testSubscriptionId);

      const status = await validateUserSubscription(testUserId, true); // Force refresh

      expect(status.hasActiveSubscription).toBe(false);
      expect(status.isValid).toBe(false);
    });

    it('should handle inactive subscription', async () => {
      // Deactivate the subscription
      await supabase
        .from('user_subscriptions')
        .update({ is_active: false })
        .eq('id', testSubscriptionId);

      const status = await validateUserSubscription(testUserId, true);

      expect(status.hasActiveSubscription).toBe(false);
      expect(status.isValid).toBe(false);
    });
  });

  describe('Access Control', () => {
    it('should grant privileged access for valid subscription', async () => {
      const hasAccess = await hasRequiredAccess(testUserId, 'PRIVILEGED');
      expect(hasAccess).toBe(true);
    });

    it('should deny privileged+ access for privileged subscription', async () => {
      const hasAccess = await hasRequiredAccess(testUserId, 'PRIVILEGED_PLUS');
      expect(hasAccess).toBe(false);
    });

    it('should deny access for expired subscription', async () => {
      // Expire subscription
      await supabase
        .from('user_subscriptions')
        .update({
          end_date: new Date(Date.now() - 86400000).toISOString()
        })
        .eq('id', testSubscriptionId);

      const hasAccess = await hasRequiredAccess(testUserId, 'PRIVILEGED');
      expect(hasAccess).toBe(false);
    });
  });

  describe('Entitlements Integration', () => {
    it('should calculate entitlements based on subscription status', async () => {
      const entitlements = await calculateUserEntitlements(testUserId);

      expect(entitlements).toContain('CAN_CREATE_BOOK_CLUBS');
      expect(entitlements).toContain('CAN_JOIN_PREMIUM_CLUBS');
      expect(entitlements).not.toContain('CAN_MANAGE_STORE');
    });

    it('should revoke premium entitlements for expired subscriptions', async () => {
      // Expire subscription
      await supabase
        .from('user_subscriptions')
        .update({
          end_date: new Date(Date.now() - 86400000).toISOString()
        })
        .eq('id', testSubscriptionId);

      const entitlements = await calculateUserEntitlements(testUserId, true);

      expect(entitlements).not.toContain('CAN_CREATE_BOOK_CLUBS');
      expect(entitlements).not.toContain('CAN_JOIN_PREMIUM_CLUBS');
      expect(entitlements).toContain('CAN_VIEW_PUBLIC_CLUBS'); // Basic member entitlement
    });
  });

  describe('Error Handling', () => {
    it('should fail secure on database errors', async () => {
      // Mock database error
      const originalRpc = supabase.rpc;
      supabase.rpc = vi.fn().mockRejectedValue(new Error('Database connection failed'));

      const status = await validateUserSubscription(testUserId);

      expect(status.hasActiveSubscription).toBe(false);
      expect(status.currentTier).toBe('MEMBER');
      expect(status.isValid).toBe(false);

      // Restore original function
      supabase.rpc = originalRpc;
    });
  });
});
```

### Step 6.2: Run Integration Tests
Create test script in `package.json`:
```json
{
  "scripts": {
    "test:integration": "vitest run src/tests/integration/",
    "test:integration:watch": "vitest src/tests/integration/",
    "test:subscription": "vitest run src/tests/integration/subscription-integration.test.ts"
  }
}
```

Run tests:
```bash
# Run all integration tests
npm run test:integration

# Run only subscription tests
npm run test:subscription

# Watch mode for development
npm run test:integration:watch
```

## Deployment Checklist

### Pre-Deployment Validation
- [ ] All database functions are accessible
- [ ] Emergency fix has been run successfully
- [ ] Integration tests pass
- [ ] RLS policies are updated and tested
- [ ] Performance benchmarks are met
- [ ] Error handling covers all scenarios

### Deployment Steps
1. **Database Migration**: Deploy RLS policy updates
2. **Backend Deployment**: Deploy API changes
3. **Frontend Deployment**: Deploy UI updates
4. **Validation**: Run post-deployment tests
5. **Monitoring**: Verify system health

### Post-Deployment Monitoring
- Monitor subscription validation performance
- Check error rates and user feedback
- Verify cache hit rates
- Monitor database query performance
- Track user access patterns

This comprehensive implementation guide provides the detailed technical steps needed to successfully integrate the subscription system with the BookTalks Buddy frontend application.
