import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Book, Users, MessageSquare, Settings, LogOut, ArrowLeft, UserPlus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useLoadProfiles } from '@/contexts/UserProfileContext';
import { Database } from '@/integrations/supabase/types';
import { supabase } from '@/lib/supabase';
import UserAvatar from '@/components/common/UserAvatar';
import UserName from '@/components/common/UserName';
import ConfirmationDialog from '@/components/common/ConfirmationDialog';
import {
  getClubDetails,
  getClubMembers,
  getCurrentBook,
  getClubTopics,
  joinOrRequestClub,
  cancelJoinRequest
} from '@/lib/api';

type BookClub = Database['public']['Tables']['book_clubs']['Row'];
type ClubMember = Database['public']['Tables']['club_members']['Row'];
type CurrentBook = Database['public']['Tables']['current_books']['Row'];
type DiscussionTopic = Database['public']['Tables']['discussion_topics']['Row'];

interface BookClubDetailsWithJoinProps {}

export const BookClubDetailsWithJoin: React.FC<BookClubDetailsWithJoinProps> = () => {
  const { clubId } = useParams<{ clubId: string }>();
  const [club, setClub] = useState<BookClub | null>(null);
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [currentBook, setCurrentBook] = useState<CurrentBook | null>(null);
  const [topics, setTopics] = useState<DiscussionTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [userStatus, setUserStatus] = useState<string>('not-member'); // 'not-member', 'pending', 'member', 'admin'
  const [actionInProgress, setActionInProgress] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Load profiles for members
  useLoadProfiles(members, (member) => member.user_id);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("You've been successfully signed out");
      navigate('/login');
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    }
  };

  const handleLeaveClub = async () => {
    if (!clubId || !user?.id) return;

    setActionInProgress(true);
    try {
      // Call API to leave club
      const { error } = await supabase
        .from('club_members')
        .delete()
        .eq('user_id', user.id)
        .eq('club_id', clubId);

      if (error) throw error;

      toast.success('You have left the book club');
      navigate('/book-club');
    } catch (error) {
      console.error('Error leaving club:', error);
      toast.error('Failed to leave the club. Please try again.');
      setActionInProgress(false);
      setShowLeaveConfirm(false);
    }
  };

  const fetchClubDetails = async () => {
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

      console.log('Fetching details for club:', clubId);

      // Fetch club details
      try {
        const clubData = await getClubDetails(clubId);
        console.log('Club details:', clubData);
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
        console.log('Club members:', memberData);
        setMembers(memberData);

        // Check user's status in the club
        const userMember = memberData.find(m => m.user_id === user?.id);
        if (userMember) {
          setUserStatus(userMember.role);
        } else {
          setUserStatus('not-member');
        }
      } catch (error) {
        console.error('Error fetching members:', error);
        toast.error('Failed to load members');
        setMembers([]);
      }

      // Fetch current book
      try {
        const bookData = await getCurrentBook(clubId);
        console.log('Current book:', bookData);
        setCurrentBook(bookData);
      } catch (error) {
        console.error('Error fetching current book:', error);
        setCurrentBook(null);
      }

      // Fetch discussion topics if user is a member
      if (userStatus === 'member' || userStatus === 'admin') {
        try {
          const topicData = await getClubTopics(user.id, clubId);
          console.log('Discussion topics:', topicData);
          setTopics(topicData);
        } catch (error) {
          console.error('Error fetching topics:', error);
          toast.error('Failed to load discussion topics');
          setTopics([]);
        }
      }

    } catch (error) {
      console.error('Unexpected error in fetchClubDetails:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubDetails();

    // Only set up subscription if we have a clubId
    if (clubId) {
      console.log('Setting up real-time subscription for club:', clubId);

      // Subscribe to real-time changes
      const subscription = supabase
        .channel('club_details_channel')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'book_clubs',
          filter: `id=eq.${clubId}`
        }, () => {
          fetchClubDetails();
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'current_books',
          filter: `club_id=eq.${clubId}`
        }, () => {
          fetchClubDetails();
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'club_members',
          filter: `club_id=eq.${clubId}`
        }, () => {
          fetchClubDetails();
        })
        .subscribe();

      return () => {
        console.log('Unsubscribing from club_details_channel');
        subscription.unsubscribe();
      };
    }
  }, [clubId, user?.id]);

  const handleJoinClub = async () => {
    if (!clubId || !user?.id) return;

    setActionInProgress(true);
    try {
      const result = await joinOrRequestClub(user.id, clubId);
      toast.success(result.message);

      // Update user status based on club privacy
      if (club?.privacy === 'public') {
        setUserStatus('member');
      } else {
        setUserStatus('pending');
      }

      // Refresh club details
      fetchClubDetails();
    } catch (error) {
      console.error('Error joining club:', error);
      toast.error('Failed to join club. Please try again.');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!clubId || !user?.id) return;

    setActionInProgress(true);
    try {
      const result = await cancelJoinRequest(user.id, clubId);
      toast.success(result.message);
      setUserStatus('not-member');

      // Refresh club details
      fetchClubDetails();
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast.error('Failed to cancel request. Please try again.');
    } finally {
      setActionInProgress(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse">
          <div className="h-12 w-12 rounded-full bg-gray-300 mb-4"></div>
          <div className="h-4 w-32 bg-gray-300"></div>
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="text-center p-8">
        <p>Book club not found</p>
      </div>
    );
  }

  const isMember = userStatus === 'member' || userStatus === 'admin';
  const isPending = userStatus === 'pending';
  const isAdmin = userStatus === 'admin';

  return (
    <div>
      <Button
        variant="ghost"
        onClick={() => navigate('/book-club')}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Book Clubs
      </Button>

      {/* Navigation buttons - only show for members */}
      {isMember && (
        <div className="flex justify-center space-x-4 mb-4">
          <Button onClick={() => navigate(`/book-club/${clubId}/members`)}>
            Members Management
          </Button>
          {isAdmin && (
            <Button onClick={() => navigate(`/book-club/${clubId}/settings`)}>
              Club Settings
            </Button>
          )}
          {!isAdmin && (
            <Button
              variant="outline"
              onClick={() => setShowLeaveConfirm(true)}
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              Leave Club
            </Button>
          )}
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="bg-bookconnect-brown hover:bg-bookconnect-brown/80 text-white"
          >
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      )}

      <div className="space-y-8">
        {/* Club Header */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">{club.name}</h1>
              <p className="text-gray-600 mt-2">{club.description}</p>
              <div className="mt-2">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  club.privacy === 'private'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {club.privacy || 'public'}
                </span>
              </div>
            </div>

            {/* Join/Request buttons for non-members */}
            {!isMember && (
              <div>
                {isPending ? (
                  <Button
                    variant="outline"
                    onClick={handleCancelRequest}
                    disabled={actionInProgress}
                  >
                    {actionInProgress ? 'Cancelling...' : 'Cancel Request'}
                  </Button>
                ) : (
                  <Button
                    onClick={handleJoinClub}
                    disabled={actionInProgress}
                    className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {actionInProgress ? 'Processing...' : club.privacy === 'public' ? 'Join Club' : 'Request to Join'}
                  </Button>
                )}
              </div>
            )}

            {/* Admin settings button */}
            {isAdmin && (
              <Button
                variant="outline"
                onClick={() => navigate(`/book-club/${clubId}/settings`)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Manage Club
              </Button>
            )}
          </div>
        </div>

        {/* Current Book */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
            <Book className="h-5 w-5" />
            Current Book
          </h2>
          {currentBook ? (
            <div>
              <h3 className="font-medium">{currentBook.title}</h3>
              <p className="text-gray-600">by {currentBook.author}</p>
            </div>
          ) : (
            <p className="text-gray-600">No book currently selected</p>
          )}
        </Card>

        {/* Members */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
            <Users className="h-5 w-5" />
            Members ({members.length})
          </h2>
          <div className="space-y-3">
            {members.map((member) => (
              <div key={member.user_id} className="flex items-center gap-3">
                <UserAvatar userId={member.user_id} size="sm" />
                <div>
                  <UserName
                    userId={member.user_id}
                    linkToProfile
                    withRole={member.role}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Discussion Topics - Only show for members */}
        {isMember && (
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Discussions
              </h2>
              <Button onClick={() => navigate(`/book-club/${clubId}/discussions`)}>
                View Discussions
              </Button>
            </div>
            <div className="space-y-4">
              {topics.map((topic) => (
                <Card
                  key={topic.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/book-club/${clubId}/discussions/${topic.id}`)}
                >
                  <h3 className="font-medium">{topic.title}</h3>
                  <p className="text-sm text-gray-600">
                    Started {new Date(topic.created_at || '').toLocaleDateString()}
                  </p>
                </Card>
              ))}
              {topics.length === 0 && (
                <p className="text-gray-600">No discussions yet</p>
              )}
            </div>
          </Card>
        )}

        {/* Join message for non-members */}
        {!isMember && !isPending && (
          <Card className="p-6 text-center">
            <UserPlus className="h-12 w-12 mx-auto text-bookconnect-terracotta mb-4" />
            <h2 className="text-xl font-semibold mb-2">Join this Book Club</h2>
            <p className="text-gray-600 mb-4">
              Join this book club to participate in discussions and connect with other readers.
            </p>
            <Button
              onClick={handleJoinClub}
              disabled={actionInProgress}
              className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90"
            >
              {actionInProgress ? 'Processing...' : club.privacy === 'public' ? 'Join Club' : 'Request to Join'}
            </Button>
          </Card>
        )}

        {/* Pending message */}
        {isPending && (
          <Card className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Membership Pending</h2>
            <p className="text-gray-600 mb-4">
              Your request to join this club is pending approval from an admin.
            </p>
            <Button
              variant="outline"
              onClick={handleCancelRequest}
              disabled={actionInProgress}
            >
              {actionInProgress ? 'Cancelling...' : 'Cancel Request'}
            </Button>
          </Card>
        )}
      </div>

      {/* Leave Club Confirmation */}
      {showLeaveConfirm && (
        <ConfirmationDialog
          isOpen={showLeaveConfirm}
          onClose={() => setShowLeaveConfirm(false)}
          onConfirm={handleLeaveClub}
          title="Leave Book Club"
          description="Are you sure you want to leave this book club? You will lose access to all discussions and will need to rejoin or be invited back."
          confirmText="Leave Club"
          variant="destructive"
          isLoading={actionInProgress}
        />
      )}
    </div>
  );
};

export default BookClubDetailsWithJoin;
