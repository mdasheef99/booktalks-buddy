import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import MembersList from './MembersList';
import { Member } from './types';

interface AddModeratorDialogProps {
  open: boolean;
  members: Member[];
  filteredMembers: Member[];
  searchQuery: string;
  processingAction: boolean;
  onOpenChange: (open: boolean) => void;
  onSearchChange: (query: string) => void;
  onAppointModerator: (memberId: string) => Promise<void>;
}

/**
 * Dialog for adding a new moderator
 */
const AddModeratorDialog: React.FC<AddModeratorDialogProps> = ({
  open,
  members,
  filteredMembers,
  searchQuery,
  processingAction,
  onOpenChange,
  onSearchChange,
  onAppointModerator,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Appoint Moderator</DialogTitle>
          <DialogDescription>
            Select a club member to appoint as a moderator.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4">
          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search members..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          <MembersList
            members={filteredMembers}
            processingAction={processingAction}
            onAppointModerator={onAppointModerator}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddModeratorDialog;
