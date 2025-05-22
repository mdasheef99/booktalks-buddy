/**
 * Custom hook for checking if a user has permission to moderate content in a club
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { isClubLead } from '@/lib/api/bookclubs/permissions';

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

        // Check if user is the club lead
        const isLead = await isClubLead(user.id, clubId);

        if (isLead) {
          if (isMounted) {
            setHasPermission(true);
            setLoading(false);
          }
          return;
        }

        // Check if user is a moderator
        try {
          const { data: moderator, error: moderatorError } = await supabase
            .from('club_moderators')
            .select('user_id')
            .eq('club_id', clubId)
            .eq('user_id', user.id)
            .single();

          if (!moderatorError && moderator) {
            if (isMounted) {
              setHasPermission(true);
              setLoading(false);
            }
            return;
          }
        } catch (error) {
          console.error('Error checking moderator status:', error);
          // Continue to next check rather than failing completely
        }

        // Check if user is a store admin
        try {
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

          try {
            const { data: storeAdmin, error: storeAdminError } = await supabase
              .from('store_administrators')
              .select('user_id')
              .eq('store_id', club.store_id)
              .eq('user_id', user.id)
              .single();

            if (!storeAdminError && storeAdmin) {
              if (isMounted) {
                setHasPermission(true);
                setLoading(false);
              }
              return;
            }
          } catch (error) {
            console.error('Error checking store admin status:', error);
            // Continue to final permission check
          }

          if (isMounted) {
            setHasPermission(false);
          }
        } catch (error) {
          console.error('Error in store admin permission check:', error);
          if (isMounted) {
            setHasPermission(false);
          }
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
