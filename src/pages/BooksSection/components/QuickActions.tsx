/**
 * Quick Actions Component
 * 
 * Common actions and shortcuts for Books Section
 */

import React, { useState } from 'react';
import { BookType } from '@/types/books';
import { PersonalBook } from '@/services/books';
import QuickRateModal from '@/components/books/QuickRateModal';
import RemoveBookConfirmDialog from '@/components/books/RemoveBookConfirmDialog';
import { StoreRequestModal } from '@/components/books/store-requests';

interface QuickActionsProps {
  // Quick Rate Modal
  quickRateModal: {
    isOpen: boolean;
    book: PersonalBook | null;
  };
  onQuickRateModalChange: (modal: { isOpen: boolean; book: PersonalBook | null }) => void;
  onQuickRate: (rating: number, review?: string, reviewIsPublic?: boolean) => Promise<void>;

  // Remove Book Modal
  removeBookModal: {
    isOpen: boolean;
    book: PersonalBook | null;
    isRemoving: boolean;
  };
  onRemoveBookModalChange: (modal: { isOpen: boolean; book: PersonalBook | null; isRemoving: boolean }) => void;
  onConfirmRemoveBook: () => Promise<void>;

  // Store Request Modal
  storeRequestModal: {
    isOpen: boolean;
    book: BookType | PersonalBook | null;
    isSubmitting: boolean;
  };
  onStoreRequestModalChange: (modal: { isOpen: boolean; book: BookType | PersonalBook | null; isSubmitting: boolean }) => void;
  onSubmitStoreRequest: (additionalNotes?: string) => Promise<void>;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  quickRateModal,
  onQuickRateModalChange,
  onQuickRate,
  removeBookModal,
  onRemoveBookModalChange,
  onConfirmRemoveBook,
  storeRequestModal,
  onStoreRequestModalChange,
  onSubmitStoreRequest
}) => {
  return (
    <>
      {/* Quick Rate Modal */}
      <QuickRateModal
        isOpen={quickRateModal.isOpen}
        book={quickRateModal.book}
        onClose={() => onQuickRateModalChange({ isOpen: false, book: null })}
        onRate={onQuickRate}
      />

      {/* Remove Book Confirmation Dialog */}
      <RemoveBookConfirmDialog
        isOpen={removeBookModal.isOpen}
        book={removeBookModal.book}
        isRemoving={removeBookModal.isRemoving}
        onClose={() => onRemoveBookModalChange({ 
          isOpen: false, 
          book: null, 
          isRemoving: false 
        })}
        onConfirm={onConfirmRemoveBook}
      />

      {/* Store Request Modal */}
      <StoreRequestModal
        isOpen={storeRequestModal.isOpen}
        book={storeRequestModal.book}
        isSubmitting={storeRequestModal.isSubmitting}
        onClose={() => onStoreRequestModalChange({ 
          isOpen: false, 
          book: null, 
          isSubmitting: false 
        })}
        onSubmit={onSubmitStoreRequest}
      />
    </>
  );
};
