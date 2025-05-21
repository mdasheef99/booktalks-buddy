import { useState, useEffect } from 'react';
import { getClubMembers } from '@/lib/api';
import { Member } from '../types';

/**
 * Hook for fetching eligible members for moderator appointment
 * 
 * This hook handles fetching club members and filtering out existing moderators.
 */
export function useEligibleMembers(
  clubId: string, 
  userId: string | undefined, 
  moderatorIds: string[]
) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMembers() {
      if (!clubId || !userId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Get all club members
        const membersData = await getClubMembers(clubId);
        
        // Filter out existing moderators and current user
        const eligibleMembers = membersData.filter(member => 
          !moderatorIds.includes(member.user_id) && member.user_id !== userId
        );
        
        setMembers(eligibleMembers);
      } catch (error) {
        console.error('Error loading eligible members:', error);
        setMembers([]);
      } finally {
        setLoading(false);
      }
    }
    
    loadMembers();
  }, [clubId, userId, moderatorIds]);

  return { members, loading };
}

export default useEligibleMembers;
