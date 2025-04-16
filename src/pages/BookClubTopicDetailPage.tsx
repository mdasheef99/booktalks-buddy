import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, MessageSquare, Reply } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import BookConnectHeader from '@/components/BookConnectHeader';
import { supabase } from '@/lib/supabase';
import { getDiscussionPosts } from '@/lib/api';
import { DiscussionInput } from '@/components/discussions/DiscussionInput';

interface Post {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  parent_post_id: string | null;
}

interface Topic {
  id: string;
  title: string;
  club_id: string;
  user_id: string;
  created_at: string;
}

const BookClubTopicDetailPage: React.FC = () => {
  const { clubId, topicId } = useParams<{ clubId: string; topicId: string }>();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchTopicAndPosts = async () => {
    if (!topicId) {
      console.error('No topic ID provided');
      toast.error('Missing topic ID');
      setLoading(false);
      return;
    }

    if (!clubId) {
      console.error('No club ID provided');
      toast.error('Missing club ID');
      setLoading(false);
      return;
    }

    console.log(`Fetching details for topic ${topicId} in club ${clubId}`);

    try {
      // Fetch topic details
      const { data: topicData, error: topicError } = await supabase
        .from('discussion_topics')
        .select('*')
        .eq('id', topicId)
        .single();

      if (topicError) {
        console.error('Error fetching topic:', topicError);
        toast.error('Failed to load topic details');
        setLoading(false);
        return;
      }

      console.log('Topic details:', topicData);
      setTopic(topicData);

      // Fetch posts for this topic
      const postsData = await getDiscussionPosts(topicId);
      console.log('Posts:', postsData);
      setPosts(postsData);
    } catch (error) {
      console.error('Error fetching topic details:', error);
      toast.error('Failed to load discussion');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopicAndPosts();

    // Only set up subscription if we have a topicId
    if (topicId) {
      console.log('Setting up real-time subscription for topic:', topicId);

      // Subscribe to real-time updates for posts
      const subscription = supabase
        .channel('topic_detail_channel')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'discussion_posts',
          filter: `topic_id=eq.${topicId}`
        }, () => {
          fetchTopicAndPosts();
        })
        .subscribe();

      return () => {
        console.log('Unsubscribing from topic_detail_channel');
        subscription.unsubscribe();
      };
    }
  }, [topicId, clubId]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-bookconnect-cream">
        <BookConnectHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 w-64 bg-gray-200 rounded"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="min-h-screen bg-bookconnect-cream">
        <BookConnectHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-xl mb-4">Topic not found</p>
            <Button
              onClick={() => navigate(`/book-club/${clubId}`)}
            >
              Return to Book Club
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bookconnect-cream">
      <BookConnectHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => {
              // Navigate back to discussions with state to preserve scroll position
              navigate(`/book-club/${clubId}/discussions`, {
                state: { fromTopic: true }
              });
            }}
            className="mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Discussions
          </Button>

          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h1 className="text-2xl font-bold mb-2">{topic.title}</h1>
            <p className="text-sm text-gray-500 mb-4">
              Started by {topic.user_id} • {new Date(topic.created_at).toLocaleString()}
            </p>
          </div>

          <div className="space-y-4 mb-8">
            {posts.length > 0 ? (
              posts.map((post) => (
                <Card key={post.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="w-full">
                      <div className="flex justify-between w-full">
                        <p className="text-sm text-gray-500">
                          {post.user_id} • {new Date(post.created_at).toLocaleString()}
                        </p>
                        {!post.parent_post_id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setReplyingTo(replyingTo === post.id ? null : post.id)}
                          >
                            <Reply className="h-4 w-4 mr-1" />
                            Reply
                          </Button>
                        )}
                      </div>
                      <p className="mt-2">{post.content}</p>

                      {/* Show reply form if replying to this post */}
                      {replyingTo === post.id && (
                        <div className="mt-4 ml-8">
                          <DiscussionInput
                            clubId={clubId || ''}
                            topicId={topicId}
                            parentPostId={post.id}
                            onSuccess={() => {
                              setReplyingTo(null);
                              fetchTopicAndPosts();
                            }}
                          />
                        </div>
                      )}

                      {/* Show replies to this post */}
                      {post.parent_post_id === null && (
                        <div className="ml-8 mt-4 space-y-4">
                          {posts
                            .filter(reply => reply.parent_post_id === post.id)
                            .map(reply => (
                              <Card key={reply.id} className="p-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="text-sm text-gray-500">
                                      {reply.user_id} • {new Date(reply.created_at).toLocaleString()}
                                    </p>
                                    <p className="mt-2">{reply.content}</p>
                                  </div>
                                </div>
                              </Card>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">No posts in this topic yet</p>
            )}
          </div>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Add Your Reply
            </h2>
            <DiscussionInput
              clubId={clubId || ''}
              topicId={topicId}
              onSuccess={fetchTopicAndPosts}
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BookClubTopicDetailPage;
