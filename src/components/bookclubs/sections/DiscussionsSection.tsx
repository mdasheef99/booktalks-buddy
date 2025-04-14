import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database } from '@/integrations/supabase/types';

type DiscussionTopic = Database['public']['Tables']['discussion_topics']['Row'];

interface DiscussionsSectionProps {
  topics: DiscussionTopic[];
  clubId: string;
}

const DiscussionsSection: React.FC<DiscussionsSectionProps> = ({ topics, clubId }) => {
  const navigate = useNavigate();

  return (
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
  );
};

export default DiscussionsSection;
