/**
 * AuthContext Main Provider
 * 
 * This module provides the main AuthProvider component and useAuth hook
 * by orchestrating all the modular authentication functionality.
 * 
 * Part of: AuthContext System Refactoring
 * Created: 2025-01-11
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User, Session } from '@supabase/supabase-js';
import type { SubscriptionStatus } from '@/lib/api/subscriptions/types';

// Import types
import type { AuthContextType } from './types';

// Import core functionality
import { signIn as coreSignIn, signUp as coreSignUp, signOut as coreSignOut } from './core/authentication';
import { initializeSession } from './core/sessionManagement';

// Import feature modules
import { fetchClubRoles, isAdmin, isMember } from './features/clubRoles';
import { refreshEntitlements, loadInitialEntitlements, checkEntitlement, checkContextualEntitlement } from './features/entitlements';
import { 
  refreshSubscriptionStatus, 
  hasValidSubscription, 
  getSubscriptionTier, 
  hasRequiredTier,
  canAccessFeature,
  getSubscriptionStatusWithContext
} from './features/subscriptions';

// Import utilities
import { refreshUserData } from './utils/coordinatedRefresh';

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider component that provides authentication context to children
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Core authentication state
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Club roles state
  const [clubRoles, setClubRoles] = useState<Record<string, string>>({});

  // Entitlements state
  const [entitlements, setEntitlements] = useState<string[]>([]);
  const [entitlementsLoading, setEntitlementsLoading] = useState(true);

  // Subscription state
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  // Navigation and user tracking
  const navigate = useNavigate();
  const [lastKnownUserId, setLastKnownUserId] = useState<string | null>(null);

  // Authentication functions
  const signIn = async (email: string, password: string) => {
    await coreSignIn(email, password, setLoading);
  };

  const signUp = async (email: string, password: string, username: string) => {
    await coreSignUp(email, password, username, setLoading, navigate);
  };

  const signOut = async () => {
    await coreSignOut(user, setLoading, setEntitlements, setSubscriptionStatus, navigate);
  };

  // Club roles functions
  const handleFetchClubRoles = async () => {
    await fetchClubRoles(user, setClubRoles);
  };

  const handleIsAdmin = (clubId: string) => {
    return isAdmin(clubRoles, clubId);
  };

  const handleIsMember = (clubId: string) => {
    return isMember(clubRoles, clubId);
  };

  // Entitlements functions
  const handleRefreshEntitlements = async () => {
    await refreshEntitlements(user, setEntitlements, setEntitlementsLoading);
  };

  const handleCheckEntitlement = (entitlement: string) => {
    return checkEntitlement(entitlements, entitlement);
  };

  const handleCheckContextualEntitlement = (prefix: string, contextId: string) => {
    return checkContextualEntitlement(entitlements, prefix, contextId);
  };

  // Subscription functions
  const handleRefreshSubscriptionStatus = async () => {
    await refreshSubscriptionStatus(user, setSubscriptionStatus, setSubscriptionLoading);
  };

  const handleHasValidSubscription = () => {
    return hasValidSubscription(subscriptionStatus);
  };

  const handleGetSubscriptionTier = () => {
    return getSubscriptionTier(subscriptionStatus);
  };

  const handleHasRequiredTier = (tier: 'PRIVILEGED' | 'PRIVILEGED_PLUS') => {
    return hasRequiredTier(subscriptionStatus, tier);
  };

  const handleCanAccessFeature = (feature: string) => {
    return canAccessFeature(entitlements, subscriptionStatus, feature);
  };

  const handleGetSubscriptionStatusWithContext = () => {
    return getSubscriptionStatusWithContext(subscriptionStatus);
  };

  // Coordinated refresh
  const handleRefreshUserData = async () => {
    await refreshUserData(
      user,
      handleRefreshSubscriptionStatus,
      handleRefreshEntitlements,
      subscriptionStatus,
      entitlements
    );
  };

  // Initialize session and auth state management
  useEffect(() => {
    const cleanup = initializeSession(
      setSession,
      setUser,
      setLoading,
      setClubRoles,
      setSubscriptionStatus,
      setSubscriptionLoading,
      lastKnownUserId,
      setLastKnownUserId,
      navigate
    );

    return cleanup;
  }, [navigate, lastKnownUserId]);

  // Load club roles when user changes
  useEffect(() => {
    if (user?.id) {
      handleFetchClubRoles();
    }
  }, [user?.id]);

  // Load entitlements when user changes
  useEffect(() => {
    if (user?.id) {
      loadInitialEntitlements(user, setEntitlements, setEntitlementsLoading);
    } else {
      setEntitlements([]);
      setEntitlementsLoading(false);
    }
  }, [user?.id]);

  // Load subscription status when user changes
  useEffect(() => {
    if (user?.id) {
      handleRefreshSubscriptionStatus().catch(error => {
        console.error('[AuthContext] Failed to load subscription status on user change:', error);
      });
    } else {
      setSubscriptionStatus(null);
      setSubscriptionLoading(false);
    }
  }, [user?.id]);

  // Context value
  const value: AuthContextType = {
    // Core authentication
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,

    // Club roles
    clubRoles,
    fetchClubRoles: handleFetchClubRoles,
    isAdmin: handleIsAdmin,
    isMember: handleIsMember,

    // Entitlements
    entitlements,
    entitlementsLoading,
    refreshEntitlements: handleRefreshEntitlements,
    hasEntitlement: handleCheckEntitlement,
    hasContextualEntitlement: handleCheckContextualEntitlement,

    // Subscription state
    subscriptionStatus,
    subscriptionLoading,
    refreshSubscriptionStatus: handleRefreshSubscriptionStatus,
    hasValidSubscription: handleHasValidSubscription,
    getSubscriptionTier: handleGetSubscriptionTier,
    hasRequiredTier: handleHasRequiredTier,

    // Enhanced subscription helpers
    canAccessFeature: handleCanAccessFeature,
    getSubscriptionStatusWithContext: handleGetSubscriptionStatusWithContext,

    // Coordinated data refresh
    refreshUserData: handleRefreshUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use the AuthContext
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
