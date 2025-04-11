import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageSquare, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import BookConnectHeader from '@/components/BookConnectHeader';
import { getClubTopics } from '@/lib/api';
import { DiscussionList } from '@/components/discussions/DiscussionList';

interface DiscussionTopic {
  id: string;
  title: string;
  club_id: string;
  user_id: string;
  created_at: string;
}

const BookClubDiscussionsPage: React.FC = () => {
  const { clubId } = useParams<{ clubId: string }>();
  const [topics, setTopics] = React.useState<DiscussionTopic[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    const fetchTopics = async () => {
      if (!clubId || !user?.id) return;

      try {
        setLoading(true);
        const topicsData = await getClubTopics(user.id, clubId);
        console.log('Fetched topics:', topicsData);
        setTopics(topicsData);
      } catch (error) {
        console.error('Error fetching topics:', error);
        toast.error('Failed to load discussion topics');
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, [clubId, user?.id]);

  if (!user) {
    return (
      <div className="min-h-screen bg-bookconnect-cream flex items-center justify-center">
        <div className="text-center p-8 bg-white/80 rounded-lg shadow-lg border border-bookconnect-brown/20">
          <p className="font-serif text-bookconnect-brown mb-4">Please log in to view discussions</p>
          <Button 
            onClick={() => navigate('/login')}
            className="bg-bookconnect-brown text-white hover:bg-bookconnect-brown/90"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bookconnect-cream">
      <BookConnectHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate(`/book-club/${clubId}`)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Book Club
            </Button>
            
            <Button 
              onClick={() => navigate(`/book-club/${clubId}/discussions/new`)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Topic
            </Button>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2 mb-4">
              <MessageSquare className="h-6 w-6 text-bookconnect-terracotta" />
              Discussion Topics
            </h1>
            
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : topics.length > 0 ? (
              <DiscussionList clubId={clubId || ''} />
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-600 mb-4">No discussion topics yet</p>
                <Button 
                  onClick={() => navigate(`/book-club/${clubId}/discussions/new`)}
                >
                  Start a New Topic
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookClubDiscussionsPage;
