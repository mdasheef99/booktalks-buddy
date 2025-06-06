import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Post } from './types';

interface PostsTableProps {
  posts: Post[];
  processingAction: boolean;
  onDeletePost: (postId: string) => void;
}

/**
 * Table component for displaying and managing discussion posts
 */
const PostsTable: React.FC<PostsTableProps> = ({
  posts,
  processingAction,
  onDeletePost,
}) => {
  if (posts.length === 0) {
    return (
      <div className="text-center p-8 border rounded-md">
        <p className="text-gray-500">No posts found</p>
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Content</TableHead>
            <TableHead>Posted By</TableHead>
            <TableHead>Posted On</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.map((post) => (
            <TableRow key={post.id}>
              <TableCell className="max-w-[300px]">
                <div className="truncate">{post.content}</div>
              </TableCell>
              <TableCell>
                {post.creator?.display_name || post.creator?.username || 'Unknown User'}
              </TableCell>
              <TableCell>
                {new Date(post.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDeletePost(post.id)}
                  disabled={processingAction}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default PostsTable;
