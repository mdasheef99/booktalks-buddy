/**
 * Add To Collection Modal Component
 * 
 * Modal for adding books to collections with selection interface
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
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FolderPlus, BookOpen, Loader2, Plus, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { 
  getUserCollections, 
  addBookToCollection, 
  isBookInCollection 
} from '@/services/books/collections';
import { AddToCollectionModalProps, CollectionSelectionItem } from './types';

export const AddToCollectionModal: React.FC<AddToCollectionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  book,
  userId,
  existingCollections = []
}) => {
  const [collections, setCollections] = useState<CollectionSelectionItem[]>([]);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load collections when modal opens
  useEffect(() => {
    if (isOpen && book) {
      loadCollections();
    }
  }, [isOpen, book, userId]);

  const loadCollections = async () => {
    setIsLoading(true);
    try {
      const userCollections = existingCollections.length > 0 
        ? existingCollections 
        : await getUserCollections(userId, { includeBookCount: true });

      // Check which collections already contain this book
      const collectionsWithStatus = await Promise.all(
        userCollections.map(async (collection) => {
          const isAlreadyAdded = await isBookInCollection(userId, collection.id, book.id);
          return {
            collection,
            isSelected: false,
            isAlreadyAdded
          };
        })
      );

      setCollections(collectionsWithStatus);
    } catch (error) {
      console.error('Error loading collections:', error);
      toast.error('Failed to load collections');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle collection selection
  const handleCollectionToggle = (collectionId: string, isAlreadyAdded: boolean) => {
    if (isAlreadyAdded) return; // Can't select collections that already have the book

    setSelectedCollectionIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(collectionId)) {
        newSet.delete(collectionId);
      } else {
        newSet.add(collectionId);
      }
      return newSet;
    });
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (selectedCollectionIds.size === 0) {
      toast.error('Please select at least one collection');
      return;
    }

    setIsSubmitting(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Add book to selected collections
      await Promise.all(
        Array.from(selectedCollectionIds).map(async (collectionId) => {
          try {
            await addBookToCollection(userId, collectionId, {
              book_id: book.id,
              notes: '' // Optional notes, empty for now
            });
            successCount++;
          } catch (error) {
            console.error(`Error adding book to collection ${collectionId}:`, error);
            // Don't count "already in collection" as an error for user feedback
            if (error instanceof Error && error.message.includes('already in this collection')) {
              // Skip counting this as an error since it's expected behavior
            } else {
              errorCount++;
            }
          }
        })
      );

      // Show appropriate success/error messages
      if (successCount > 0) {
        toast.success(
          `Book added to ${successCount} collection${successCount > 1 ? 's' : ''}`
        );
        onSuccess();
        onClose();
      }

      if (errorCount > 0) {
        toast.error(
          `Failed to add book to ${errorCount} collection${errorCount > 1 ? 's' : ''}`
        );
      }
    } catch (error) {
      console.error('Error adding book to collections:', error);
      toast.error('Failed to add book to collections');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedCollectionIds(new Set());
      onClose();
    }
  };

  if (!book) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-bookconnect-brown flex items-center gap-2">
            <FolderPlus className="h-5 w-5 text-bookconnect-terracotta" />
            Add to Collection
          </DialogTitle>
          <DialogDescription>
            Choose which collections to add "{book.title}" to.
          </DialogDescription>
        </DialogHeader>

        {/* Book Preview */}
        <div className="flex items-center gap-3 p-3 bg-bookconnect-cream/30 rounded-lg">
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
            <h4 className="font-medium text-bookconnect-brown line-clamp-1">
              {book.title}
            </h4>
            <p className="text-sm text-bookconnect-brown/70 line-clamp-1">
              by {book.author}
            </p>
          </div>
        </div>

        {/* Collections List */}
        <div className="space-y-2">
          <h4 className="font-medium text-bookconnect-brown">Select Collections:</h4>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-bookconnect-brown/50" />
            </div>
          ) : collections.length === 0 ? (
            <div className="text-center py-8 text-bookconnect-brown/60">
              <FolderPlus className="h-8 w-8 mx-auto mb-2 text-bookconnect-brown/30" />
              <p>No collections found. Create your first collection!</p>
            </div>
          ) : (
            <ScrollArea className="max-h-60">
              <div className="space-y-2">
                {collections.map(({ collection, isSelected, isAlreadyAdded }) => (
                  <Card
                    key={collection.id}
                    className={cn(
                      'cursor-pointer transition-colors',
                      isAlreadyAdded 
                        ? 'bg-bookconnect-sage/10 border-bookconnect-sage/30' 
                        : selectedCollectionIds.has(collection.id)
                        ? 'bg-bookconnect-terracotta/10 border-bookconnect-terracotta/30'
                        : 'hover:bg-bookconnect-cream/50'
                    )}
                    onClick={() => handleCollectionToggle(collection.id, isAlreadyAdded)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={isAlreadyAdded || selectedCollectionIds.has(collection.id)}
                          disabled={isAlreadyAdded}
                          className="flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-bookconnect-brown line-clamp-1">
                              {collection.name}
                            </span>
                            {isAlreadyAdded && (
                              <Badge variant="secondary" className="bg-bookconnect-sage/20 text-bookconnect-olive">
                                <Check className="h-3 w-3 mr-1" />
                                Added
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-bookconnect-brown/70">
                            <span>{collection.book_count || 0} books</span>
                            <span>•</span>
                            <span>{collection.is_public ? 'Public' : 'Private'}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
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
            disabled={isSubmitting || selectedCollectionIds.size === 0}
            className="flex-1 bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add to {selectedCollectionIds.size} Collection{selectedCollectionIds.size > 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
