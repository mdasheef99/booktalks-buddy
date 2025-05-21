import React from 'react';
import { UserMinus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Moderator } from './types';

interface ModeratorsTableProps {
  moderators: Moderator[];
  currentUserId: string | undefined;
  processingAction: boolean;
  onRemoveModerator: (moderatorId: string) => void;
}

/**
 * Table component for displaying and managing moderators
 */
const ModeratorsTable: React.FC<ModeratorsTableProps> = ({
  moderators,
  currentUserId,
  processingAction,
  onRemoveModerator,
}) => {
  if (moderators.length === 0) {
    return null;
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Moderator</TableHead>
            <TableHead>Appointed By</TableHead>
            <TableHead>Appointed On</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {moderators.map((moderator) => (
            <TableRow key={moderator.user_id}>
              <TableCell className="font-medium">
                {moderator.user?.display_name || moderator.user?.username || 'Unknown User'}
              </TableCell>
              <TableCell>
                {moderator.assigned_by_user_id === currentUserId ? 'You' : 'Another Admin'}
              </TableCell>
              <TableCell>
                {new Date(moderator.assigned_at).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onRemoveModerator(moderator.user_id)}
                  disabled={processingAction}
                >
                  <UserMinus className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ModeratorsTable;
