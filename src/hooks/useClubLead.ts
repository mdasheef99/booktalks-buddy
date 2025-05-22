/**
 * Custom hook for checking if a user is the lead of a club
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { isClubLead } from '@/lib/api/bookclubs/permissions';

/**
 * Hook to check if the current user is the lead of a club
 * 
 * @param clubId The ID of the club to check
 * @returns An object containing the result and loading state
 */
export function useClubLead(clubId: string) {
  const { user } = useAuth();
  const [isLead, setIsLead] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function checkClubLead() {
      if (!user?.id || !clubId) {
        if (isMounted) {
          setIsLead(false);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        const result = await isClubLead(user.id, clubId);
        
        if (isMounted) {
          setIsLead(result);
        }
      } catch (error) {
        console.error('Error checking club lead status:', error);
        if (isMounted) {
          setIsLead(false);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    checkClubLead();

    return () => {
      isMounted = false;
    };
  }, [user?.id, clubId]);

  return { isLead, loading };
}

export default useClubLead;
