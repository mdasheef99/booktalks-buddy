import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface StoreOwnerAccessResult {
  isStoreOwner: boolean;
  storeId: string | null;
  storeName: string | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to check if the current user is a Store Owner and get their store information
 * Validates Store Owner role and returns store context
 */
export const useStoreOwnerAccess = (): StoreOwnerAccessResult => {
  const { user } = useAuth();
  const [isStoreOwner, setIsStoreOwner] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkStoreOwnerAccess = async () => {
    if (!user) {
      setIsStoreOwner(false);
      setStoreId(null);
      setStoreName(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Query store_administrators table to check if user is a Store Owner
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
        .eq('role', 'owner')
        .single();

      if (adminError) {
        if (adminError.code === 'PGRST116') {
          // No rows returned - user is not a Store Owner
          setIsStoreOwner(false);
          setStoreId(null);
          setStoreName(null);
        } else {
          throw adminError;
        }
      } else if (storeAdmin?.stores) {
        // User is a Store Owner
        setIsStoreOwner(true);
        setStoreId(storeAdmin.store_id);
        setStoreName(storeAdmin.stores.name);
      } else {
        // Store data not found or inactive
        setIsStoreOwner(false);
        setStoreId(null);
        setStoreName(null);
      }
    } catch (err) {
      console.error('Error checking Store Owner access:', err);
      setError(err instanceof Error ? err.message : 'Failed to verify Store Owner access');
      setIsStoreOwner(false);
      setStoreId(null);
      setStoreName(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStoreOwnerAccess();
  }, [user]);

  return {
    isStoreOwner,
    storeId,
    storeName,
    loading,
    error,
    refetch: checkStoreOwnerAccess
  };
};

/**
 * Hook to validate Store Owner access for a specific store
 * Used when store ID is known and needs validation
 */
export const useStoreOwnerValidation = (targetStoreId: string | null) => {
  const { user } = useAuth();
  const [isValidOwner, setIsValidOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const validateAccess = async () => {
      if (!user || !targetStoreId) {
        setIsValidOwner(false);
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
          .eq('role', 'owner')
          .single();

        if (validationError) {
          if (validationError.code === 'PGRST116') {
            setIsValidOwner(false);
          } else {
            throw validationError;
          }
        } else {
          setIsValidOwner(!!data);
        }
      } catch (err) {
        console.error('Error validating Store Owner access:', err);
        setError(err instanceof Error ? err.message : 'Failed to validate access');
        setIsValidOwner(false);
      } finally {
        setLoading(false);
      }
    };

    validateAccess();
  }, [user, targetStoreId]);

  return { isValidOwner, loading, error };
};

/**
 * Hook to get Store Owner entitlements and permissions
 * Returns specific permissions for Store Management features
 */
export const useStoreOwnerEntitlements = () => {
  const { isStoreOwner, storeId } = useStoreOwnerAccess();

  const entitlements = {
    // Landing Page Management
    canManageLandingPage: isStoreOwner,
    canCustomizeCarousel: isStoreOwner,
    canManageBanners: isStoreOwner,
    canManageCommunityShowcase: isStoreOwner,
    canCustomizeHero: isStoreOwner,
    canManageQuotes: isStoreOwner,

    // Analytics and Reporting
    canViewAnalytics: isStoreOwner,
    canExportData: isStoreOwner,

    // Content Management
    canUploadImages: isStoreOwner,
    canManageTestimonials: isStoreOwner,
    canFeatureMembers: isStoreOwner,

    // Store Context
    storeId,
    hasStoreAccess: isStoreOwner && !!storeId
  };

  return entitlements;
};
