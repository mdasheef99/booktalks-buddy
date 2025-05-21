import React from 'react';
import { Lock, Trash2, Unlock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Topic } from './types';
import EmptyState from '../shared/EmptyState';

interface TopicsTableProps {
  topics: Topic[];
  processingAction: boolean;
  onDeleteTopic: (topicId: string) => void;
  onToggleLockTopic: (topic: Topic) => void;
}

/**
 * Table component for displaying and managing discussion topics
 */
const TopicsTable: React.FC<TopicsTableProps> = ({
  topics,
  processingAction,
  onDeleteTopic,
  onToggleLockTopic,
}) => {
  if (topics.length === 0) {
    return (
      <EmptyState
        title="No discussion topics found"
        description="There are no discussion topics in this club yet. Topics will appear here once they are created."
        icon={FileText}
        actionLabel="Create a Topic"
        onAction={() => window.location.href = `/book-club/discussions/new`}
        variant="info"
      />
    );
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Topic</TableHead>
            <TableHead>Created By</TableHead>
            <TableHead>Posts</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {topics.map((topic) => (
            <TableRow key={topic.id}>
              <TableCell className="font-medium">
                {topic.title}
              </TableCell>
              <TableCell>
                {topic.creator?.display_name || topic.creator?.username || 'Unknown User'}
              </TableCell>
              <TableCell>{topic.post_count}</TableCell>
              <TableCell>
                <Badge variant={topic.is_locked ? 'destructive' : 'outline'}>
                  {topic.is_locked ? 'Locked' : 'Active'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant={topic.is_locked ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => onToggleLockTopic(topic)}
                    disabled={processingAction}
                  >
                    {topic.is_locked ? (
                      <>
                        <Unlock className="h-4 w-4 mr-1" />
                        Unlock
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-1" />
                        Lock
                      </>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDeleteTopic(topic.id)}
                    disabled={processingAction}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TopicsTable;
