import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { addDiscussionTopic, createPost } from '@/lib/api';

const CreateTopicForm: React.FC = () => {
  const { clubId } = useParams<{ clubId: string }>();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter a topic title');
      return;
    }

    if (!clubId || !user?.id) {
      toast.error('Missing required information');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create the topic
      const topicData = await addDiscussionTopic(user.id, clubId, title.trim());

      // Step 2: Create the initial post if content is provided
      if (content.trim()) {
        await createPost(user.id, topicData.id, content.trim());
      }

      toast.success('Discussion topic created successfully');

      // Step 3: Redirect to the new topic page
      navigate(`/book-club/${clubId}/discussions/${topicData.id}`, {
        state: { fromNewTopic: true }
      });
    } catch (error) {
      console.error('Error creating topic:', error);
      toast.error('Failed to create topic');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Button
        variant="ghost"
        onClick={() => navigate(`/book-club/${clubId}/discussions`, {
          state: { fromNewTopic: true }
        })}
        className="mb-4 flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Discussions
      </Button>

      <h1 className="text-2xl font-bold mb-6">Create New Discussion Topic</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            Topic Title
          </label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a title for your discussion topic"
            required
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium mb-1">
            Initial Post Content
          </label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start the discussion with your first post"
            rows={5}
          />
          <p className="text-xs text-gray-500 mt-1">
            Adding content will create your first post in this topic. If left empty, you'll be redirected to the topic to add your first post.
          </p>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/book-club/${clubId}/discussions`, {
              state: { fromNewTopic: true }
            })}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Topic'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateTopicForm;
