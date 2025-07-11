/**
 * useJoinRequestManagement Hook
 * Handles join request operations and modal state management
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { approveJoinRequest, rejectJoinRequest } from '@/lib/api/bookclubs/requests';
import { useClubJoinRequests } from '@/hooks/useJoinRequestQuestions';
import { useAuth } from '@/contexts/AuthContext';
import type { JoinRequest, EnhancedJoinRequest } from '../types/memberManagement';

interface UseJoinRequestManagementProps {
  clubId: string;
  joinRequests: JoinRequest[];
  onJoinRequestsUpdate: (newRequests: JoinRequest[]) => void;
  onRefreshData: () => Promise<void>;
}

interface UseJoinRequestManagementReturn {
  processingAction: boolean;
  reviewModalOpen: boolean;
  selectedRequest: EnhancedJoinRequest | null;
  enhancedRequests: EnhancedJoinRequest[];
  legacyRequests: JoinRequest[];
  handleApproveRequest: (userId: string) => Promise<void>;
  handleRejectRequest: (userId: string) => Promise<void>;
  handleViewRequest: (request: EnhancedJoinRequest) => void;
  closeReviewModal: () => void;
  approveFromModal: () => Promise<void>;
  rejectFromModal: () => Promise<void>;
}

export function useJoinRequestManagement({
  clubId,
  joinRequests,
  onJoinRequestsUpdate,
  onRefreshData
}: UseJoinRequestManagementProps): UseJoinRequestManagementReturn {
  const { user } = useAuth();
  const [processingAction, setProcessingAction] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<EnhancedJoinRequest | null>(null);

  // Use the join requests hook (corrected signature)
  const { requests: clubRequests } = useClubJoinRequests(clubId);

  // Transform requests into enhanced and legacy formats
  const enhancedRequests: EnhancedJoinRequest[] = [];
  const legacyRequests: JoinRequest[] = joinRequests || [];

  // Process club requests if available
  if (clubRequests && Array.isArray(clubRequests)) {
    clubRequests.forEach(request => {
      if (request.answers && Array.isArray(request.answers) && request.answers.length > 0) {
        // This is an enhanced request with answers
        enhancedRequests.push({
          user_id: request.user_id,
          username: request.username || request.user?.username || 'Unknown',
          display_name: request.display_name || request.user?.display_name || 'Unknown User',
          requested_at: request.requested_at,
          has_answers: true,
          answers: request.answers
        });
      }
    });
  }

  const handleApproveRequest = async (userId: string) => {
    if (!user?.id) return;

    try {
      setProcessingAction(true);

      // approveJoinRequest signature: (adminId: string, clubId: string, userId: string)
      await approveJoinRequest(user.id, clubId, userId);

      // Update local state by removing the approved request
      const updatedRequests = joinRequests.filter(request => request.user_id !== userId);
      onJoinRequestsUpdate(updatedRequests);

      toast.success('Join request approved');

      // Refresh data to get updated members list
      await onRefreshData();

    } catch (error) {
      console.error('Error approving join request:', error);
      toast.error('Failed to approve join request');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleRejectRequest = async (userId: string) => {
    if (!user?.id) return;

    try {
      setProcessingAction(true);

      // rejectJoinRequest signature: (adminId: string, clubId: string, userId: string)
      await rejectJoinRequest(user.id, clubId, userId);

      // Update local state by removing the rejected request
      const updatedRequests = joinRequests.filter(request => request.user_id !== userId);
      onJoinRequestsUpdate(updatedRequests);

      toast.success('Join request rejected');

      // Refresh data to ensure consistency
      await onRefreshData();

    } catch (error) {
      console.error('Error rejecting join request:', error);
      toast.error('Failed to reject join request');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleViewRequest = (request: EnhancedJoinRequest) => {
    // Add null safety check and ensure answers exist
    if (request && request.answers && Array.isArray(request.answers)) {
      setSelectedRequest(request);
      setReviewModalOpen(true);
    } else {
      console.error('Invalid request data for review modal:', request);
      toast.error('Unable to review request - missing data');
    }
  };

  const closeReviewModal = () => {
    setReviewModalOpen(false);
    setSelectedRequest(null);
  };

  const approveFromModal = async () => {
    if (selectedRequest) {
      await handleApproveRequest(selectedRequest.user_id);
      closeReviewModal();
    }
  };

  const rejectFromModal = async () => {
    if (selectedRequest) {
      await handleRejectRequest(selectedRequest.user_id);
      closeReviewModal();
    }
  };

  return {
    processingAction,
    reviewModalOpen,
    selectedRequest,
    enhancedRequests,
    legacyRequests,
    handleApproveRequest,
    handleRejectRequest,
    handleViewRequest,
    closeReviewModal,
    approveFromModal,
    rejectFromModal
  };
}
