/**
 * useMemberManagement Hook
 * Handles member CRUD operations and state management
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { removeMember } from '@/lib/api/bookclubs/members';
import { useAuth } from '@/contexts/AuthContext';
import type { Member } from '../types/memberManagement';

interface UseMemberManagementProps {
  clubId: string;
  members: Member[];
  onMembersUpdate: (newMembers: Member[]) => void;
  onRefreshData: () => Promise<void>;
}

interface UseMemberManagementReturn {
  processingAction: boolean;
  memberToRemove: string | null;
  handleRemoveMember: (memberId: string) => void;
  confirmRemoveMember: (memberId: string) => Promise<void>;
  cancelRemoveMember: () => void;
}

export function useMemberManagement({
  clubId,
  members,
  onMembersUpdate,
  onRefreshData
}: UseMemberManagementProps): UseMemberManagementReturn {
  const { user } = useAuth();
  const [processingAction, setProcessingAction] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);

  const handleRemoveMember = (memberId: string) => {
    setMemberToRemove(memberId);
  };

  const confirmRemoveMember = async (memberId: string) => {
    if (!memberId || !user?.id) return;

    try {
      setProcessingAction(true);

      // removeMember signature: (adminId: string, userIdToRemove: string, clubId: string)
      await removeMember(user.id, memberId, clubId);

      // Update local state by removing the member
      const updatedMembers = members.filter(member => member.user_id !== memberId);
      onMembersUpdate(updatedMembers);

      toast.success('Member removed successfully');
      setMemberToRemove(null);

      // Refresh data to ensure consistency
      await onRefreshData();

    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    } finally {
      setProcessingAction(false);
    }
  };

  const cancelRemoveMember = () => {
    setMemberToRemove(null);
  };

  return {
    processingAction,
    memberToRemove,
    handleRemoveMember,
    confirmRemoveMember,
    cancelRemoveMember
  };
}
