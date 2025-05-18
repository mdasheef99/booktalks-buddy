import React from 'react';
import DestructiveActionDialog from '@/components/common/DestructiveActionDialog';
import { Participant } from './types';

interface RemoveParticipantDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (userId: string) => Promise<void>;
  participant: Participant | null;
  isLoading: boolean;
}

/**
 * Dialog for confirming participant removal
 */
const RemoveParticipantDialog: React.FC<RemoveParticipantDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  participant,
  isLoading,
}) => {
  if (!participant) return null;

  const handleConfirm = async () => {
    await onConfirm(participant.user_id);
  };

  const displayName = participant.user.username || 'Anonymous User';
  const email = participant.user.email;

  return (
    <DestructiveActionDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Remove Participant"
      description={`Are you sure you want to remove ${displayName} from this event? This action cannot be undone.`}
      confirmText="Remove Participant"
      cancelText="Cancel"
      severity="medium"
      isLoading={isLoading}
      additionalContent={
        <div className="bg-gray-50 p-3 rounded-md">
          <p className="text-sm font-medium">Participant details:</p>
          <p className="text-sm mt-1">Name: {displayName}</p>
          {email && <p className="text-sm mt-1">Email: {email}</p>}
          <p className="text-sm mt-1">
            RSVP Status: <span className="capitalize">{participant.rsvp_status.replace('_', ' ')}</span>
          </p>
          <p className="text-sm mt-1">
            RSVP Date: {new Date(participant.rsvp_at).toLocaleDateString()}
          </p>
        </div>
      }
    />
  );
};

export default RemoveParticipantDialog;
