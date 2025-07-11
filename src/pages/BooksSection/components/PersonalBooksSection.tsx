/**
 * Personal Books Section Component
 *
 * User's personal book library display for Books Section
 */

import React, { useState, useCallback } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Library, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { PersonalBook, ReadingListItem } from '@/services/books';
import PersonalBookCard from '@/components/books/PersonalBookCard';
import { ReadingListSearch } from '@/components/books/ReadingListSearch';

interface PersonalBooksSectionProps {
  personalBooks: PersonalBook[];
  isLoadingLibrary: boolean;
  getReadingListItem: (bookId: string) => ReadingListItem | undefined;
  onStatusChange: (bookId: string, status: 'want_to_read' | 'currently_reading' | 'completed') => Promise<void>;
  onRate: (bookId: string, rating: number) => Promise<void>;
  onEditReview: (book: PersonalBook) => void;
  onTogglePrivacy: (bookId: string, isPublic: boolean) => Promise<void>;
  onRemove: (bookId: string) => void;
  onAddToCollection?: (book: PersonalBook) => void;
  onRequestFromStore: (book: PersonalBook) => void;
  onNavigateToSearch: () => void;
}

export const PersonalBooksSection: React.FC<PersonalBooksSectionProps> = ({
  personalBooks,
  isLoadingLibrary,
  getReadingListItem,
  onStatusChange,
  onRate,
  onEditReview,
  onTogglePrivacy,
  onRemove,
  onAddToCollection,
  onRequestFromStore,
  onNavigateToSearch
}) => {
  const [filteredBooks, setFilteredBooks] = useState<PersonalBook[]>(personalBooks);

  // Update filtered books when personalBooks changes
  React.useEffect(() => {
    setFilteredBooks(personalBooks);
  }, [personalBooks]);

  const handleAddToCollection = (book: PersonalBook) => {
    if (onAddToCollection) {
      onAddToCollection(book);
    }
  };

  const handleFilteredBooksChange = useCallback((books: PersonalBook[]) => {
    setFilteredBooks(books);
  }, []);

  return (
    <TabsContent value="library" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Library className="h-5 w-5" />
            My Library
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingLibrary ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bookconnect-brown mx-auto mb-4"></div>
              <p className="text-bookconnect-brown/70">Loading your library...</p>
            </div>
          ) : personalBooks.length === 0 ? (
            <div className="text-center py-8">
              <Library className="h-12 w-12 text-bookconnect-brown/30 mx-auto mb-4" />
              <h3 className="font-serif text-lg font-semibold text-bookconnect-brown mb-2">
                Your Library is Empty
              </h3>
              <p className="text-bookconnect-brown/70 mb-4">
                Start building your personal library by discovering books.
              </p>
              <Button
                onClick={onNavigateToSearch}
                className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Discover Books
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Search and Filter Component */}
              <ReadingListSearch
                personalBooks={personalBooks}
                getReadingListItem={getReadingListItem}
                onFilteredBooksChange={handleFilteredBooksChange}
              />

              {/* Books Grid */}
              {filteredBooks.length === 0 ? (
                <div className="text-center py-8">
                  <Library className="h-12 w-12 text-bookconnect-brown/30 mx-auto mb-4" />
                  <h3 className="font-serif text-lg font-semibold text-bookconnect-brown mb-2">
                    No Books Found
                  </h3>
                  <p className="text-bookconnect-brown/70">
                    Try adjusting your search terms or filters.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredBooks.map((book) => (
                    <PersonalBookCard
                      key={book.id}
                      book={book}
                      readingListItem={getReadingListItem(book.id)}
                      onStatusChange={onStatusChange}
                      onRate={onRate}
                      onEditReview={onEditReview}
                      onTogglePrivacy={onTogglePrivacy}
                      onRemove={onRemove}
                      onAddToCollection={handleAddToCollection}
                      onRequestFromStore={onRequestFromStore}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
};
