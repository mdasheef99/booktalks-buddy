import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

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

const TopicDetail: React.FC = () => {
  const { clubId, topicId } = useParams<{ clubId: string; topicId: string }>();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
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
        const { data: postsData, error: postsError } = await supabase
          .from('discussion_posts')
          .select('*')
          .eq('topic_id', topicId)
          .order('created_at', { ascending: true });

        if (postsError) {
          console.error('Error fetching posts:', postsError);
          toast.error('Failed to load discussion posts');
          setPosts([]);
        } else {
          console.log('Posts:', postsData);
          setPosts(postsData || []);
        }
      } catch (error) {
        console.error('Unexpected error in fetchTopicAndPosts:', error);
        toast.error('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

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
        }, (payload) => {
          console.log('Discussion post changed:', payload);
          fetchTopicAndPosts();
        })
        .subscribe();

      return () => {
        console.log('Unsubscribing from topic_detail_channel');
        subscription.unsubscribe();
      };
    }
  }, [topicId, clubId]);

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

  if (!topic) {
    return (
      <div className="text-center p-8">
        <p>Topic not found</p>
        <Button
          onClick={() => navigate(`/book-club/${clubId}`)}
          className="mt-4"
        >
          Return to Book Club
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Button
        variant="ghost"
        onClick={() => navigate(`/book-club/${clubId}`)}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Book Club
      </Button>

      <h1 className="text-2xl font-bold mb-6">{topic.title}</h1>

      <div className="space-y-4 mb-8">
        {posts.length > 0 ? (
          posts.map((post) => (
            <Card key={post.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">
                    User: {post.user_id}
                  </p>
                  <p className="mt-2">{post.content}</p>
                </div>
                <p className="text-xs text-gray-400">
                  {new Date(post.created_at).toLocaleString()}
                </p>
              </div>
            </Card>
          ))
        ) : (
          <p className="text-center text-gray-500">No posts in this topic yet</p>
        )}
      </div>

      <div className="text-center">
        <Button onClick={() => navigate(`/book-club/${clubId}/discussions/${topicId}/reply`)}>
          Reply to Topic
        </Button>
      </div>
    </div>
  );
};

export default TopicDetail;
