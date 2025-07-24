import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { STORE_MANAGER_ENTITLEMENTS } from '@/lib/entitlements/constants';

interface StoreManagerAccessResult {
  isStoreManager: boolean;
  storeId: string | null;
  storeName: string | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to check if the current user is a Store Manager and get their store information
 * Validates Store Manager role and returns store context
 */
export const useStoreManagerAccess = (): StoreManagerAccessResult => {
  const { user } = useAuth();
  const [isStoreManager, setIsStoreManager] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasChecked, setHasChecked] = useState<boolean>(false);

  const checkStoreManagerAccess = async () => {
    if (!user) {
      setIsStoreManager(false);
      setStoreId(null);
      setStoreName(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('[Store Manager Access] Checking access for user:', user.id);

      // Query store_administrators table to check if user is a Store Manager
      const { data: storeAdmin, error: adminError } = await supabase
        .from('store_administrators')
        .select(`
          store_id,
          role,
          stores (
            id,
            name
          )
        `)
        .eq('user_id', user.id)
        .eq('role', 'manager')
        .single();

      console.log('[Store Manager Access] Query result:', { storeAdmin, adminError });
      console.log('[Store Manager Access] Store admin data:', JSON.stringify(storeAdmin, null, 2));

      if (adminError) {
        if (adminError.code === 'PGRST116') {
          // No rows returned - user is not a Store Manager
          console.log('[Store Manager Access] User is not a Store Manager (PGRST116)');
          setIsStoreManager(false);
          setStoreId(null);
          setStoreName(null);
          setError(null);
          setHasChecked(true);
          setLoading(false); // Set loading false after state update
        } else {
          console.error('[Store Manager Access] Database error:', adminError);
          setError(`Database error: ${adminError.message}`);
          setIsStoreManager(false);
          setStoreId(null);
          setStoreName(null);
          setHasChecked(true);
          setLoading(false); // Set loading false after error state update
        }
      } else if (storeAdmin?.stores) {
        // User is a Store Manager
        console.log('[Store Manager Access] User is a Store Manager');
        console.log('[Store Manager Access] Setting store context:', {
          storeId: storeAdmin.store_id,
          storeName: storeAdmin.stores.name
        });
        setIsStoreManager(true);
        setStoreId(storeAdmin.store_id);
        setStoreName(storeAdmin.stores.name);
        setError(null);
        setHasChecked(true);
        setLoading(false); // Set loading false after successful state update
      } else {
        // Unexpected response structure
        console.log('[Store Manager Access] Unexpected response structure');
        console.log('[Store Manager Access] storeAdmin:', storeAdmin);
        setIsStoreManager(false);
        setStoreId(null);
        setStoreName(null);
        setError('Unexpected response structure');
        setHasChecked(true);
        setLoading(false); // Set loading false after state update
      }
    } catch (err) {
      console.error('Error checking Store Manager access:', err);
      setError(err instanceof Error ? err.message : 'Failed to verify Store Manager access');
      setIsStoreManager(false);
      setStoreId(null);
      setStoreName(null);
      setHasChecked(true);
      setLoading(false); // Set loading false after error state update
    }
  };

  useEffect(() => {
    checkStoreManagerAccess();
  }, [user]);

  return {
    isStoreManager,
    storeId,
    storeName,
    loading,
    error,
    hasChecked,
    refetch: checkStoreManagerAccess
  };
};

/**
 * Hook to validate Store Manager access for a specific store
 * Used when store ID is known and needs validation
 */
export const useStoreManagerValidation = (targetStoreId: string | null) => {
  const { user } = useAuth();
  const [isValidManager, setIsValidManager] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const validateAccess = async () => {
      if (!user || !targetStoreId) {
        setIsValidManager(false);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error: validationError } = await supabase
          .from('store_administrators')
          .select('store_id, role')
          .eq('user_id', user.id)
          .eq('store_id', targetStoreId)
          .eq('role', 'manager')
          .single();

        if (validationError) {
          if (validationError.code === 'PGRST116') {
            setIsValidManager(false);
          } else {
            throw validationError;
          }
        } else {
          setIsValidManager(!!data);
        }
      } catch (err) {
        console.error('Error validating Store Manager access:', err);
        setError(err instanceof Error ? err.message : 'Failed to validate access');
        setIsValidManager(false);
      } finally {
        setLoading(false);
      }
    };

    validateAccess();
  }, [user, targetStoreId]);

  return { isValidManager, loading, error };
};

/**
 * Hook to get Store Manager entitlements and permissions
 * Returns specific permissions for Store Management features
 */
export const useStoreManagerEntitlements = () => {
  const { isStoreManager, storeId } = useStoreManagerAccess();

  const entitlements = {
    // User Management
    canViewAllMembers: isStoreManager,
    canInviteUsers: isStoreManager,
    canIssueWarnings: isStoreManager,
    canBanMembers: isStoreManager,
    canUnbanMembers: isStoreManager,
    canManageMemberTiers: isStoreManager,
    canManageUserTiers: isStoreManager,

    // Club Management
    canViewAllClubs: isStoreManager,
    canManageAllClubs: isStoreManager,
    canAssignClubLeads: isStoreManager,

    // Content Moderation
    canModerateContent: isStoreManager,
    canPostAnnouncements: isStoreManager,

    // Analytics and Events
    canViewStoreAnalytics: isStoreManager,
    canManageEvents: isStoreManager,
    canManageStoreEvents: isStoreManager,

    // Store Context
    storeId,
    hasStoreAccess: isStoreManager && !!storeId,

    // Raw entitlements array for compatibility
    entitlements: isStoreManager ? STORE_MANAGER_ENTITLEMENTS : []
  };

  return entitlements;
};
