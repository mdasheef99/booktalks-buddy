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
import type { AccountStatus } from '@/lib/api/admin/accountManagement';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Import types
import type { AuthContextType } from './types';

// Import core functionality
import { signIn as coreSignIn, signUp as coreSignUp, signOut as coreSignOut } from './core/authentication';
import { initializeSession } from './core/sessionManagement';
import { useSuspensionModal } from '@/contexts/SuspensionModalContext';

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
import {
  loadAccountStatus,
  refreshAccountStatus,
  isAccountSuspended,
  isAccountDeleted,
  isAccountActive,
  getAccountStatusMessage,
  validateAccountStatus
} from './features/accountStatus';

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

  // Account status state
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null);
  const [accountStatusLoading, setAccountStatusLoading] = useState(false);

  // Navigation and user tracking
  const navigate = useNavigate();
  const [lastKnownUserId, setLastKnownUserId] = useState<string | null>(null);

  // Suspension modal
  const { showModal: showSuspensionModal } = useSuspensionModal();

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

  // Account status functions
  const handleRefreshAccountStatus = async () => {
    await refreshAccountStatus(user, setAccountStatus, setAccountStatusLoading);
  };

  const handleIsAccountSuspended = () => {
    return isAccountSuspended(accountStatus);
  };

  const handleIsAccountDeleted = () => {
    return isAccountDeleted(accountStatus);
  };

  const handleIsAccountActive = () => {
    return isAccountActive(accountStatus);
  };

  const handleGetAccountStatusMessage = () => {
    return getAccountStatusMessage(accountStatus);
  };

  // Coordinated refresh
  const handleRefreshUserData = async () => {
    await refreshUserData(
      user,
      handleRefreshSubscriptionStatus,
      handleRefreshEntitlements,
      handleRefreshAccountStatus,
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
      navigate,
      accountStatus,
      signOut,
      showSuspensionModal
    );

    return cleanup;
  }, [navigate, lastKnownUserId, accountStatus]);

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

  // Load account status when user changes
  useEffect(() => {
    if (user?.id) {
      loadAccountStatus(user, setAccountStatus, setAccountStatusLoading).catch(error => {
        console.error('[AuthContext] Failed to load account status on user change:', error);
      });
    } else {
      setAccountStatus(null);
      setAccountStatusLoading(false);
    }
  }, [user?.id]);

  // Real-time account status subscription
  useEffect(() => {
    if (!user?.id) return;

    console.log(`[AuthContext] Setting up real-time account status subscription for user ${user.id}`);

    const subscription = supabase
      .channel('account-status-changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'users',
        filter: `id=eq.${user.id}`
      }, (payload) => {
        console.log('[AuthContext] Account status change detected:', payload);

        // Extract account status from the updated row
        const newAccountStatus: AccountStatus = {
          account_status: payload.new.account_status,
          status_changed_by: payload.new.status_changed_by,
          status_changed_at: payload.new.status_changed_at,
          deleted_at: payload.new.deleted_at,
          deleted_by: payload.new.deleted_by
        };

        setAccountStatus(newAccountStatus);

        // Check if user should be logged out immediately
        const statusValidation = validateAccountStatus(newAccountStatus);
        if (statusValidation.shouldLogout) {
          console.log('[AuthContext] Real-time status change requires logout', {
            currentPath: window.location.pathname,
            accountStatus: newAccountStatus?.account_status
          });

          // Don't logout if user is already on the suspended page
          if (window.location.pathname !== '/suspended') {
            toast.error(statusValidation.message);
            // Let the SuspensionRouteGuard handle the redirect instead of doing it here
            signOut().catch(error => {
              console.error('[AuthContext] Error during real-time forced logout:', error);
            });
          }
        }
      })
      .subscribe();

    return () => {
      console.log(`[AuthContext] Cleaning up account status subscription for user ${user.id}`);
      subscription.unsubscribe();
    };
  }, [user?.id, navigate]);

  // Periodic account status checking (every 5 minutes)
  useEffect(() => {
    if (!user?.id) return;

    console.log(`[AuthContext] Setting up periodic account status checking for user ${user.id}`);

    const checkAccountStatus = async () => {
      try {
        await handleRefreshAccountStatus();

        // Check if status requires logout
        if (accountStatus) {
          const statusValidation = validateAccountStatus(accountStatus);
          if (statusValidation.shouldLogout) {
            console.log('[AuthContext] Periodic check detected suspended/deleted account', {
              currentPath: window.location.pathname,
              accountStatus: accountStatus?.account_status
            });

            // Don't logout if user is already on the suspended page
            if (window.location.pathname !== '/suspended') {
              toast.error(statusValidation.message);
              // Let the SuspensionRouteGuard handle the redirect instead of doing it here
              await signOut();
            }
          }
        }
      } catch (error) {
        console.error('[AuthContext] Error during periodic account status check:', error);
        // Don't logout on error - graceful degradation
      }
    };

    // Check immediately, then every 5 minutes
    checkAccountStatus();
    const interval = setInterval(checkAccountStatus, 5 * 60 * 1000); // 5 minutes

    return () => {
      console.log(`[AuthContext] Cleaning up periodic account status checking for user ${user.id}`);
      clearInterval(interval);
    };
  }, [user?.id, navigate]); // 🚨 CRITICAL FIX: Removed accountStatus to prevent infinite dependency loop

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

    // Account status management
    accountStatus,
    accountStatusLoading,
    isAccountSuspended: handleIsAccountSuspended,
    isAccountDeleted: handleIsAccountDeleted,
    isAccountActive: handleIsAccountActive,
    refreshAccountStatus: handleRefreshAccountStatus,
    getAccountStatusMessage: handleGetAccountStatusMessage,

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
