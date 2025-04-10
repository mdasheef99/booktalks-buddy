import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Send } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/integrations/supabase/types';
import { supabase } from '@/lib/supabase';
import { createTopic, createPost } from '@/lib/api';

type DiscussionTopic = Database['public']['Tables']['discussion_topics']['Row'];
type DiscussionPost = Database['public']['Tables']['discussion_posts']['Row'];

interface DiscussionInputProps {
  clubId: string;
  topicId?: string;
  parentPostId?: string;
  onSuccess?: () => void;
  mode?: 'topic' | 'reply';
}

export const DiscussionInput: React.FC<DiscussionInputProps> = ({ 
  clubId, 
  topicId, 
  parentPostId,
  onSuccess,
  mode = 'reply'
}) => {
  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      toast.error('Please log in to participate in discussions');
      return;
    }

    if (mode === 'topic' && !title.trim()) {
      toast.error('Please enter a topic title');
      return;
    }

    if (!content.trim()) {
      toast.error('Please enter some content');
      return;
    }

    setSubmitting(true);

    try {
      if (mode === 'topic') {
        // Create new topic
        const topicData = await createTopic(user.id, clubId, title.trim());

        // Create initial post in topic
        await createPost(user.id, topicData.id, content.trim());

        toast.success('Discussion topic created');
        navigate(`/bookclub/${clubId}/discussions/${topicData.id}`);
      } else {
        // Create reply post
        await createPost(user.id, topicId!, content.trim(), parentPostId);

        toast.success('Reply posted');
        setContent('');
        onSuccess?.();
      }
    } catch (error) {
      console.error('Error posting discussion:', error);
      toast.error('Failed to post discussion');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="p-4">
        <div className="space-y-4">
          {mode === 'topic' && (
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Topic Title
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter topic title"
                className="w-full"
              />
            </div>
          )}

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
              {mode === 'topic' ? 'Initial Post' : 'Your Reply'}
            </label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={mode === 'topic' ? 'Start the discussion...' : 'Write your reply...'}
              rows={4}
              className="w-full resize-none"
            />
          </div>

          <div className="flex justify-end">
            <Button 
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2"
            >
              {submitting ? (
                'Posting...'
              ) : (
                <>
                  {mode === 'topic' ? (
                    <>
                      <MessageSquare className="h-4 w-4" />
                      Create Topic
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Post Reply
                    </>
                  )}
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </form>
  );
};

export default DiscussionInput;