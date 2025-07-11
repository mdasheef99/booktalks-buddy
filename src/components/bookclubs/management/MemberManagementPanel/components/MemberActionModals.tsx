/**
 * MemberActionModals Component
 * Modal management for member actions (removal, join request review)
 */

import React from 'react';
import MemberRemovalDialog from '../../MemberRemovalDialog';
import JoinRequestReviewModal from '@/components/bookclubs/questions/JoinRequestReviewModal';
import type { MemberActionModalsProps } from '../types/memberManagement';

export function MemberActionModals({
  memberToRemove,
  reviewModalOpen,
  selectedRequest,
  processingAction,
  onConfirmRemoval,
  onCancelRemoval,
  onCloseReviewModal,
  onApproveFromModal,
  onRejectFromModal
}: MemberActionModalsProps) {
  return (
    <>
      {/* Member Removal Dialog */}
      <MemberRemovalDialog
        isOpen={!!memberToRemove}
        onClose={onCancelRemoval}
        onConfirm={() => memberToRemove && onConfirmRemoval(memberToRemove)}
        processing={processingAction}
      />

      {/* Join Request Review Modal */}
      {selectedRequest && (
        <JoinRequestReviewModal
          isOpen={reviewModalOpen}
          onClose={onCloseReviewModal}
          joinRequest={selectedRequest}
          onApprove={onApproveFromModal}
          onReject={onRejectFromModal}
          isLoading={processingAction}
        />
      )}
    </>
  );
}

export default MemberActionModals;
