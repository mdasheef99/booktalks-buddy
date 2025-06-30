/**
 * Quick Rate Modal Component
 * 
 * Modal for quickly rating a book after adding to reading list
 * Follows BookConnect design system patterns
 */

import React, { useState } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { PersonalBook } from '@/services/books';
import StarRating from './StarRating';

interface QuickRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: PersonalBook | null;
  onSubmit: (rating: number, review?: string, reviewIsPublic?: boolean) => Promise<void>;
}

const QuickRateModal: React.FC<QuickRateModalProps> = ({
  isOpen,
  onClose,
  book,
  onSubmit
}) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [reviewIsPublic, setReviewIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit(
        rating, 
        review.trim() || undefined, 
        review.trim() ? reviewIsPublic : undefined
      );
      handleClose();
    } catch (error) {
      console.error('Error submitting rating:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setReview('');
    setReviewIsPublic(true);
    onClose();
  };

  const handleSkip = () => {
    handleClose();
  };

  if (!book) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-bookconnect-brown">
            Rate This Book
          </DialogTitle>
          <DialogDescription>
            How would you rate "{book.title}"? You can always change this later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Book Info */}
          <div className="flex gap-3">
            {book.cover_url ? (
              <img
                src={book.cover_url}
                alt={`Cover of ${book.title}`}
                className="w-12 h-16 object-cover rounded shadow-sm flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-16 bg-bookconnect-cream border border-bookconnect-brown/20 rounded flex items-center justify-center flex-shrink-0">
                <div className="text-bookconnect-brown/40 text-xs text-center">
                  No Cover
                </div>
              </div>
            )}
            <div className="min-w-0">
              <h4 className="font-serif font-semibold text-bookconnect-brown line-clamp-2">
                {book.title}
              </h4>
              <p className="text-sm text-bookconnect-brown/70 italic">
                by {book.author}
              </p>
            </div>
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-bookconnect-brown">
              Your Rating
            </Label>
            <div className="flex justify-center">
              <StarRating
                rating={rating}
                onRatingChange={setRating}
                size="lg"
                showLabel
              />
            </div>
          </div>

          {/* Optional Review */}
          <div className="space-y-2">
            <Label htmlFor="review" className="text-sm font-medium text-bookconnect-brown">
              Quick Thoughts (Optional)
            </Label>
            <Textarea
              id="review"
              placeholder="Share your thoughts about this book..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className="min-h-[80px] resize-none"
              maxLength={500}
            />
            <div className="text-xs text-bookconnect-brown/60 text-right">
              {review.length}/500 characters
            </div>
          </div>

          {/* Review Privacy */}
          {review.trim() && (
            <div className="flex items-center space-x-2">
              <Switch
                id="review-public"
                checked={reviewIsPublic}
                onCheckedChange={setReviewIsPublic}
              />
              <Label htmlFor="review-public" className="text-sm text-bookconnect-brown">
                Make this review public
              </Label>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="ghost"
            onClick={handleSkip}
            disabled={isSubmitting}
          >
            Skip for Now
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
            className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90"
          >
            {isSubmitting ? 'Saving...' : 'Save Rating'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuickRateModal;
