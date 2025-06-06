import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Reply } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/integrations/supabase/types';
import { supabase } from '@/lib/supabase';
import { getDiscussionPosts, getClubTopics } from '@/lib/api';
import UserName from '@/components/common/UserName';
import UserAvatar from '@/components/common/UserAvatar';
import { ReportButton } from '@/components/reporting/ReportButton';

type DiscussionTopic = Database['public']['Tables']['discussion_topics']['Row'];
type DiscussionPost = Database['public']['Tables']['discussion_posts']['Row'];

interface DiscussionListProps {
  clubId: string;
  topicId?: string;
}

export const DiscussionList: React.FC<DiscussionListProps> = ({ clubId, topicId }) => {
  const [topics, setTopics] = React.useState<DiscussionTopic[]>([]);
  const [posts, setPosts] = React.useState<DiscussionPost[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    const fetchDiscussions = async () => {
      try {
        if (topicId) {
          // Fetch posts for a specific topic
          const postsData = await getDiscussionPosts(topicId);
          setPosts(postsData || []);
        } else {
          // Fetch all topics for the club
          const topicsData = await getClubTopics(user?.id || '', clubId);
          setTopics(topicsData || []);
        }
      } catch (error) {
        console.error('Error fetching discussions:', error);
        toast.error('Failed to load discussions');
      } finally {
        setLoading(false);
      }
    };

    fetchDiscussions();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('discussions_channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: topicId ? 'discussion_posts' : 'discussion_topics',
        filter: topicId
          ? `topic_id=eq.${topicId}`
          : `club_id=eq.${clubId}`
      }, () => {
        fetchDiscussions();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [clubId, topicId]);

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

  if (topicId) {
    // Render posts for a specific topic
    return (
      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id} className="p-4">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-gray-200 flex-shrink-0" />
              <div className="flex-grow">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <UserAvatar userId={post.user_id} size="sm" />
                      <p className="text-sm text-gray-600">
                        <UserName userId={post.user_id} linkToProfile displayFormat="full" /> • {new Date(post.created_at || '').toLocaleString()}
                      </p>
                    </div>
                    <div className="mt-2 text-gray-800">
                      {post.content}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {user?.id !== post.user_id && (
                      <ReportButton
                        targetType="discussion_post"
                        targetId={post.id}
                        targetUserId={post.user_id}
                        targetContent={post.content}
                        clubId={clubId}
                        variant="icon-only"
                      />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/book-club/${clubId}/discussions/${topicId}/reply/${post.id}`)}
                    >
                      <Reply className="h-4 w-4 mr-1" />
                      Reply
                    </Button>
                  </div>
                </div>
                {/* Render child posts (replies) */}
                {post.parent_post_id === null && (
                  <div className="ml-8 mt-4 space-y-4">
                    {posts
                      .filter(reply => reply.parent_post_id === post.id)
                      .map(reply => (
                        <Card key={reply.id} className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <UserAvatar userId={reply.user_id} size="sm" />
                                  <p className="text-sm text-gray-600">
                                    <UserName userId={reply.user_id} linkToProfile displayFormat="full" /> • {new Date(reply.created_at || '').toLocaleString()}
                                  </p>
                                </div>
                                {user?.id !== reply.user_id && (
                                  <ReportButton
                                    targetType="discussion_post"
                                    targetId={reply.id}
                                    targetUserId={reply.user_id}
                                    targetContent={reply.content}
                                    clubId={clubId}
                                    variant="icon-only"
                                  />
                                )}
                              </div>
                              <div className="mt-2 text-gray-800">
                                {reply.content}
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // Render topics list
  return (
    <div className="space-y-4">
      {topics.map((topic) => (
        <Card
          key={topic.id}
          className="p-4 hover:bg-gray-50 cursor-pointer"
          onClick={() => navigate(`/book-club/${clubId}/discussions/${topic.id}`)}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{topic.title}</h3>
              <p className="text-sm text-gray-600">
                Started by <UserName userId={topic.user_id} linkToProfile displayFormat="full" /> • {new Date(topic.created_at || '').toLocaleString()}
              </p>
            </div>
            <MessageSquare className="h-5 w-5 text-gray-400" />
          </div>
        </Card>
      ))}
      {topics.length === 0 && (
        <p className="text-center text-gray-600">No discussions yet</p>
      )}
    </div>
  );
};

export default DiscussionList;