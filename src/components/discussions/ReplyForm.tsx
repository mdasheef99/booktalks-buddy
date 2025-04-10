import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { createPost } from '@/lib/api';

const ReplyForm: React.FC = () => {
  const { clubId, topicId } = useParams<{ clubId: string; topicId: string }>();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast.error('Please enter a reply');
      return;
    }
    
    if (!clubId || !topicId || !user?.id) {
      toast.error('Missing required information');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('Posting reply to topic:', topicId);
      await createPost(user.id, topicId, content);
      toast.success('Reply posted successfully');
      navigate(`/book-club/${clubId}/discussions/${topicId}`);
    } catch (error) {
      console.error('Error posting reply:', error);
      toast.error('Failed to post reply');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Button
        variant="ghost"
        onClick={() => navigate(`/book-club/${clubId}/discussions/${topicId}`)}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Topic
      </Button>
      
      <h1 className="text-2xl font-bold mb-6">Reply to Topic</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="content" className="block text-sm font-medium mb-1">
            Your Reply
          </label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your reply here..."
            rows={6}
            required
          />
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/book-club/${clubId}/discussions/${topicId}`)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Posting...' : 'Post Reply'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ReplyForm;
