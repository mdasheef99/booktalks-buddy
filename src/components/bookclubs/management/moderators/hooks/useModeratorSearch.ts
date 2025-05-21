import { useState, useEffect } from 'react';
import { Member } from '../types';

/**
 * Hook for searching and filtering members
 * 
 * This hook handles filtering members based on a search query.
 */
export function useModeratorSearch(members: Member[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMembers, setFilteredMembers] = useState<Member[]>(members);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredMembers(members);
      return;
    }

    const query = searchQuery.toLowerCase();
    
    const matchedMembers = members.filter(member =>
      member.user?.username?.toLowerCase().includes(query) ||
      member.user?.email?.toLowerCase().includes(query) ||
      member.user?.display_name?.toLowerCase().includes(query)
    );
    
    setFilteredMembers(matchedMembers);
  }, [searchQuery, members]);

  return {
    searchQuery,
    setSearchQuery,
    filteredMembers
  };
}

export default useModeratorSearch;
