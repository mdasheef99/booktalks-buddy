/**
 * AuthContext Type Definitions
 * 
 * This module contains all TypeScript interfaces and types used throughout
 * the authentication system.
 * 
 * Part of: AuthContext System Refactoring
 * Created: 2025-01-11
 */

import type { User, Session } from '@supabase/supabase-js';
import type { SubscriptionStatus } from '@/lib/api/subscriptions/types';
import type { AccountStatus } from '@/lib/api/admin/accountManagement';

/**
 * Complete authentication context type definition
 */
export interface AuthContextType {
  // Core authentication
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;

  // Club membership info
  clubRoles: Record<string, string>; // clubId -> role
  fetchClubRoles: () => Promise<void>;
  isAdmin: (clubId: string) => boolean;
  isMember: (clubId: string) => boolean;

  // Entitlements
  entitlements: string[];
  entitlementsLoading: boolean;
  refreshEntitlements: () => Promise<void>;
  hasEntitlement: (entitlement: string) => boolean;
  hasContextualEntitlement: (prefix: string, contextId: string) => boolean;

  // Subscription state (Phase 4B.1.1)
  subscriptionStatus: SubscriptionStatus | null;
  subscriptionLoading: boolean;
  refreshSubscriptionStatus: () => Promise<void>;
  hasValidSubscription: () => boolean;
  getSubscriptionTier: () => 'MEMBER' | 'PRIVILEGED' | 'PRIVILEGED_PLUS';
  hasRequiredTier: (tier: 'PRIVILEGED' | 'PRIVILEGED_PLUS') => boolean;

  // Enhanced subscription helpers (Phase 4B.1.2)
  canAccessFeature: (feature: string) => boolean;
  getSubscriptionStatusWithContext: () => {
    tier: 'MEMBER' | 'PRIVILEGED' | 'PRIVILEGED_PLUS';
    hasActiveSubscription: boolean;
    isValid: boolean;
    needsUpgrade: boolean;
    canUpgrade: boolean;
    context: string;
    expiryDate?: string | null;
    lastValidated?: string;
  };

  // Account status management (Suspension Enforcement System)
  accountStatus: AccountStatus | null;
  accountStatusLoading: boolean;
  isAccountSuspended: () => boolean;
  isAccountDeleted: () => boolean;
  isAccountActive: () => boolean;
  refreshAccountStatus: () => Promise<void>;
  getAccountStatusMessage: () => string;

  // Coordinated data refresh (Phase 4B.1.2)
  refreshUserData: () => Promise<void>;
}

/**
 * Type definitions for subscription tiers
 */
export type SubscriptionTier = 'MEMBER' | 'PRIVILEGED' | 'PRIVILEGED_PLUS';

/**
 * Type definitions for authentication events
 */
export type AuthEvent = 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'USER_UPDATED';

/**
 * Type definitions for club roles
 */
export type ClubRole = 'admin' | 'member' | 'moderator' | 'pending';
