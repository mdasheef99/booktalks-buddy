import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { getDiscoverableClubs, joinOrRequestClub, cancelJoinRequest } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';

export interface BookClub {
  id: string;
  name: string;
  description: string | null;
  privacy: string | null;
  created_at: string;
  user_status: string;
  join_questions_enabled?: boolean;
  cover_photo_url?: string | null;
  cover_photo_thumbnail_url?: string | null;
  member_count?: number;
}

interface UseClubDiscoveryProps {
  userId: string | undefined;
  pageSize?: number;
}

interface ClubDiscoveryState {
  clubs: BookClub[];
  totalCount: number;
  currentPage: number;
  loading: boolean;
  error: Error | null;
  actionInProgress: string | null;
}

export function useClubDiscovery({ userId, pageSize = 10 }: UseClubDiscoveryProps) {
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [privacyFilter, setPrivacyFilter] = useState<'all' | 'public' | 'private'>('all');
  
  // Debounced search query to prevent excessive API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  
  // Main state using a more structured approach
  const [state, setState] = useState<ClubDiscoveryState>({
    clubs: [],
    totalCount: 0,
    currentPage: 1,
    loading: false,
    error: null,
    actionInProgress: null
  });

  // Memoized fetch function
  const fetchClubs = useCallback(async (page: number = 1) => {
    if (!userId) return;

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const offset = (page - 1) * pageSize;
      const { clubs: fetchedClubs, count } = await getDiscoverableClubs(userId, {
        limit: pageSize,
        offset,
        filter: privacyFilter,
        search: debouncedSearchQuery
      });

      setState(prev => ({
        ...prev,
        clubs: fetchedClubs,
        totalCount: count,
        currentPage: page,
        loading: false
      }));
    } catch (error) {
      console.error('Error fetching clubs:', error);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error : new Error('Failed to load book clubs') 
      }));
      toast.error('Failed to load book clubs');
    }
  }, [userId, pageSize, privacyFilter, debouncedSearchQuery]);

  // Handle join/request club
  const handleJoinClub = useCallback(async (clubId: string) => {
    if (!userId) {
      toast.error('Please log in to join a club');
      return;
    }

    setState(prev => ({ ...prev, actionInProgress: clubId }));
    
    try {
      const result = await joinOrRequestClub(userId, clubId);
      toast.success(result.message);

      // Update the local state to reflect the change
      setState(prev => ({
        ...prev,
        clubs: prev.clubs.map(club =>
          club.id === clubId
            ? { ...club, user_status: club.privacy === 'public' ? 'member' : 'pending' }
            : club
        ),
        actionInProgress: null
      }));
    } catch (error: any) {
      console.error('Error joining club:', error);
      toast.error(error.message || 'Failed to join club. Please try again.');
      setState(prev => ({ ...prev, actionInProgress: null }));
    }
  }, [userId]);

  // Handle cancel request
  const handleCancelRequest = useCallback(async (clubId: string) => {
    if (!userId) return;

    setState(prev => ({ ...prev, actionInProgress: clubId }));
    
    try {
      const result = await cancelJoinRequest(userId, clubId);
      toast.success(result.message);

      // Update the local state to reflect the change
      setState(prev => ({
        ...prev,
        clubs: prev.clubs.map(club =>
          club.id === clubId ? { ...club, user_status: 'not-member' } : club
        ),
        actionInProgress: null
      }));
    } catch (error: any) {
      console.error('Error cancelling request:', error);
      toast.error(error.message || 'Failed to cancel request. Please try again.');
      setState(prev => ({ ...prev, actionInProgress: null }));
    }
  }, [userId]);

  // Effect to fetch clubs when dependencies change
  useEffect(() => {
    if (userId) {
      fetchClubs(1);
    }
  }, [userId, fetchClubs]);

  return {
    ...state,
    searchQuery,
    setSearchQuery,
    privacyFilter,
    setPrivacyFilter,
    fetchClubs,
    handleJoinClub,
    handleCancelRequest,
    pageSize
  };
}
