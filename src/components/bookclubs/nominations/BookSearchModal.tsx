import React, { useState } from 'react';
import { Search, BookPlus, X, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { searchBooks } from '@/lib/api/bookclubs/books/search';
import { nominateBook } from '@/lib/api/bookclubs/nominations/create';
import { Book } from '@/types/books';
import { toast } from 'sonner';

interface BookSearchModalProps {
  open: boolean;
  onClose: () => void;
  clubId: string;
  onNominationSuccess: () => void;
}

const BookSearchModal: React.FC<BookSearchModalProps> = ({
  open,
  onClose,
  clubId,
  onNominationSuccess
}) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isNominating, setIsNominating] = useState(false);
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError(null);
    setSelectedBook(null);

    try {
      const results = await searchBooks(searchQuery);
      setSearchResults(results);
      if (results.length === 0) {
        setError('No books found. Try a different search term.');
      }
    } catch (err) {
      console.error('Error searching books:', err);
      setError('Failed to search for books. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleNominate = async () => {
    if (!user?.id || !selectedBook) return;

    setIsNominating(true);
    try {
      console.log('Nominating book:', selectedBook);
      await nominateBook(user.id, clubId, selectedBook);
      toast.success('Book nominated successfully!');
      onNominationSuccess();
    } catch (err: any) {
      console.error('Error nominating book:', err);

      // Display a more user-friendly error message based on the error
      if (err.message?.includes('already been nominated')) {
        toast.error('This book has already been nominated in this club');
      } else if (err.message?.includes('must be a member')) {
        toast.error('You must be a member of the club to nominate books');
      } else if (err.message?.includes('Invalid Google Books ID')) {
        toast.error('There was a problem with the book information. Please try a different book.');
      } else {
        toast.error(err.message || 'Failed to nominate book');
      }
    } finally {
      setIsNominating(false);
    }
  };

  const handleSelectBook = (book: Book) => {
    setSelectedBook(book);
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedBook(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookPlus className="h-5 w-5 text-bookconnect-terracotta" />
            Nominate a Book
          </DialogTitle>
          <DialogDescription>
            Search for a book to nominate for your book club.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSearch} className="flex gap-2 mt-4">
          <Input
            placeholder="Search by title, author, or ISBN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90"
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            <span className="ml-2">Search</span>
          </Button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
            {error}
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="mt-4 space-y-4 max-h-[40vh] overflow-y-auto pr-1">
            {searchResults.map((book) => (
              <Card
                key={book.id}
                className={`p-3 cursor-pointer transition-colors ${
                  selectedBook?.id === book.id
                    ? 'border-2 border-bookconnect-terracotta'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => handleSelectBook(book)}
              >
                <div className="flex">
                  {book.imageUrl ? (
                    <img
                      src={book.imageUrl}
                      alt={`Cover of ${book.title}`}
                      className="w-12 h-18 object-cover rounded shadow mr-3"
                    />
                  ) : (
                    <div className="w-12 h-18 bg-gray-200 rounded flex items-center justify-center mr-3">
                      <BookPlus className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium">{book.title}</h3>
                    <p className="text-sm text-gray-600">
                      {book.author || 'Unknown Author'}
                    </p>
                    {book.categories && book.categories.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {book.categories.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {selectedBook && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h3 className="font-medium">Selected Book</h3>
            <div className="flex mt-2">
              {selectedBook.imageUrl ? (
                <img
                  src={selectedBook.imageUrl}
                  alt={`Cover of ${selectedBook.title}`}
                  className="w-16 h-24 object-cover rounded shadow mr-4"
                />
              ) : (
                <div className="w-16 h-24 bg-gray-200 rounded flex items-center justify-center mr-4">
                  <BookPlus className="h-8 w-8 text-gray-400" />
                </div>
              )}
              <div>
                <h4 className="font-medium">{selectedBook.title}</h4>
                <p className="text-sm text-gray-600">
                  {selectedBook.author || 'Unknown Author'}
                </p>
                {selectedBook.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-3">
                    {selectedBook.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="mt-4 flex justify-between">
          <Button variant="outline" onClick={handleClose}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleNominate}
            disabled={!selectedBook || isNominating}
            className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90"
          >
            {isNominating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <BookPlus className="h-4 w-4 mr-2" />
            )}
            Nominate Book
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BookSearchModal;
