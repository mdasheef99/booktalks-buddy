import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Database } from '@/integrations/supabase/types';
import {
  getClubDetails,
  getClubMembers,
  getCurrentBook,
  getClubTopics
} from '@/lib/api';
import { useCanManageClub, useCanModerateClub } from '@/lib/entitlements/hooks';

type BookClub = Database['public']['Tables']['book_clubs']['Row'];
type ClubMember = Database['public']['Tables']['club_members']['Row'];
type CurrentBook = Database['public']['Tables']['current_books']['Row'];
type DiscussionTopic = Database['public']['Tables']['discussion_topics']['Row'];

export const useClubDetails = (clubId: string | undefined) => {
  const [club, setClub] = useState<BookClub | null>(null);
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [currentBook, setCurrentBook] = useState<CurrentBook | null>(null);
  const [topics, setTopics] = useState<DiscussionTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [userStatus, setUserStatus] = useState<string>('not-member'); // 'not-member', 'pending', 'member', 'admin'
  const [storeId, setStoreId] = useState<string>('');
  const [storeIdLoading, setStoreIdLoading] = useState(true);
  const [storeIdError, setStoreIdError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch store ID for the club
  useEffect(() => {
    const fetchStoreId = async () => {
      if (!clubId) {
        setStoreIdLoading(false);
        return;
      }

      try {
        setStoreIdLoading(true);
        setStoreIdError(null);

        const { data: club, error } = await supabase
          .from('book_clubs')
          .select('store_id')
          .eq('id', clubId)
          .single();

        if (error) {
          console.error('Error fetching club store ID:', error);
          setStoreIdError('Failed to fetch store ID');
          setStoreId('');
        } else {
          setStoreId(club.store_id || '');
        }
      } catch (error) {
        console.error('Error fetching club store ID:', error);
        setStoreIdError('Failed to fetch store ID');
        setStoreId('');
      } finally {
        setStoreIdLoading(false);
      }
    };

    fetchStoreId();
  }, [clubId]);

  // Set up data fetching and real-time subscriptions
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!clubId) {
          console.error('No club ID provided');
          toast.error('Missing club ID');
          setLoading(false);
          return;
        }

        if (!user?.id) {
          console.error('User not authenticated');
          toast.error('Please log in to view club details');
          setLoading(false);
          return;
        }

        // Fetch club details
        try {
          const clubData = await getClubDetails(clubId);
          setClub(clubData);
        } catch (error) {
          console.error('Error fetching club details:', error);
          toast.error('Failed to load club details');
          setLoading(false);
          return;
        }

        // Fetch members
        try {
          const memberData = await getClubMembers(clubId);
          setMembers(memberData);

          // Check user's status in the club
          const userMember = memberData.find(m => m.user_id === user?.id);
          if (userMember) {
            setUserStatus(userMember.role);
          } else {
            setUserStatus('not-member');
          }

          // Fetch discussion topics if user is a member
          if (userMember && (userMember.role === 'member' || userMember.role === 'admin')) {
            try {
              const topicData = await getClubTopics(user.id, clubId);
              setTopics(topicData);
            } catch (error) {
              console.error('Error fetching topics:', error);
              toast.error('Failed to load discussion topics');
              setTopics([]);
            }
          }
        } catch (error) {
          console.error('Error fetching members:', error);
          toast.error('Failed to load members');
          setMembers([]);
        }

        // Fetch current book
        try {
          const bookData = await getCurrentBook(clubId);
          setCurrentBook(bookData);
        } catch (error) {
          console.error('Error fetching current book:', error);
          setCurrentBook(null);
        }
      } catch (error) {
        console.error('Unexpected error in fetchClubDetails:', error);
        toast.error('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Only set up subscription if we have a clubId
    if (clubId) {
      // Subscribe to real-time changes
      const subscription = supabase
        .channel('club_details_channel')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'book_clubs',
          filter: `id=eq.${clubId}`
        }, () => {
          fetchData();
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'current_books',
          filter: `club_id=eq.${clubId}`
        }, () => {
          fetchData();
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'club_members',
          filter: `club_id=eq.${clubId}`
        }, () => {
          fetchData();
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'club_meetings',
          filter: `club_id=eq.${clubId}`
        }, () => {
          fetchData();
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [clubId, user?.id]);

  // Check if the user can manage or moderate this club using entitlements
  // Wait for store ID to be loaded before checking permissions
  const { result: canManage, loading: loadingManagePermission } = useCanManageClub(
    clubId || '',
    storeId
  );
  const { result: canModerate, loading: loadingModeratePermission } = useCanModerateClub(
    clubId || '',
    storeId
  );

  // Helper functions for status checks
  const isMember = userStatus === 'member' || userStatus === 'admin';
  const isPending = userStatus === 'pending';

  // Legacy admin check - will be replaced by entitlements
  const isAdmin = userStatus === 'admin';

  // New entitlements-based checks
  // Only return true if store ID is loaded and permissions are available
  const canManageClub = !storeIdLoading && !loadingManagePermission && canManage;
  const canModerateClub = !storeIdLoading && !loadingModeratePermission && canModerate;

  // Create a function to expose for external use
  const refreshClubDetails = async () => {
    setLoading(true);
    try {
      if (!clubId || !user?.id) return;

      // Fetch club details
      const clubData = await getClubDetails(clubId);
      setClub(clubData);

      // Fetch members
      const memberData = await getClubMembers(clubId);
      setMembers(memberData);

      // Check user's status in the club
      const userMember = memberData.find(m => m.user_id === user?.id);
      if (userMember) {
        setUserStatus(userMember.role);
      } else {
        setUserStatus('not-member');
      }

      // Fetch current book
      const bookData = await getCurrentBook(clubId);
      setCurrentBook(bookData);

      // Fetch discussion topics if user is a member
      if (userMember && (userMember.role === 'member' || userMember.role === 'admin')) {
        const topicData = await getClubTopics(user.id, clubId);
        setTopics(topicData);
      }
    } catch (error) {
      console.error('Error refreshing club details:', error);
      toast.error('Failed to refresh club details');
    } finally {
      setLoading(false);
    }
  };

  return {
    club,
    members,
    currentBook,
    topics,
    loading,
    userStatus,
    isMember,
    isPending,
    isAdmin,
    // New entitlements-based properties
    canManageClub,
    canModerateClub,
    // Store ID related properties
    storeId,
    storeIdLoading,
    storeIdError,
    fetchClubDetails: refreshClubDetails
  };
};

export default useClubDetails;
