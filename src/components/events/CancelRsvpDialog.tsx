import React from 'react';
import DestructiveActionDialog from '@/components/common/DestructiveActionDialog';
import { Event } from '@/lib/api/bookclubs/events';

interface CancelRsvpDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  event: Event | null;
  isLoading: boolean;
}

/**
 * Dialog for confirming RSVP cancellation
 */
const CancelRsvpDialog: React.FC<CancelRsvpDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  event,
  isLoading,
}) => {
  if (!event) return null;

  return (
    <DestructiveActionDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Cancel RSVP"
      description={`Are you sure you want to cancel your RSVP for "${event.title}"? You can always RSVP again later if you change your mind.`}
      confirmText="Cancel RSVP"
      cancelText="Keep RSVP"
      severity="low"
      isLoading={isLoading}
      additionalContent={
        <div className="bg-gray-50 p-3 rounded-md">
          <p className="text-sm font-medium">Event details:</p>
          <p className="text-sm mt-1">Title: {event.title}</p>
          <p className="text-sm mt-1">
            Date: {new Date(event.start_time || event.date).toLocaleDateString()}
          </p>
          {event.location && (
            <p className="text-sm mt-1">Location: {event.location}</p>
          )}
        </div>
      }
    />
  );
};

export default CancelRsvpDialog;
