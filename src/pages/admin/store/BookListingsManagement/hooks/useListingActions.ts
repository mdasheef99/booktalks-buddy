/**
 * useListingActions Hook
 * 
 * Custom hook for managing book listing actions (approve, reject, etc.).
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { BookListingService } from '@/lib/services/bookListingService';
import { BookListingStatus } from '@/types/bookListings';
import { getStatusUpdateMessage, validateNotes } from '../utils/listingUtils';
import type { UseListingActionsReturn } from '../types';

interface UseListingActionsProps {
  userId: string;
  onSuccess?: () => Promise<void>;
  onListingClose?: () => void;
}

export const useListingActions = ({
  userId,
  onSuccess,
  onListingClose
}: UseListingActionsProps): UseListingActionsReturn => {
  const [updating, setUpdating] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);

  const updateListingStatus = async (
    listingId: string,
    status: BookListingStatus,
    notes?: string
  ) => {
    try {
      setUpdating(true);

      // Validate notes if provided
      if (notes) {
        const notesError = validateNotes(status, notes);
        if (notesError) {
          toast.error(notesError);
          return;
        }
      }

      // Update listing status
      await BookListingService.updateBookListingStatus(
        listingId,
        { status, store_owner_notes: notes },
        userId
      );

      // Show success message
      const message = getStatusUpdateMessage(status);
      toast.success(message);

      // Call success callback to reload data
      if (onSuccess) {
        await onSuccess();
      }

      // Close dialog if callback provided
      if (onListingClose) {
        onListingClose();
      }
    } catch (err) {
      console.error('Error updating listing:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update listing');
    } finally {
      setUpdating(false);
    }
  };

  const deleteListing = async (listingId: string) => {
    try {
      setDeleting(true);

      // Delete the listing
      await BookListingService.deleteBookListing(listingId);

      // Show success message
      toast.success('Book listing deleted successfully');

      // Call success callback to reload data
      if (onSuccess) {
        await onSuccess();
      }

      // Close dialog if callback provided
      if (onListingClose) {
        onListingClose();
      }
    } catch (err) {
      console.error('Error deleting listing:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete listing');
    } finally {
      setDeleting(false);
    }
  };

  return {
    updateListingStatus,
    deleteListing,
    updating,
    deleting
  };
};
