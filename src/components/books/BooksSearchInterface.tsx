/**
 * Books Search Interface Component
 * 
 * Main search interface for discovering books via Google Books API
 * Follows BookConnect design system patterns
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, BookOpen, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BookType } from '@/types/books';
import { searchBooks } from '@/services/books';
import BookSearchCard from './BookSearchCard';
import { useDebounce } from '@/hooks/useDebounce';

interface BooksSearchInterfaceProps {
  onAddToLibrary?: (book: BookType) => Promise<void>;
  onAddToCollection?: (book: BookType) => void;
  onRequestFromStore?: (book: BookType) => void;
  userLibraryBooks?: string[]; // Google Books IDs of books already in library
  className?: string;
}

const BooksSearchInterface: React.FC<BooksSearchInterfaceProps> = ({
  onAddToLibrary,
  onAddToCollection,
  onRequestFromStore,
  userLibraryBooks = [],
  className
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BookType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounce search query to avoid excessive API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Perform search when debounced query changes
  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      performSearch(debouncedSearchQuery);
    } else {
      setSearchResults([]);
      setHasSearched(false);
      setError(null);
    }
  }, [debouncedSearchQuery]);

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      console.log('Searching for books:', query);
      const results = await searchBooks(query, 20);
      setSearchResults(results);
      console.log(`Found ${results.length} books`);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search books. Please try again.');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      performSearch(searchQuery.trim());
    }
  };

  const isBookInLibrary = (bookId: string): boolean => {
    return userLibraryBooks.includes(bookId);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Search Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-bookconnect-brown">
            <Search className="h-5 w-5" />
            Discover Books
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-bookconnect-brown/50" />
              <Input
                type="text"
                placeholder="Search by title, author, or ISBN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              type="submit"
              disabled={!searchQuery.trim() || isLoading}
              className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </form>

          {/* Search Stats */}
          {hasSearched && !isLoading && (
            <div className="mt-3 flex items-center justify-between text-sm text-bookconnect-brown/70">
              <span>
                {searchResults.length > 0 
                  ? `Found ${searchResults.length} book${searchResults.length !== 1 ? 's' : ''}`
                  : 'No books found'
                }
              </span>
              {searchResults.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  Powered by Google Books
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Results */}
      <div className="space-y-4">
        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(6)].map((_, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <Skeleton className="w-20 h-28 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-destructive/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <div>
                  <p className="font-medium">Search Error</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => performSearch(searchQuery)}
                className="mt-3"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {hasSearched && !isLoading && !error && searchResults.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpen className="h-12 w-12 text-bookconnect-brown/30 mx-auto mb-4" />
              <h3 className="font-serif text-lg font-semibold text-bookconnect-brown mb-2">
                No Books Found
              </h3>
              <p className="text-bookconnect-brown/70 mb-4">
                Try searching with different keywords or check your spelling.
              </p>
              <div className="text-sm text-bookconnect-brown/60">
                <p>Search tips:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Try searching by author name</li>
                  <li>Use the book's ISBN for exact matches</li>
                  <li>Search for partial titles</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Results Grid */}
        {!isLoading && !error && searchResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {searchResults.map((book) => (
              <BookSearchCard
                key={book.id}
                book={book}
                isInLibrary={isBookInLibrary(book.id)}
                onAddToLibrary={onAddToLibrary}
                onAddToCollection={onAddToCollection}
                onRequestFromStore={onRequestFromStore}
              />
            ))}
          </div>
        )}

        {/* Load More Button (if needed for pagination) */}
        {!isLoading && searchResults.length >= 20 && (
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => {
                // TODO: Implement pagination if needed
                console.log('Load more results');
              }}
              className="mt-4"
            >
              Load More Results
            </Button>
          </div>
        )}
      </div>

      {/* Search Suggestions (when no search has been performed) */}
      {!hasSearched && !isLoading && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <BookOpen className="h-12 w-12 text-bookconnect-brown/30 mx-auto mb-4" />
              <h3 className="font-serif text-lg font-semibold text-bookconnect-brown mb-2">
                Discover Your Next Great Read
              </h3>
              <p className="text-bookconnect-brown/70 mb-4">
                Search millions of books from Google Books to build your personal library.
              </p>
              
              {/* Popular Search Suggestions */}
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  'Fiction bestsellers',
                  'Science fiction',
                  'Mystery novels',
                  'Biography',
                  'Self-help',
                  'History'
                ].map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    onClick={() => setSearchQuery(suggestion)}
                    className="text-xs"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BooksSearchInterface;
