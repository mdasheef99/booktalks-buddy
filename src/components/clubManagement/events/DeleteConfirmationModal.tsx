/**
 * Delete Confirmation Modal Component
 *
 * Modal for confirming meeting deletion with safety checks.
 */

import React, { useState } from 'react';
import { Trash2, AlertTriangle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ClubMeeting } from '@/lib/services/clubManagementService';
import { format, isPast } from 'date-fns';

// =====================================================
// Types
// =====================================================

interface DeleteConfirmationModalProps {
  event: ClubMeeting | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

// =====================================================
// Delete Confirmation Modal Component
// =====================================================

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  event,
  isOpen,
  onClose,
  onConfirm
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!event) return null;

  const isEventPast = isPast(new Date(event.scheduled_at));
  const formattedDate = format(new Date(event.scheduled_at), 'MMM dd, yyyy');
  const formattedTime = format(new Date(event.scheduled_at), 'h:mm a');

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);

    try {
      await onConfirm();
      onClose();
    } catch (err) {
      console.error('Error deleting meeting:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete meeting');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      onClose();
    }
  };

  // Helper function to get meeting type badge
  const getMeetingTypeBadge = (type: string) => {
    const badges = {
      discussion: { label: 'Discussion', className: 'bg-blue-100 text-blue-800' },
      social: { label: 'Social', className: 'bg-green-100 text-green-800' },
      planning: { label: 'Planning', className: 'bg-purple-100 text-purple-800' },
      author_event: { label: 'Author Event', className: 'bg-amber-100 text-amber-800' },
      other: { label: 'Other', className: 'bg-gray-100 text-gray-800' }
    };
    
    const badge = badges[type as keyof typeof badges] || badges.other;
    return (
      <Badge className={badge.className}>
        {badge.label}
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Delete Meeting
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. Please confirm you want to delete this meeting.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-amber-800 mb-1">
                  Warning: This action is permanent
                </h4>
                <p className="text-sm text-amber-700">
                  Deleting this meeting will:
                </p>
                <ul className="text-sm text-amber-700 mt-2 space-y-1">
                  <li>• Remove the meeting from all member calendars</li>
                  <li>• Send cancellation notifications to all members</li>
                  <li>• Permanently delete all meeting data</li>
                  {!isEventPast && <li>• Cancel any upcoming notifications</li>}
                </ul>
              </div>
            </div>
          </div>

          {/* Meeting Details */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-gray-900 mb-2">Meeting to be deleted:</h4>
            
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h5 className="font-medium text-gray-900">{event.title}</h5>
                  {event.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                </div>
                {getMeetingTypeBadge(event.meeting_type)}
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formattedDate}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>{formattedTime}</span>
                </div>
                {isEventPast && (
                  <Badge variant="outline" className="text-gray-500">
                    Past Event
                  </Badge>
                )}
              </div>

              {event.creator_username && (
                <p className="text-xs text-gray-500">
                  Created by {event.creator_username}
                </p>
              )}
            </div>
          </div>

          {/* Additional Warning for Future Events */}
          {!isEventPast && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm text-red-700">
                    <strong>This is an upcoming meeting.</strong> Members who have this meeting 
                    in their calendars will receive a cancellation notification.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={loading}
              variant="destructive"
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete Meeting
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmationModal;
