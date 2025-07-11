/**
 * Collection Books View Component
 * 
 * Detailed view of books within a collection with management features
 * Follows BookConnect design system patterns
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowLeft,
  BookOpen,
  Edit,
  Trash2,
  Plus,
  MoreHorizontal,
  Users,
  EyeOff,
  Calendar,
  Loader2,
  X,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  getCollectionBooks, 
  removeBookFromCollection, 
  updateBookInCollection 
} from '@/services/books/collections';
import { CollectionBooksViewProps, CollectionBookItemProps } from './types';
import { CollectionBook } from '@/services/books/collections';

// Individual book item component
const CollectionBookItem: React.FC<CollectionBookItemProps> = ({
  collectionBook,
  onRemove,
  onUpdateNotes,
  showActions = true
}) => {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState(collectionBook.notes || '');
  const [imageError, setImageError] = useState(false);

  const book = collectionBook.personal_books;
  if (!book) return null;

  const handleSaveNotes = () => {
    onUpdateNotes(book.id, notes);
    setIsEditingNotes(false);
  };

  const handleCancelNotes = () => {
    setNotes(collectionBook.notes || '');
    setIsEditingNotes(false);
  };

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-3">
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
                <BookOpen className="h-6 w-6 text-bookconnect-brown/40" />
              </div>
            )}
          </div>

          {/* Book Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-serif font-semibold text-bookconnect-brown line-clamp-2 mb-1">
                  {book.title}
                </h4>
                <p className="text-sm text-bookconnect-brown/70 line-clamp-1 mb-2">
                  by {book.author}
                </p>
              </div>

              {/* Actions */}
              {showActions && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsEditingNotes(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Notes
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => onRemove(book.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove from Collection
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Notes Section */}
            <div className="space-y-2">
              {isEditingNotes ? (
                <div className="space-y-2">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about this book in your collection..."
                    className="text-sm"
                    rows={2}
                    maxLength={500}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-bookconnect-brown/60">
                      {notes.length}/500
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelNotes}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveNotes}
                        className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {collectionBook.notes ? (
                    <p className="text-sm text-bookconnect-brown/80 bg-bookconnect-cream/30 p-2 rounded">
                      {collectionBook.notes}
                    </p>
                  ) : (
                    <p className="text-xs text-bookconnect-brown/50 italic">
                      No notes added
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Added Date */}
            <div className="flex items-center gap-1 mt-2 text-xs text-bookconnect-brown/60">
              <Calendar className="h-3 w-3" />
              Added {new Date(collectionBook.added_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const CollectionBooksView: React.FC<CollectionBooksViewProps> = ({
  collection,
  userId,
  onBack,
  onEditCollection,
  onDeleteCollection,
  onAddBooks,
  onBookCountChanged,
  className,
  showActions = true
}) => {
  const [books, setBooks] = useState<CollectionBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  // Load collection books
  useEffect(() => {
    loadBooks();
  }, [collection.id]);

  const loadBooks = async () => {
    setIsLoading(true);
    try {
      const collectionBooks = await getCollectionBooks(userId, collection.id);
      setBooks(collectionBooks);
    } catch (error) {
      console.error('Error loading collection books:', error);
      toast.error('Failed to load collection books');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle removing book from collection
  const handleRemoveBook = async (bookId: string) => {
    setIsRemoving(bookId);
    try {
      await removeBookFromCollection(userId, collection.id, bookId);
      setBooks(prev => prev.filter(cb => cb.personal_books?.id !== bookId));
      // Notify parent that book count has changed
      if (onBookCountChanged) {
        onBookCountChanged();
      }
      toast.success('Book removed from collection');
    } catch (error) {
      console.error('Error removing book from collection:', error);
      toast.error('Failed to remove book from collection');
    } finally {
      setIsRemoving(null);
    }
  };

  // Handle updating book notes
  const handleUpdateNotes = async (bookId: string, notes: string) => {
    try {
      await updateBookInCollection(userId, collection.id, bookId, notes);
      setBooks(prev => prev.map(cb =>
        cb.personal_books?.id === bookId
          ? { ...cb, notes }
          : cb
      ));
      toast.success('Notes updated');
    } catch (error) {
      console.error('Error updating book notes:', error);
      toast.error('Failed to update notes');
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="mt-1"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Collections
          </Button>
          
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-serif text-2xl font-semibold text-bookconnect-brown">
                {collection.name}
              </h1>
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
            
            {collection.description && (
              <p className="text-bookconnect-brown/70 mb-2">
                {collection.description}
              </p>
            )}
            
            <p className="text-sm text-bookconnect-brown/60">
              {books.length} book{books.length !== 1 ? 's' : ''} in this collection
            </p>
          </div>
        </div>

        {/* Collection Actions */}
        <div className="flex gap-2">
          {onAddBooks && (
            <Button
              onClick={onAddBooks}
              className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Books
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEditCollection && (
                <DropdownMenuItem onClick={() => onEditCollection(collection)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Collection
                </DropdownMenuItem>
              )}
              {onDeleteCollection && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDeleteCollection(collection.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Collection
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Books List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-bookconnect-brown/50" />
        </div>
      ) : books.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-16 w-16 text-bookconnect-brown/30 mx-auto mb-4" />
            <h3 className="font-serif text-xl font-semibold text-bookconnect-brown mb-2">
              No Books Yet
            </h3>
            <p className="text-bookconnect-brown/70 mb-6">
              This collection is empty. Add some books to get started!
            </p>
            {onAddBooks && (
              <Button
                onClick={onAddBooks}
                className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Book
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {books.map((collectionBook) => (
            <CollectionBookItem
              key={collectionBook.id}
              collectionBook={collectionBook}
              onRemove={handleRemoveBook}
              onUpdateNotes={handleUpdateNotes}
              showActions={showActions}
            />
          ))}
        </div>
      )}
    </div>
  );
};
