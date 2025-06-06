/**
 * Custom hook for checking if a user has permission to manage a club as a lead
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserEntitlements } from '@/lib/entitlements/cache';
import { hasStoreAdminPermission, canManageSpecificClub } from '@/lib/api/bookclubs/permissions';

/**
 * Hook to check if the current user has permission to manage a club as a lead
 *
 * @param clubId The ID of the club to check
 * @returns An object containing the permission status and loading state
 */
export function useClubLeadPermission(clubId: string) {
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function checkPermission() {
      if (!user?.id || !clubId) {
        if (isMounted) {
          setHasPermission(false);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);

        // Get the user's entitlements
        const entitlements = await getUserEntitlements(user.id);

        // Check if the user can manage this specific club
        const canManage = await canManageSpecificClub(user.id, clubId, entitlements);

        if (isMounted) {
          setHasPermission(canManage);
        }
      } catch (error) {
        console.error('Error checking club lead permission:', error);
        if (isMounted) {
          setHasPermission(false);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    checkPermission();

    return () => {
      isMounted = false;
    };
  }, [user?.id, clubId]);

  return { hasPermission, loading };
}

export default useClubLeadPermission;
