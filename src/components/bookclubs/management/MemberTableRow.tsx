/**
 * Individual member table row component
 * Displays member information and actions
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import { UserX } from 'lucide-react';
import type { MemberTableRowProps } from './types';

export default function MemberTableRow({
  member,
  processingAction,
  currentUserId,
  onRemove
}: MemberTableRowProps) {
  
  const displayName = member.user?.display_name || member.user?.username || 'Unknown User';
  const joinedDate = new Date(member.joined_at).toLocaleDateString();
  const isCurrentUser = member.user_id === currentUserId;
  const isAdmin = member.role === 'admin';

  return (
    <TableRow key={member.user_id}>
      <TableCell className="font-medium">
        {displayName}
      </TableCell>
      <TableCell>
        <Badge variant={isAdmin ? 'default' : 'outline'}>
          {isAdmin ? 'Admin' : 'Member'}
        </Badge>
      </TableCell>
      <TableCell>
        {joinedDate}
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onRemove(member.user_id)}
          disabled={processingAction || isCurrentUser}
          title={isCurrentUser ? 'Cannot remove yourself' : 'Remove member'}
        >
          <UserX className="h-4 w-4 mr-1" />
          Remove
        </Button>
      </TableCell>
    </TableRow>
  );
}
