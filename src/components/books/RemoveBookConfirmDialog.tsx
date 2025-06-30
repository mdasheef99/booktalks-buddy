/**
 * Remove Book Confirmation Dialog Component
 * 
 * Confirmation dialog for removing books from personal library
 * Follows BookConnect design system patterns
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, BookOpen } from 'lucide-react';
import { PersonalBook } from '@/services/books';

interface RemoveBookConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  book: PersonalBook | null;
  isRemoving: boolean;
}

const RemoveBookConfirmDialog: React.FC<RemoveBookConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  book,
  isRemoving
}) => {
  const handleConfirm = async () => {
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error removing book:', error);
      // Error handling is done in the parent component
    }
  };

  if (!book) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-bookconnect-brown flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Remove Book from Library
          </DialogTitle>
          <DialogDescription className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex-shrink-0">
                {book.cover_url ? (
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    className="w-12 h-16 object-cover rounded shadow-sm"
                  />
                ) : (
                  <div className="w-12 h-16 bg-bookconnect-brown/10 rounded flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-bookconnect-brown/50" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-bookconnect-brown truncate">
                  {book.title}
                </p>
                {book.author && (
                  <p className="text-sm text-bookconnect-brown/70 truncate">
                    by {book.author}
                  </p>
                )}
              </div>
            </div>
            
            <div className="text-sm text-bookconnect-brown/80 space-y-2">
              <p>
                Are you sure you want to remove this book from your library?
              </p>
              <p className="text-xs text-bookconnect-brown/60">
                This will also remove any reading status, ratings, and reviews you've added. 
                This action cannot be undone.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isRemoving}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isRemoving}
            className="flex-1"
          >
            {isRemoving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Removing...
              </>
            ) : (
              'Remove Book'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RemoveBookConfirmDialog;
