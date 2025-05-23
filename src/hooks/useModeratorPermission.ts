/**
 * Custom hook for checking if a user has permission to moderate content in a club
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { getUserEntitlements } from '@/lib/entitlements/cache';
import { canModerateClub } from '@/lib/entitlements/permissions';

/**
 * Hook to check if the current user has permission to moderate content in a club
 * This includes club leads, moderators, and store administrators
 *
 * @param clubId The ID of the club to check
 * @returns An object containing the permission status and loading state
 */
export function useModeratorPermission(clubId: string) {
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

        // Get user entitlements for consistent permission checking
        const entitlements = await getUserEntitlements(user.id);

        // Get club's store ID for contextual permission checking
        const { data: club, error: clubError } = await supabase
          .from('book_clubs')
          .select('store_id')
          .eq('id', clubId)
          .single();

        if (clubError) {
          console.error('Error fetching club store:', clubError);
          if (isMounted) {
            setHasPermission(false);
            setLoading(false);
          }
          return;
        }

        // Use entitlements-based moderation permission checking
        const canModerate = canModerateClub(entitlements, clubId, club.store_id);

        if (isMounted) {
          setHasPermission(canModerate);
        }
      } catch (error) {
        console.error('Error checking moderator permission:', error);
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

export default useModeratorPermission;
