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
  const { user } = useAuth();

  // The fetchClubDetails function is now defined at the end of the hook

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
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [clubId, user?.id]);

  // Get the store ID for the club
  // Note: In a real implementation, you would fetch this from the database or from the club object
  const storeId = '00000000-0000-0000-0000-000000000000'; // Default store ID

  // Check if the user can manage or moderate this club using entitlements
  const { result: canManage } = useCanManageClub(clubId || '', storeId);
  const { result: canModerate } = useCanModerateClub(clubId || '', storeId);

  // Helper functions for status checks
  const isMember = userStatus === 'member' || userStatus === 'admin';
  const isPending = userStatus === 'pending';

  // Legacy admin check - will be replaced by entitlements
  const isAdmin = userStatus === 'admin';

  // New entitlements-based checks
  const canManageClub = canManage;
  const canModerateClub = canModerate;

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
    fetchClubDetails: refreshClubDetails
  };
};

export default useClubDetails;
