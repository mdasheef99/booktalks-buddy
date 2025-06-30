/**
 * Store Request Modal Component
 * 
 * Modal for requesting books from store owners
 * Follows BookConnect design system patterns
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { BookOpen, Store, Loader2 } from 'lucide-react';
import { BookType } from '@/types/books';
import { PersonalBook, getUserStoreContext } from '@/services/books';
import { useAuth } from '@/contexts/AuthContext';

interface StoreRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (additionalNotes?: string) => Promise<void>;
  book: BookType | PersonalBook | null;
  isSubmitting: boolean;
}

const StoreRequestModal: React.FC<StoreRequestModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  book,
  isSubmitting
}) => {
  const { user } = useAuth();
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [userStore, setUserStore] = useState<{
    store_id: string;
    store_name: string;
  } | null>(null);
  const [isLoadingStore, setIsLoadingStore] = useState(false);

  // Load user's store context when modal opens
  useEffect(() => {
    if (isOpen && user) {
      loadUserStore();
    }
  }, [isOpen, user]);

  const loadUserStore = async () => {
    if (!user) return;

    setIsLoadingStore(true);
    try {
      const storeContext = await getUserStoreContext(user.id);
      setUserStore(storeContext);
    } catch (error) {
      console.error('Error loading user store context:', error);
    } finally {
      setIsLoadingStore(false);
    }
  };

  const handleSubmit = async () => {
    if (!userStore) return;

    try {
      await onSubmit(additionalNotes.trim() || undefined);
      handleClose();
    } catch (error) {
      console.error('Error submitting store request:', error);
    }
  };

  const handleClose = () => {
    setAdditionalNotes('');
    onClose();
  };

  if (!book) return null;

  // Helper to get book details regardless of type
  const getBookDetails = () => {
    if ('google_books_id' in book) {
      // PersonalBook
      return {
        title: book.title,
        author: book.author,
        cover: book.cover_url
      };
    } else {
      // BookType
      return {
        title: book.title,
        author: book.author,
        cover: book.imageUrl
      };
    }
  };

  const bookDetails = getBookDetails();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-bookconnect-brown flex items-center gap-2">
            <Store className="h-5 w-5 text-bookconnect-terracotta" />
            Request Book from Store
          </DialogTitle>
          <DialogDescription className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex-shrink-0">
                {bookDetails.cover ? (
                  <img
                    src={bookDetails.cover}
                    alt={bookDetails.title}
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
                  {bookDetails.title}
                </p>
                <p className="text-sm text-bookconnect-brown/70 truncate">
                  by {bookDetails.author}
                </p>
              </div>
            </div>
            
            <p className="text-sm text-bookconnect-brown/80">
              Request this book from your book club's store. The store owner will be notified
              and can respond with availability and pricing information.
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Store Display */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-bookconnect-brown">
              Requesting from Store
            </Label>
            {isLoadingStore ? (
              <div className="flex items-center justify-center p-4 border rounded-md bg-muted/30">
                <div className="w-4 h-4 border-2 border-bookconnect-brown/30 border-t-bookconnect-brown rounded-full animate-spin mr-2" />
                <span className="text-sm text-bookconnect-brown/70">Loading your store...</span>
              </div>
            ) : userStore ? (
              <div className="flex items-center gap-3 p-3 border rounded-md bg-bookconnect-cream/30">
                <Store className="h-5 w-5 text-bookconnect-terracotta" />
                <div>
                  <p className="font-medium text-bookconnect-brown">{userStore.store_name}</p>
                  <p className="text-sm text-bookconnect-brown/70">Your book club's store</p>
                </div>
              </div>
            ) : (
              <div className="p-4 border rounded-md bg-red-50 border-red-200">
                <p className="text-sm text-red-800">
                  You must be a member of a book club to request books from stores.
                </p>
              </div>
            )}
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium text-bookconnect-brown">
              Additional Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Any specific requirements, preferred format, or additional information..."
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              rows={3}
              maxLength={500}
              className="resize-none"
            />
            <p className="text-xs text-bookconnect-brown/60">
              {additionalNotes.length}/500 characters
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!userStore || isSubmitting || isLoadingStore}
            className="flex-1 bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              'Submit Request'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StoreRequestModal;
