/**
 * Collection Card Component
 * 
 * Displays an individual collection with preview books, metadata, and actions
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
  FolderOpen,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  BookOpen,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CollectionCardProps } from './types';

export const CollectionCard: React.FC<CollectionCardProps> = ({
  collection,
  previewBooks = [],
  onEdit,
  onDelete,
  onView,
  showActions = true,
  className
}) => {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const handleImageError = (bookId: string) => {
    setImageErrors(prev => new Set(prev).add(bookId));
  };

  const handleCardClick = () => {
    if (onView) {
      onView(collection);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(collection);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(collection.id);
    }
  };

  return (
    <Card 
      className={cn(
        'group hover:shadow-lg transition-all duration-200 cursor-pointer',
        'border-bookconnect-brown/20 bg-white/90',
        className
      )}
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        {/* Collection Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-serif font-semibold text-lg text-bookconnect-brown line-clamp-1 mb-1">
              {collection.name}
            </h3>
            {collection.description && (
              <p className="text-sm text-bookconnect-brown/70 line-clamp-2 mb-2">
                {collection.description}
              </p>
            )}
          </div>
          
          {/* Actions Dropdown */}
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Collection
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Collection
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Book Preview Covers */}
        <div className="mb-3">
          {(collection.book_count && collection.book_count > 0) ? (
            <div className="flex -space-x-2 mb-2">
              {previewBooks.length > 0 ? (
                <>
                  {previewBooks.slice(0, 4).map((book, index) => (
                    <div
                      key={book.id}
                      className="relative w-12 h-16 rounded shadow-sm border-2 border-white"
                      style={{ zIndex: 4 - index }}
                    >
                      {book.cover_url && !imageErrors.has(book.id) ? (
                        <img
                          src={book.cover_url}
                          alt={`Cover of ${book.title}`}
                          className="w-full h-full object-cover rounded"
                          onError={() => handleImageError(book.id)}
                        />
                      ) : (
                        <div className="w-full h-full bg-bookconnect-cream border border-bookconnect-brown/20 rounded flex items-center justify-center">
                          <BookOpen className="h-3 w-3 text-bookconnect-brown/40" />
                        </div>
                      )}
                    </div>
                  ))}
                  {previewBooks.length > 4 && (
                    <div className="w-12 h-16 bg-bookconnect-brown/10 border-2 border-white rounded shadow-sm flex items-center justify-center">
                      <span className="text-xs font-medium text-bookconnect-brown">
                        +{previewBooks.length - 4}
                      </span>
                    </div>
                  )}
                </>
              ) : collection.preview_covers && collection.preview_covers.length > 0 ? (
                <>
                  {collection.preview_covers.slice(0, 4).map((coverUrl, index) => (
                    <div
                      key={`preview-${index}`}
                      className="relative w-12 h-16 rounded shadow-sm border-2 border-white"
                      style={{ zIndex: 4 - index }}
                    >
                      {coverUrl && !imageErrors.has(`preview-${index}`) ? (
                        <img
                          src={coverUrl}
                          alt={`Book cover ${index + 1}`}
                          className="w-full h-full object-cover rounded"
                          onError={() => handleImageError(`preview-${index}`)}
                        />
                      ) : (
                        <div className="w-full h-full bg-bookconnect-cream border border-bookconnect-brown/20 rounded flex items-center justify-center">
                          <BookOpen className="h-3 w-3 text-bookconnect-brown/40" />
                        </div>
                      )}
                    </div>
                  ))}
                  {collection.preview_covers.length > 4 && (
                    <div className="w-12 h-16 bg-bookconnect-brown/10 border-2 border-white rounded shadow-sm flex items-center justify-center">
                      <span className="text-xs font-medium text-bookconnect-brown">
                        +{collection.preview_covers.length - 4}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                /* Show placeholder when we know there are books but no preview covers loaded */
                <div className="h-16 bg-bookconnect-sage/10 border border-bookconnect-sage/30 rounded flex items-center justify-center mb-2">
                  <div className="text-center">
                    <BookOpen className="h-6 w-6 text-bookconnect-olive/60 mx-auto mb-1" />
                    <span className="text-xs text-bookconnect-olive/70">{collection.book_count} books</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-16 bg-bookconnect-cream/50 border border-dashed border-bookconnect-brown/30 rounded flex items-center justify-center mb-2">
              <div className="text-center">
                <FolderOpen className="h-6 w-6 text-bookconnect-brown/40 mx-auto mb-1" />
                <span className="text-xs text-bookconnect-brown/60">Empty Collection</span>
              </div>
            </div>
          )}
        </div>

        {/* Collection Metadata */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className="bg-bookconnect-sage/20 text-bookconnect-olive border-bookconnect-sage/30"
            >
              <BookOpen className="h-3 w-3 mr-1" />
              {collection.book_count || 0} books
            </Badge>
            
            <Badge 
              variant="outline"
              className={cn(
                'border-bookconnect-brown/30',
                collection.is_public 
                  ? 'text-bookconnect-olive bg-bookconnect-sage/10' 
                  : 'text-bookconnect-brown/70 bg-bookconnect-cream/50'
              )}
            >
              {collection.is_public ? (
                <>
                  <Users className="h-3 w-3 mr-1" />
                  Public
                </>
              ) : (
                <>
                  <EyeOff className="h-3 w-3 mr-1" />
                  Private
                </>
              )}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
