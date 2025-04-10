import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Book, Users, MessageSquare, Settings } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/integrations/supabase/types';
import { supabase } from '@/lib/supabase';
import { getClubDetails, getClubMembers, getCurrentBook, getClubTopics } from '@/lib/api';

type BookClub = Database['public']['Tables']['book_clubs']['Row'];
type ClubMember = Database['public']['Tables']['club_members']['Row'];
type CurrentBook = Database['public']['Tables']['current_books']['Row'];
type DiscussionTopic = Database['public']['Tables']['discussion_topics']['Row'];

interface BookClubDetailsProps {}

export const BookClubDetails: React.FC<BookClubDetailsProps> = () => {
  const { clubId } = useParams<{ clubId: string }>();
  const [club, setClub] = React.useState<BookClub | null>(null);
  const [members, setMembers] = React.useState<ClubMember[]>([]);
  const [currentBook, setCurrentBook] = React.useState<CurrentBook | null>(null);
  const [topics, setTopics] = React.useState<DiscussionTopic[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
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

          // Check if user is admin
          const userMember = memberData.find(m => m.user_id === user?.id);
          const userIsAdmin = userMember?.role === 'admin';
          console.log(`User is ${userIsAdmin ? 'an admin' : 'not an admin'}`);
          setIsAdmin(userIsAdmin);
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

        // Fetch discussion topics
        try {
          const topicData = await getClubTopics(user.id, clubId);
          console.log('Discussion topics:', topicData);
          setTopics(topicData);
        } catch (error) {
          console.error('Error fetching topics:', error);
          toast.error('Failed to load discussion topics');
          setTopics([]);
        }

      } catch (error) {
        console.error('Unexpected error in fetchClubDetails:', error);
        toast.error('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

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
        }, (payload) => {
          console.log('Book club changed:', payload);
          fetchClubDetails();
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'current_books',
          filter: `club_id=eq.${clubId}`
        }, (payload) => {
          console.log('Current book changed:', payload);
          fetchClubDetails();
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'discussion_topics',
          filter: `club_id=eq.${clubId}`
        }, (payload) => {
          console.log('Discussion topics changed:', payload);
          fetchClubDetails();
        })
        .subscribe();

      return () => {
        console.log('Unsubscribing from club_details_channel');
        subscription.unsubscribe();
      };
    }
  }, [clubId, user?.id]);

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

  return (
    <div>
      <div className="flex justify-center space-x-4 mb-4">
        <Button onClick={() => navigate(`/book-club/${clubId}/discussions`)}>
          Discussions
        </Button>
        <Button onClick={() => navigate(`/book-club/${clubId}/members`)}>
          Members Management
        </Button>
        <Button onClick={() => navigate(`/book-club/${clubId}/settings`)}>
          Club Settings
        </Button>
      </div>
    <div className="space-y-8">
      {/* Club Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{club.name}</h1>
            <p className="text-gray-600 mt-2">{club.description}</p>
          </div>
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
        <div className="space-y-2">
          {members.map((member) => (
            <div key={member.user_id} className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gray-200" />
              <div>
                <p>{member.user_id}</p>
                <p className="text-sm text-gray-600">{member.role}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Discussion Topics */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Discussions
          </h2>
          <Button onClick={() => navigate(`/book-club/${clubId}/discussions/new`)}>
            New Topic
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
    </div>
    </div>
  );
};

export default BookClubDetails;