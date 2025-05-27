import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Search, BookOpen, Plus, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BookSearchInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  onBookSelect: (bookData: any) => void;
  storeId: string;
}

interface BookSearchResult {
  id: string;
  title: string;
  authors: string[];
  description?: string;
  imageUrl?: string;
  isbn?: string;
  publishedDate?: string;
  pageCount?: number;
}

/**
 * Book search interface for finding books via external APIs
 * Currently a placeholder - will be enhanced with Google Books API integration
 */
export const BookSearchInterface: React.FC<BookSearchInterfaceProps> = ({
  isOpen,
  onClose,
  onBookSelect,
  storeId
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BookSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      // TODO: Implement actual Google Books API integration
      // For now, show placeholder results
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      const mockResults: BookSearchResult[] = [
        {
          id: '1',
          title: 'The Great Gatsby',
          authors: ['F. Scott Fitzgerald'],
          description: 'A classic American novel set in the Jazz Age...',
          imageUrl: 'https://covers.openlibrary.org/b/isbn/9780743273565-M.jpg',
          isbn: '9780743273565',
          publishedDate: '1925',
          pageCount: 180
        },
        {
          id: '2',
          title: 'To Kill a Mockingbird',
          authors: ['Harper Lee'],
          description: 'A gripping tale of racial injustice and childhood innocence...',
          imageUrl: 'https://covers.openlibrary.org/b/isbn/9780061120084-M.jpg',
          isbn: '9780061120084',
          publishedDate: '1960',
          pageCount: 376
        }
      ].filter(book => 
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.authors.some(author => author.toLowerCase().includes(searchQuery.toLowerCase()))
      );

      setSearchResults(mockResults);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectBook = (book: BookSearchResult) => {
    // Convert search result to book data format
    const bookData = {
      book_title: book.title,
      book_author: book.authors.join(', '),
      book_isbn: book.isbn,
      custom_description: book.description,
      book_image_url: book.imageUrl,
      book_image_alt: `Cover of ${book.title}`
    };

    onBookSelect(bookData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Books
          </DialogTitle>
          <DialogDescription>
            Search for books using external book databases and add them to your carousel
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search by title, author, or ISBN</Label>
              <div className="flex gap-2">
                <Input
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter book title, author name, or ISBN..."
                  className="flex-1"
                />
                <Button type="submit" disabled={isSearching || !searchQuery.trim()}>
                  <Search className="h-4 w-4 mr-2" />
                  {isSearching ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </div>
          </form>

          {/* Coming Soon Notice */}
          <Alert>
            <BookOpen className="h-4 w-4" />
            <AlertDescription>
              <strong>Coming Soon:</strong> Integration with Google Books API and OpenLibrary for comprehensive book search. 
              Currently showing sample results for demonstration.
            </AlertDescription>
          </Alert>

          {/* Search Results */}
          {hasSearched && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">
                  Search Results ({searchResults.length})
                </h3>
                {searchResults.length === 0 && !isSearching && (
                  <p className="text-sm text-gray-500">No books found</p>
                )}
              </div>

              {searchResults.length > 0 && (
                <div className="grid gap-4">
                  {searchResults.map((book) => (
                    <Card key={book.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          {/* Book Cover */}
                          <div className="flex-shrink-0">
                            <div className="w-16 h-20 bg-gray-100 rounded overflow-hidden">
                              {book.imageUrl ? (
                                <img
                                  src={book.imageUrl}
                                  alt={`Cover of ${book.title}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <BookOpen className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Book Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 line-clamp-2">
                              {book.title}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              by {book.authors.join(', ')}
                            </p>
                            
                            {book.description && (
                              <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                                {book.description}
                              </p>
                            )}

                            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                              {book.isbn && <span>ISBN: {book.isbn}</span>}
                              {book.publishedDate && <span>Published: {book.publishedDate}</span>}
                              {book.pageCount && <span>{book.pageCount} pages</span>}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex-shrink-0 flex flex-col gap-2">
                            <Button
                              onClick={() => handleSelectBook(book)}
                              size="sm"
                              className="flex items-center gap-1"
                            >
                              <Plus className="h-3 w-3" />
                              Add to Carousel
                            </Button>
                            
                            {book.imageUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(book.imageUrl, '_blank')}
                                className="flex items-center gap-1"
                              >
                                <ExternalLink className="h-3 w-3" />
                                View Cover
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Manual Entry Option */}
          <div className="border-t pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Can't find the book you're looking for?
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  onClose();
                  onBookSelect({});
                }}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Add Book Manually
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
