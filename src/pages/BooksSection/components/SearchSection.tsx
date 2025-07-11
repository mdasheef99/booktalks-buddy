/**
 * Search Section Component
 * 
 * Book search interface and results for Books Section
 */

import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { BookType } from '@/types/books';
import BooksSearchInterface from '@/components/books/BooksSearchInterface';

interface SearchSectionProps {
  onAddToLibrary: (book: BookType) => Promise<void>;
  onRequestFromStore: (book: BookType) => void;
  userLibraryBooks: string[];
}

export const SearchSection: React.FC<SearchSectionProps> = ({
  onAddToLibrary,
  onRequestFromStore,
  userLibraryBooks
}) => {
  const handleAddToCollection = (book: BookType) => {
    // TODO: Implement add to collection
    console.log('Add to collection:', book);
    toast.info('Collections feature coming soon!');
  };

  return (
    <TabsContent value="search" className="space-y-6">
      <BooksSearchInterface
        onAddToLibrary={onAddToLibrary}
        onAddToCollection={handleAddToCollection}
        onRequestFromStore={onRequestFromStore}
        userLibraryBooks={userLibraryBooks}
      />
    </TabsContent>
  );
};
