/**
 * Members tab component
 * Displays and manages club members
 */

import React from 'react';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import MemberTableRow from './MemberTableRow';
import type { MembersTabProps } from './types';

export default function MembersTab({
  members,
  loading,
  processingAction,
  currentUserId,
  onRemoveMember
}: MembersTabProps) {
  
  if (loading) {
    return (
      <div className="text-center p-8 border rounded-md">
        <p className="text-gray-500">Loading members...</p>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="text-center p-8 border rounded-md">
        <p className="text-gray-500">No members found</p>
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <MemberTableRow
              key={member.user_id}
              member={member}
              processingAction={processingAction}
              currentUserId={currentUserId}
              onRemove={onRemoveMember}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
