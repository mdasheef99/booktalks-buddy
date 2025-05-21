import React from 'react';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Member } from './types';
import EmptyState from '../shared/EmptyState';

interface MembersListProps {
  members: Member[];
  processingAction: boolean;
  onAppointModerator: (memberId: string) => void;
}

/**
 * Component for displaying members that can be appointed as moderators
 */
const MembersList: React.FC<MembersListProps> = ({
  members,
  processingAction,
  onAppointModerator,
}) => {
  if (members.length === 0) {
    return (
      <EmptyState
        title="No eligible members found"
        description="All current members are already moderators or you've filtered out all results. Try clearing your search or invite more members to the club."
        icon={Users}
        variant="info"
      />
    );
  }

  return (
    <div className="border rounded-md max-h-[300px] overflow-y-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.user_id}>
              <TableCell className="font-medium">
                {member.user?.display_name || member.user?.username || 'Unknown User'}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  size="sm"
                  onClick={() => onAppointModerator(member.user_id)}
                  disabled={processingAction}
                >
                  Appoint
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default MembersList;
