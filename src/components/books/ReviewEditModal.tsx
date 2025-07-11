/**
 * Review Edit Modal Component
 * 
 * Modal for editing book reviews in personal library
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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { PersonalBook, ReadingListItem } from '@/services/books';
import { MessageSquare, Eye, EyeOff } from 'lucide-react';

interface ReviewEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: PersonalBook | null;
  readingListItem: ReadingListItem | null;
  onSubmit: (reviewText: string, reviewIsPublic: boolean) => Promise<void>;
}

const ReviewEditModal: React.FC<ReviewEditModalProps> = ({
  isOpen,
  onClose,
  book,
  readingListItem,
  onSubmit
}) => {
  const [reviewText, setReviewText] = useState('');
  const [reviewIsPublic, setReviewIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with existing review data
  useEffect(() => {
    if (readingListItem) {
      setReviewText(readingListItem.review_text || '');
      setReviewIsPublic(readingListItem.review_is_public ?? true);
    }
  }, [readingListItem]);

  const handleSubmit = async () => {
    if (!book) return;

    setIsSubmitting(true);
    try {
      await onSubmit(reviewText.trim(), reviewIsPublic);
      handleClose();
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReviewText(readingListItem?.review_text || '');
    setReviewIsPublic(readingListItem?.review_is_public ?? true);
    onClose();
  };

  const handleDelete = async () => {
    if (!book) return;

    setIsSubmitting(true);
    try {
      await onSubmit('', reviewIsPublic); // Empty string deletes the review
      handleClose();
    } catch (error) {
      console.error('Error deleting review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!book) return null;

  const isEditing = Boolean(readingListItem?.review_text);
  const hasChanges = reviewText.trim() !== (readingListItem?.review_text || '') || 
                    reviewIsPublic !== (readingListItem?.review_is_public ?? true);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-bookconnect-brown">
            <MessageSquare className="h-5 w-5" />
            {isEditing ? 'Edit Review' : 'Add Review'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update your review for' : 'Share your thoughts about'} "{book.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Book Info */}
          <div className="flex items-center gap-3 p-3 bg-bookconnect-cream/30 rounded-lg">
            {book.cover_url && (
              <img
                src={book.cover_url}
                alt={book.title}
                className="w-12 h-16 object-cover rounded"
              />
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-bookconnect-brown line-clamp-1">
                {book.title}
              </h4>
              <p className="text-sm text-bookconnect-brown/70 italic">
                by {book.author}
              </p>
            </div>
          </div>

          {/* Review Text */}
          <div className="space-y-2">
            <Label htmlFor="review-text" className="text-sm font-medium text-bookconnect-brown">
              Your Review
            </Label>
            <Textarea
              id="review-text"
              placeholder="Share your thoughts about this book..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="min-h-[120px] resize-none"
              maxLength={2000}
            />
            <div className="flex justify-between items-center text-xs">
              <span className="text-bookconnect-brown/60">
                {reviewText.length}/2000 characters
              </span>
              {reviewText.trim() && (
                <div className="flex items-center gap-2">
                  <Switch
                    id="review-public"
                    checked={reviewIsPublic}
                    onCheckedChange={setReviewIsPublic}
                    size="sm"
                  />
                  <Label htmlFor="review-public" className="text-bookconnect-brown/70 flex items-center gap-1">
                    {reviewIsPublic ? (
                      <>
                        <Eye className="h-3 w-3" />
                        Public
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3 w-3" />
                        Private
                      </>
                    )}
                  </Label>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          {isEditing && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
              size="sm"
            >
              Delete Review
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button
              variant="ghost"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !hasChanges}
              className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90"
            >
              {isSubmitting ? 'Saving...' : (isEditing ? 'Update Review' : 'Add Review')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewEditModal;
