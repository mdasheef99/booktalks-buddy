/**
 * Personal Book Card Component
 * 
 * Displays a book in the user's personal library with reading status and actions
 * Follows BookConnect design system patterns
 */

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Star,
  Eye,
  EyeOff,
  Trash2,
  Edit,
  Store,
  FolderPlus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PersonalBook, ReadingListItem } from '@/services/books';
import StarRating from './StarRating';
import ReadingStatusBadge from './ReadingStatusBadge';

interface PersonalBookCardProps {
  book: PersonalBook;
  readingListItem?: ReadingListItem;
  onStatusChange?: (bookId: string, status: 'want_to_read' | 'currently_reading' | 'completed') => void;
  onRate?: (bookId: string, rating: number) => void;
  onTogglePrivacy?: (bookId: string, isPublic: boolean) => void;
  onRemove?: (bookId: string) => void;
  onAddToCollection?: (bookId: string) => void;
  onRequestFromStore?: (book: PersonalBook) => void;
  className?: string;
}

const PersonalBookCard: React.FC<PersonalBookCardProps> = ({
  book,
  readingListItem,
  onStatusChange,
  onRate,
  onTogglePrivacy,
  onRemove,
  onAddToCollection,
  onRequestFromStore,
  className
}) => {
  const [imageError, setImageError] = useState(false);

  const handleStatusChange = (status: 'want_to_read' | 'currently_reading' | 'completed') => {
    if (onStatusChange) {
      onStatusChange(book.id, status);
    }
  };

  const handleRatingChange = (rating: number) => {
    if (onRate) {
      onRate(book.id, rating);
    }
  };

  const handlePrivacyToggle = () => {
    if (onTogglePrivacy && readingListItem) {
      onTogglePrivacy(book.id, !readingListItem.is_public);
    }
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove(book.id);
    }
  };

  const handleAddToCollection = () => {
    if (onAddToCollection) {
      onAddToCollection(book.id);
    }
  };

  const handleRequestFromStore = () => {
    if (onRequestFromStore) {
      onRequestFromStore(book);
    }
  };

  return (
    <Card className={cn('group hover:shadow-lg transition-shadow duration-200', className)}>
      <CardContent className="p-4">
        {/* Book Cover and Info */}
        <div className="flex gap-3 mb-3">
          {/* Book Cover */}
          <div className="flex-shrink-0">
            {book.cover_url && !imageError ? (
              <img
                src={book.cover_url}
                alt={`Cover of ${book.title}`}
                className="w-16 h-24 object-cover rounded shadow-sm"
                onError={() => setImageError(true)}
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
            <h3 className="font-serif font-semibold text-bookconnect-brown line-clamp-2 mb-1">
              {book.title}
            </h3>
            <p className="text-sm text-bookconnect-brown/70 italic mb-2">
              by {book.author}
            </p>
            
            {/* Reading Status */}
            {readingListItem && (
              <ReadingStatusBadge 
                status={readingListItem.status} 
                size="sm"
                className="mb-2"
              />
            )}

            {/* Privacy Indicator */}
            {readingListItem && (
              <div className="flex items-center gap-2 mb-2">
                {readingListItem.is_public ? (
                  <Badge variant="outline" className="text-xs">
                    <Eye className="h-3 w-3 mr-1" />
                    Public
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    <EyeOff className="h-3 w-3 mr-1" />
                    Private
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Actions Menu */}
          <div className="flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {/* Status Change Options */}
                {readingListItem && onStatusChange && (
                  <>
                    <DropdownMenuItem onClick={() => handleStatusChange('want_to_read')}>
                      Want to Read
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange('currently_reading')}>
                      Currently Reading
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange('completed')}>
                      Mark as Completed
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}

                {/* Collection Actions */}
                {onAddToCollection && (
                  <DropdownMenuItem onClick={handleAddToCollection}>
                    <FolderPlus className="h-4 w-4 mr-2" />
                    Add to Collection
                  </DropdownMenuItem>
                )}

                {/* Store Request */}
                {onRequestFromStore && (
                  <DropdownMenuItem onClick={handleRequestFromStore}>
                    <Store className="h-4 w-4 mr-2" />
                    Request from Store
                  </DropdownMenuItem>
                )}

                {/* Privacy Toggle */}
                {readingListItem && onTogglePrivacy && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handlePrivacyToggle}>
                      {readingListItem.is_public ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-2" />
                          Make Private
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          Make Public
                        </>
                      )}
                    </DropdownMenuItem>
                  </>
                )}

                {/* Remove */}
                {onRemove && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleRemove}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove from Library
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Rating Section */}
        {readingListItem && (
          <div className="border-t border-bookconnect-brown/10 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-bookconnect-brown">
                Your Rating:
              </span>
              <StarRating
                rating={readingListItem.rating || 0}
                onRatingChange={onRate ? handleRatingChange : undefined}
                readonly={!onRate}
                size="sm"
              />
            </div>

            {/* Review Preview */}
            {readingListItem.review_text && (
              <div className="mt-2">
                <p className="text-xs text-bookconnect-brown/70 line-clamp-2">
                  "{readingListItem.review_text}"
                </p>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        {!readingListItem && onStatusChange && (
          <div className="border-t border-bookconnect-brown/10 pt-3">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange('want_to_read')}
                className="flex-1 text-xs"
              >
                Want to Read
              </Button>
              <Button
                size="sm"
                onClick={() => handleStatusChange('currently_reading')}
                className="flex-1 text-xs bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90"
              >
                Start Reading
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PersonalBookCard;
