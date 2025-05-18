import React from 'react';
import DestructiveActionDialog from '@/components/common/DestructiveActionDialog';
import { DeleteEventDialogProps } from './types';

/**
 * Component for confirming event deletion
 */
const DeleteEventDialog: React.FC<DeleteEventDialogProps> = ({
  isOpen,
  eventId,
  eventTitle,
  onClose,
  onConfirm,
  isLoading = false,
  event = null,
}) => {
  const handleConfirm = () => {
    onConfirm(eventId);
  };

  return (
    <DestructiveActionDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Delete Event"
      description={`Are you sure you want to delete the event "${eventTitle}"? This action cannot be undone.`}
      confirmText="Delete Event"
      cancelText="Cancel"
      severity="high"
      isLoading={isLoading}
      additionalContent={
        event && (
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm font-medium">Event details:</p>
            <p className="text-sm mt-1">Title: {event.title}</p>
            <p className="text-sm mt-1">
              Date: {new Date(event.start_time || event.date).toLocaleDateString()}
            </p>
            {event.location && (
              <p className="text-sm mt-1">Location: {event.location}</p>
            )}
            {event.participant_count > 0 && (
              <p className="text-sm mt-1 text-amber-600 font-medium">
                Warning: This event has {event.participant_count} registered participants who will be affected.
              </p>
            )}
          </div>
        )
      }
    />
  );
};

export default DeleteEventDialog;
