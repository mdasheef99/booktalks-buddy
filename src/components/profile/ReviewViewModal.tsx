/**
 * Review View Modal Component
 * 
 * Modal for viewing full book reviews in user profiles
 * Displays complete review content with book information
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PersonalBook, ReadingListItem } from '@/services/books';
import StarRating from '@/components/books/StarRating';
import { BookOpen, Calendar, User, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReviewViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: PersonalBook | null;
  readingListItem: ReadingListItem | null;
  reviewerName?: string; // Name of the person who wrote the review
  loading?: boolean;
}

const ReviewViewModal: React.FC<ReviewViewModalProps> = ({
  isOpen,
  onClose,
  book,
  readingListItem,
  reviewerName,
  loading = false
}) => {
  // Don't render if no data
  if (!book || !readingListItem) {
    return null;
  }

  // Only show if review exists and is public
  const hasPublicReview = readingListItem.review_text && readingListItem.review_is_public;
  
  if (!hasPublicReview) {
    return null;
  }

  const reviewDate = readingListItem.rated_at 
    ? new Date(readingListItem.rated_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : new Date(readingListItem.updated_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-bookconnect-brown">
            <BookOpen className="h-5 w-5" />
            Book Review
          </DialogTitle>
          <DialogDescription>
            {reviewerName ? `${reviewerName}'s review of` : 'Review of'} "{book.title}"
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          // Loading State
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-bookconnect-brown/60">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-bookconnect-sage"></div>
              <span className="text-sm">Loading review...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Book Information Header */}
            <div className="flex items-start gap-4 p-4 bg-bookconnect-cream/30 rounded-lg">
              {/* Book Cover */}
              <div className="flex-shrink-0">
                {book.cover_url ? (
                  <img
                    src={book.cover_url}
                    alt={`Cover of ${book.title}`}
                    className="w-16 h-24 object-cover rounded shadow-sm"
                  />
                ) : (
                  <div className="w-16 h-24 bg-bookconnect-cream border border-bookconnect-brown/20 rounded flex items-center justify-center">
                    <div className="text-bookconnect-brown/40 text-xs text-center px-1">
                      No Cover
                    </div>
                  </div>
                )}
              </div>

              {/* Book Details */}
              <div className="flex-1 min-w-0">
                <h3 className="font-serif font-semibold text-lg text-bookconnect-brown mb-1">
                  {book.title}
                </h3>
                <p className="text-bookconnect-brown/70 italic mb-2">
                  by {book.author}
                </p>
                
                {/* Rating */}
                {readingListItem.rating && (
                  <div className="flex items-center gap-2 mb-2">
                    <StarRating
                      rating={readingListItem.rating}
                      readonly={true}
                      size="sm"
                    />
                    <span className="text-sm text-bookconnect-brown/70">
                      {readingListItem.rating}/5 stars
                    </span>
                  </div>
                )}

                {/* Book Metadata */}
                {book.genre && (
                  <div className="flex items-center gap-1 text-xs text-bookconnect-brown/60">
                    <span>Genre: {book.genre}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Review Content */}
            <div className="space-y-4">
              {/* Review Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {reviewerName && (
                    <div className="flex items-center gap-1 text-sm text-bookconnect-brown/70">
                      <User className="h-4 w-4" />
                      <span>{reviewerName}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-sm text-bookconnect-brown/70">
                    <Calendar className="h-4 w-4" />
                    <span>{reviewDate}</span>
                  </div>
                </div>
              </div>

              {/* Review Text */}
              <div className="bg-bookconnect-cream/20 rounded-lg p-4">
                <div className="prose prose-sm max-w-none">
                  <p className="text-bookconnect-brown/90 leading-relaxed whitespace-pre-wrap">
                    "{readingListItem.review_text}"
                  </p>
                </div>
              </div>

              {/* Review Stats */}
              <div className="flex items-center justify-between text-xs text-bookconnect-brown/50 pt-2 border-t border-bookconnect-brown/10">
                <span>
                  {readingListItem.review_text?.length || 0} characters
                </span>
                <span>
                  Public review
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-bookconnect-brown/10">
          <Button
            variant="outline"
            onClick={onClose}
            className="text-bookconnect-brown border-bookconnect-brown/30 hover:bg-bookconnect-cream/50"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewViewModal;
