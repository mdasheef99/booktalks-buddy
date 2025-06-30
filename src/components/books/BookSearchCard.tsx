/**
 * Book Search Card Component
 * 
 * Displays search results with actions to add to library or request from store
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  BookPlus,
  MoreHorizontal,
  Store,
  FolderPlus,
  ExternalLink,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BookType } from '@/types/books';

interface BookSearchCardProps {
  book: BookType;
  isInLibrary?: boolean;
  onAddToLibrary?: (book: BookType) => void;
  onAddToCollection?: (book: BookType) => void;
  onRequestFromStore?: (book: BookType) => void;
  className?: string;
}

const BookSearchCard: React.FC<BookSearchCardProps> = ({
  book,
  isInLibrary = false,
  onAddToLibrary,
  onAddToCollection,
  onRequestFromStore,
  className
}) => {
  const [imageError, setImageError] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToLibrary = async () => {
    if (onAddToLibrary && !isInLibrary) {
      setIsAdding(true);
      try {
        await onAddToLibrary(book);
      } finally {
        setIsAdding(false);
      }
    }
  };

  const handleAddToCollection = () => {
    if (onAddToCollection) {
      onAddToCollection(book);
    }
  };

  const handleRequestFromStore = () => {
    if (onRequestFromStore) {
      onRequestFromStore(book);
    }
  };

  const handleViewOnGoogle = () => {
    window.open(`https://books.google.com/books?id=${book.id}`, '_blank');
  };

  return (
    <Card className={cn('group hover:shadow-lg transition-shadow duration-200', className)}>
      <CardContent className="p-4">
        {/* Book Cover and Info */}
        <div className="flex gap-4 mb-4">
          {/* Book Cover */}
          <div className="flex-shrink-0">
            {book.imageUrl && !imageError ? (
              <img
                src={book.imageUrl}
                alt={`Cover of ${book.title}`}
                className="w-20 h-28 object-cover rounded shadow-sm"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-20 h-28 bg-bookconnect-cream border border-bookconnect-brown/20 rounded flex items-center justify-center">
                <div className="text-bookconnect-brown/40 text-xs text-center px-1">
                  No Cover
                </div>
              </div>
            )}
          </div>

          {/* Book Details */}
          <div className="flex-1 min-w-0">
            <h3 className="font-serif font-semibold text-bookconnect-brown line-clamp-2 mb-2">
              {book.title}
            </h3>
            <p className="text-sm text-bookconnect-brown/70 italic mb-2">
              by {book.author}
            </p>
            
            {/* Book Metadata */}
            <div className="flex flex-wrap gap-2 mb-3">
              {book.publishedDate && (
                <Badge variant="outline" className="text-xs">
                  {new Date(book.publishedDate).getFullYear()}
                </Badge>
              )}
              {book.pageCount && (
                <Badge variant="outline" className="text-xs">
                  {book.pageCount} pages
                </Badge>
              )}
              {book.categories && book.categories.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {book.categories[0]}
                </Badge>
              )}
            </div>

            {/* Description */}
            {book.description && (
              <p className="text-sm text-bookconnect-brown/80 line-clamp-3">
                {book.description}
              </p>
            )}

            {/* Already in Library Indicator */}
            {isInLibrary && (
              <div className="mt-2">
                <Badge className="bg-bookconnect-olive text-white">
                  <Check className="h-3 w-3 mr-1" />
                  In Your Library
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Primary Action */}
          {!isInLibrary ? (
            <Button
              onClick={handleAddToLibrary}
              disabled={isAdding}
              className="flex-1 bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90"
            >
              <BookPlus className="h-4 w-4 mr-2" />
              {isAdding ? 'Adding...' : 'Add to Library'}
            </Button>
          ) : (
            <Button
              onClick={handleAddToCollection}
              variant="outline"
              className="flex-1"
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              Add to Collection
            </Button>
          )}

          {/* Secondary Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {/* Store Request */}
              {onRequestFromStore && (
                <DropdownMenuItem onClick={handleRequestFromStore}>
                  <Store className="h-4 w-4 mr-2" />
                  Request from Store
                </DropdownMenuItem>
              )}

              {/* Add to Collection (if already in library) */}
              {isInLibrary && onAddToCollection && (
                <DropdownMenuItem onClick={handleAddToCollection}>
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Add to Collection
                </DropdownMenuItem>
              )}

              {/* View on Google Books */}
              <DropdownMenuItem onClick={handleViewOnGoogle}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Google Books
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookSearchCard;
