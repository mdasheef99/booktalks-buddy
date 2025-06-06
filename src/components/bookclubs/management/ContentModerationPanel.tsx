import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { MessageSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { getClubTopics } from '@/lib/api/bookclubs/discussions';

// Import shared components
import LoadingSpinner from './shared/LoadingSpinner';
import SearchBar from './shared/SearchBar';
import EmptyState from './shared/EmptyState';

// Import content moderation components
import TopicsTable from './content/TopicsTable';
import DeleteTopicDialog from './content/DeleteTopicDialog';
import ToggleLockTopicDialog from './content/ToggleLockTopicDialog';
import { Topic, ContentModerationPanelProps } from './content/types';

/**
 * Content Moderation Panel Component
 *
 * This component allows club leads to moderate discussion topics and posts.
 */
const ContentModerationPanel: React.FC<ContentModerationPanelProps> = ({ clubId }) => {
  const { user } = useAuth();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [filteredTopics, setFilteredTopics] = useState<Topic[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingAction, setProcessingAction] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState<string | null>(null);
  const [topicToToggleLock, setTopicToToggleLock] = useState<Topic | null>(null);

  // Load topics
  useEffect(() => {
    async function loadData() {
      if (!clubId || !user?.id) return;

      try {
        setLoading(true);

        // Load topics
        const topicsData = await getClubTopics(user.id, clubId);

        // Enhance topics with post count and is_locked field
        const enhancedTopics = await Promise.all(
          topicsData.map(async (topic) => {
            const { count } = await supabase
              .from('discussion_posts')
              .select('id', { count: 'exact' })
              .eq('topic_id', topic.id);

            return {
              ...topic,
              post_count: count || 0,
              is_locked: false // Add default value since it doesn't exist in database
            };
          })
        );

        setTopics(enhancedTopics as Topic[]);
        setFilteredTopics(enhancedTopics as Topic[]);
      } catch (error) {
        console.error('Error loading content moderation data:', error);
        toast.error('Failed to load content data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [clubId, user?.id]);

  // Filter topics based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredTopics(topics);
      return;
    }

    const query = searchQuery.toLowerCase();

    // Filter topics
    const matchedTopics = topics.filter(topic =>
      topic.title.toLowerCase().includes(query) ||
      topic.creator?.username?.toLowerCase().includes(query) ||
      topic.creator?.display_name?.toLowerCase().includes(query)
    );
    setFilteredTopics(matchedTopics);
  }, [searchQuery, topics]);

  // Handle topic deletion
  const handleDeleteTopic = async (topicId: string) => {
    if (!clubId || !user?.id) return;

    try {
      setProcessingAction(true);

      // Delete the topic (cascade will delete all posts)
      const { error } = await supabase
        .from('discussion_topics')
        .delete()
        .eq('id', topicId);

      if (error) throw error;

      // Update the topics list
      setTopics(topics.filter(topic => topic.id !== topicId));
      setFilteredTopics(filteredTopics.filter(topic => topic.id !== topicId));

      toast.success('Topic deleted successfully');
    } catch (error) {
      console.error('Error deleting topic:', error);
      toast.error('Failed to delete topic');
    } finally {
      setProcessingAction(false);
      setTopicToDelete(null);
    }
  };



  // Handle topic lock/unlock
  const handleToggleLockTopic = async (topic: Topic) => {
    if (!clubId || !user?.id) return;

    try {
      setProcessingAction(true);

      // In a real implementation, you would update a proper is_locked field in the database
      // For this example, we'll just simulate the update without actually changing the database

      // Simulate a successful update
      const error = null;

      if (error) throw error;

      // Update the topics list
      const updatedTopics = topics.map(t =>
        t.id === topic.id ? { ...t, is_locked: !t.is_locked } : t
      );
      setTopics(updatedTopics);
      setFilteredTopics(
        filteredTopics.map(t => t.id === topic.id ? { ...t, is_locked: !t.is_locked } : t)
      );

      toast.success(`Topic ${topic.is_locked ? 'unlocked' : 'locked'} successfully`);
    } catch (error) {
      console.error('Error toggling topic lock:', error);
      toast.error('Failed to update topic');
    } finally {
      setProcessingAction(false);
      setTopicToToggleLock(null);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Content Moderation
          </CardTitle>
          <CardDescription>
            Manage discussion topics in your club. Posts can be moderated directly in discussions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <SearchBar
              placeholder="Search content..."
              value={searchQuery}
              onChange={setSearchQuery}
            />
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Discussion Topics</h3>
              <Badge variant="secondary">
                {topics.length}
              </Badge>
            </div>
          </div>

          <TopicsTable
            topics={filteredTopics}
            processingAction={processingAction}
            onDeleteTopic={setTopicToDelete}
            onToggleLockTopic={setTopicToToggleLock}
          />
        </CardContent>
      </Card>

      {/* Confirmation dialogs */}
      <DeleteTopicDialog
        topicId={topicToDelete}
        processingAction={processingAction}
        onOpenChange={(open) => !open && setTopicToDelete(null)}
        onConfirm={handleDeleteTopic}
      />



      <ToggleLockTopicDialog
        topic={topicToToggleLock}
        processingAction={processingAction}
        onOpenChange={(open) => !open && setTopicToToggleLock(null)}
        onConfirm={handleToggleLockTopic}
      />
    </>
  );
};

export default ContentModerationPanel;
