/**
 * Profile Book Card Component
 * 
 * View-only book card component for displaying books on user profiles
 * Shows book cover, title, author, rating, review, and reading status
 * No edit functionality - pure display component
 * Follows BookConnect design system patterns
 */

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { PersonalBook, ReadingListItem } from '@/services/books';
import StarRating from '@/components/books/StarRating';
import ReadingStatusBadge from '@/components/books/ReadingStatusBadge';
import ReviewViewModal from './ReviewViewModal';

interface ProfileBookCardProps {
  book: PersonalBook;
  readingListItem: ReadingListItem;
  showReview?: boolean; // Control review visibility
  compact?: boolean; // Compact view for smaller screens
  className?: string;
  reviewerName?: string; // Name of the person who wrote the review
}

const ProfileBookCard: React.FC<ProfileBookCardProps> = ({
  book,
  readingListItem,
  showReview = true,
  compact = false,
  className,
  reviewerName
}) => {
  const [imageError, setImageError] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  // Only show review if it exists and is public
  const shouldShowReview = showReview &&
    readingListItem.review_text &&
    readingListItem.review_is_public;

  // Handle review click
  const handleReviewClick = () => {
    if (shouldShowReview) {
      setReviewModalOpen(true);
    }
  };

  return (
    <Card className={cn(
      'hover:shadow-lg transition-shadow duration-200',
      compact ? 'h-auto' : 'h-full',
      className
    )}>
      <CardContent className={cn('p-4', compact && 'p-3')}>
        {/* Book Cover and Info */}
        <div className={cn('flex gap-3 mb-3', compact && 'gap-2 mb-2')}>
          {/* Book Cover */}
          <div className="flex-shrink-0">
            {book.cover_url && !imageError ? (
              <img
                src={book.cover_url}
                alt={`Cover of ${book.title}`}
                className={cn(
                  'object-cover rounded shadow-sm',
                  compact ? 'w-12 h-18' : 'w-16 h-24'
                )}
                onError={() => setImageError(true)}
              />
            ) : (
              <div className={cn(
                'bg-bookconnect-cream border border-bookconnect-brown/20 rounded flex items-center justify-center',
                compact ? 'w-12 h-18' : 'w-16 h-24'
              )}>
                <div className="text-bookconnect-brown/40 text-xs text-center px-1">
                  No Cover
                </div>
              </div>
            )}
          </div>

          {/* Book Details */}
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              'font-serif font-semibold text-bookconnect-brown line-clamp-2 mb-1',
              compact ? 'text-sm' : 'text-base'
            )}>
              {book.title}
            </h3>
            <p className={cn(
              'text-bookconnect-brown/70 italic mb-2',
              compact ? 'text-xs' : 'text-sm'
            )}>
              by {book.author}
            </p>
            
            {/* Reading Status */}
            <ReadingStatusBadge
              status={readingListItem.status}
              size={compact ? 'sm' : 'md'}
              className="mb-2"
            />
          </div>
        </div>

        {/* Rating Section */}
        {readingListItem.rating && (
          <div className={cn(
            'border-t border-bookconnect-brown/10 pt-3',
            compact && 'pt-2'
          )}>
            <div className="flex items-center justify-between">
              <span className={cn(
                'font-medium text-bookconnect-brown',
                compact ? 'text-xs' : 'text-sm'
              )}>
                Rating:
              </span>
              <StarRating
                rating={readingListItem.rating}
                readonly={true}
                size={compact ? 'sm' : 'sm'}
              />
            </div>
          </div>
        )}

        {/* Review Section */}
        {shouldShowReview && (
          <div className={cn(
            'mt-3 pt-3 border-t border-bookconnect-brown/10',
            compact && 'mt-2 pt-2'
          )}>
            <div className="mb-2">
              <span className={cn(
                'font-medium text-bookconnect-brown',
                compact ? 'text-xs' : 'text-sm'
              )}>
                Review:
              </span>
            </div>
            <div
              className="bg-bookconnect-cream/20 rounded p-2 cursor-pointer hover:bg-bookconnect-cream/30 transition-colors"
              onClick={handleReviewClick}
              title="Click to view full review"
            >
              <p className={cn(
                'text-bookconnect-brown/80 leading-relaxed',
                compact ? 'text-xs line-clamp-3' : 'text-sm line-clamp-4'
              )}>
                "{readingListItem.review_text}"
              </p>
              <p className={cn(
                'text-bookconnect-brown/50 mt-1 text-xs'
              )}>
                Click to read full review
              </p>
            </div>
            {readingListItem.rated_at && (
              <p className={cn(
                'text-bookconnect-brown/50 mt-1',
                compact ? 'text-xs' : 'text-xs'
              )}>
                Reviewed {new Date(readingListItem.rated_at).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {/* No Rating/Review State */}
        {!readingListItem.rating && !shouldShowReview && (
          <div className={cn(
            'border-t border-bookconnect-brown/10 pt-3',
            compact && 'pt-2'
          )}>
            <p className={cn(
              'text-bookconnect-brown/50 italic text-center',
              compact ? 'text-xs' : 'text-sm'
            )}>
              No rating or review yet
            </p>
          </div>
        )}
      </CardContent>

      {/* Review View Modal */}
      <ReviewViewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        book={book}
        readingListItem={readingListItem}
        reviewerName={reviewerName}
      />
    </Card>
  );
};

export default ProfileBookCard;
