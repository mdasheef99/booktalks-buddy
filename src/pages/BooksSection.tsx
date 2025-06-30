/**
 * Books Section Page
 * 
 * Main page for the Books Section with search, library, and collections
 * Follows BookConnect design system patterns
 */

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Library, FolderOpen, Plus, Store } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { BookType } from '@/types/books';
import {
  PersonalBook,
  ReadingListItem,
  addBookToLibrary,
  getUserBooks,
  getReadingList,
  addToReadingList,
  updateReadingListItem,
  rateBook,
  isBookInLibrary,
  removeBookFromLibrary,
  createAuthenticatedStoreRequest,
  requestBookFromStore
} from '@/services/books';
import BooksSearchInterface from '@/components/books/BooksSearchInterface';
import PersonalBookCard from '@/components/books/PersonalBookCard';
import QuickRateModal from '@/components/books/QuickRateModal';
import RemoveBookConfirmDialog from '@/components/books/RemoveBookConfirmDialog';
import { StoreRequestModal, UserStoreRequests } from '@/components/books/store-requests';

const BooksSection: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('search');
  
  // State for personal library
  const [personalBooks, setPersonalBooks] = useState<PersonalBook[]>([]);
  const [readingList, setReadingList] = useState<ReadingListItem[]>([]);
  const [userLibraryBookIds, setUserLibraryBookIds] = useState<string[]>([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);

  // State for quick rating modal
  const [quickRateModal, setQuickRateModal] = useState<{
    isOpen: boolean;
    book: PersonalBook | null;
  }>({
    isOpen: false,
    book: null
  });

  // State for remove book confirmation dialog
  const [removeBookModal, setRemoveBookModal] = useState<{
    isOpen: boolean;
    book: PersonalBook | null;
    isRemoving: boolean;
  }>({
    isOpen: false,
    book: null,
    isRemoving: false
  });

  // State for store request modal
  const [storeRequestModal, setStoreRequestModal] = useState<{
    isOpen: boolean;
    book: BookType | PersonalBook | null;
    isSubmitting: boolean;
  }>({
    isOpen: false,
    book: null,
    isSubmitting: false
  });

  // Load user's library on component mount
  useEffect(() => {
    if (user) {
      loadUserLibrary();
    }
  }, [user]);

  const loadUserLibrary = async () => {
    if (!user) return;

    setIsLoadingLibrary(true);
    try {
      const [books, readingListItems] = await Promise.all([
        getUserBooks(user.id),
        getReadingList(user.id, { includePrivate: true })
      ]);

      setPersonalBooks(books);
      setReadingList(readingListItems);
      
      // Extract Google Books IDs for search interface
      const bookIds = books.map(book => book.google_books_id);
      setUserLibraryBookIds(bookIds);

      console.log(`Loaded ${books.length} books and ${readingListItems.length} reading list items`);
    } catch (error) {
      console.error('Error loading user library:', error);
      toast.error('Failed to load your library');
    } finally {
      setIsLoadingLibrary(false);
    }
  };

  const handleAddToLibrary = async (book: BookType): Promise<void> => {
    if (!user) {
      toast.error('Please sign in to add books to your library');
      return;
    }

    try {
      // Check if book is already in library
      const alreadyExists = await isBookInLibrary(user.id, book.id);
      if (alreadyExists) {
        toast.info('This book is already in your library');
        return;
      }

      // Add book to personal library
      const personalBook = await addBookToLibrary(user.id, {
        google_books_id: book.id,
        title: book.title,
        author: book.author,
        cover_url: book.imageUrl,
        description: book.description,
        published_date: book.publishedDate,
        page_count: book.pageCount,
        genre: book.categories?.[0]
      });

      if (personalBook) {
        // Add to reading list with default status
        const readingListItem = await addToReadingList(user.id, {
          book_id: personalBook.id,
          status: 'want_to_read',
          is_public: true
        });

        if (readingListItem) {
          // Update local state
          setPersonalBooks(prev => [...prev, personalBook]);
          setReadingList(prev => [...prev, readingListItem]);
          setUserLibraryBookIds(prev => [...prev, book.id]);

          toast.success(`Added "${book.title}" to your library`);

          // Show quick rating modal
          setQuickRateModal({
            isOpen: true,
            book: personalBook
          });
        }
      }
    } catch (error) {
      console.error('Error adding book to library:', error);
      toast.error('Failed to add book to library');
    }
  };

  const handleQuickRate = async (
    rating: number, 
    review?: string, 
    reviewIsPublic?: boolean
  ): Promise<void> => {
    if (!user || !quickRateModal.book) return;

    try {
      await rateBook(
        user.id,
        quickRateModal.book.id,
        rating,
        review,
        reviewIsPublic
      );

      // Update local reading list state
      setReadingList(prev => 
        prev.map(item => 
          item.book_id === quickRateModal.book?.id
            ? { 
                ...item, 
                rating, 
                review_text: review,
                review_is_public: reviewIsPublic ?? true,
                rated_at: new Date().toISOString()
              }
            : item
        )
      );

      toast.success('Rating saved successfully');
    } catch (error) {
      console.error('Error saving rating:', error);
      toast.error('Failed to save rating');
      throw error;
    }
  };

  const handleStatusChange = async (bookId: string, status: 'want_to_read' | 'currently_reading' | 'completed') => {
    if (!user) return;

    try {
      await updateReadingListItem(user.id, bookId, { status });

      // Update local state
      setReadingList(prev =>
        prev.map(item =>
          item.book_id === bookId
            ? { ...item, status, status_changed_at: new Date().toISOString() }
            : item
        )
      );

      toast.success(`Status updated to ${status.replace('_', ' ')}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleRateBook = async (bookId: string, rating: number) => {
    if (!user) return;

    try {
      await updateReadingListItem(user.id, bookId, { rating });

      // Update local state
      setReadingList(prev =>
        prev.map(item =>
          item.book_id === bookId
            ? { ...item, rating, rated_at: new Date().toISOString() }
            : item
        )
      );

      toast.success('Rating updated');
    } catch (error) {
      console.error('Error updating rating:', error);
      toast.error('Failed to update rating');
    }
  };

  const handleTogglePrivacy = async (bookId: string, isPublic: boolean) => {
    if (!user) return;

    try {
      await updateReadingListItem(user.id, bookId, { is_public: isPublic });

      // Update local state
      setReadingList(prev =>
        prev.map(item =>
          item.book_id === bookId
            ? { ...item, is_public: isPublic }
            : item
        )
      );

      toast.success(`Book made ${isPublic ? 'public' : 'private'}`);
    } catch (error) {
      console.error('Error updating privacy:', error);
      toast.error('Failed to update privacy');
    }
  };

  // Get reading list item for a book
  const getReadingListItem = (bookId: string): ReadingListItem | undefined => {
    return readingList.find(item => item.book_id === bookId);
  };

  const handleRemoveBook = async (bookId: string) => {
    if (!user) return;

    // Find the book to remove
    const bookToRemove = personalBooks.find(book => book.id === bookId);
    if (!bookToRemove) {
      toast.error('Book not found');
      return;
    }

    // Show confirmation dialog
    setRemoveBookModal({
      isOpen: true,
      book: bookToRemove,
      isRemoving: false
    });
  };

  const handleConfirmRemoveBook = async () => {
    if (!user || !removeBookModal.book) return;

    setRemoveBookModal(prev => ({ ...prev, isRemoving: true }));

    try {
      const success = await removeBookFromLibrary(user.id, removeBookModal.book.id);

      if (success) {
        // Update local state - remove from all arrays
        setPersonalBooks(prev => prev.filter(book => book.id !== removeBookModal.book?.id));
        setReadingList(prev => prev.filter(item => item.book_id !== removeBookModal.book?.id));
        setUserLibraryBookIds(prev => prev.filter(id => id !== removeBookModal.book?.google_books_id));

        toast.success(`Removed "${removeBookModal.book.title}" from your library`);

        // Close modal
        setRemoveBookModal({
          isOpen: false,
          book: null,
          isRemoving: false
        });
      } else {
        throw new Error('Failed to remove book');
      }
    } catch (error) {
      console.error('Error removing book:', error);
      toast.error('Failed to remove book from library');
      setRemoveBookModal(prev => ({ ...prev, isRemoving: false }));
    }
  };

  const handleRequestFromStore = (book: BookType | PersonalBook) => {
    if (!user) {
      toast.error('Please sign in to request books from stores');
      return;
    }

    setStoreRequestModal({
      isOpen: true,
      book,
      isSubmitting: false
    });
  };

  const handleSubmitStoreRequest = async (additionalNotes?: string) => {
    if (!user || !storeRequestModal.book) return;

    setStoreRequestModal(prev => ({ ...prev, isSubmitting: true }));

    try {
      let result: any;

      if ('google_books_id' in storeRequestModal.book) {
        // PersonalBook - use requestBookFromStore
        result = await requestBookFromStore(
          user.id,
          user.email || '',
          user.user_metadata?.full_name || user.email || 'Unknown User',
          storeRequestModal.book,
          additionalNotes
        );
      } else {
        // BookType - use createAuthenticatedStoreRequest
        result = await createAuthenticatedStoreRequest(
          user.id,
          user.email || '',
          user.user_metadata?.full_name || user.email || 'Unknown User',
          {
            book_title: storeRequestModal.book.title,
            book_author: storeRequestModal.book.author,
            description: additionalNotes,
            google_books_id: storeRequestModal.book.id
          }
        );
      }

      if (result) {
        toast.success(`Request submitted to your book club's store successfully`);
        setStoreRequestModal({
          isOpen: false,
          book: null,
          isSubmitting: false
        });
      } else {
        throw new Error('Failed to submit request');
      }
    } catch (error) {
      console.error('Error submitting store request:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit store request';
      toast.error(errorMessage);
      setStoreRequestModal(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="h-12 w-12 text-bookconnect-brown/30 mx-auto mb-4" />
            <h2 className="font-serif text-xl font-semibold text-bookconnect-brown mb-2">
              Sign In Required
            </h2>
            <p className="text-bookconnect-brown/70">
              Please sign in to access your personal book library and reading lists.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-bookconnect-brown mb-2">
          Books
        </h1>
        <p className="text-bookconnect-brown/70">
          Discover, organize, and track your reading journey
        </p>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="search" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Discover
          </TabsTrigger>
          <TabsTrigger value="library" className="flex items-center gap-2">
            <Library className="h-4 w-4" />
            My Library
          </TabsTrigger>
          <TabsTrigger value="store-requests" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            Store Requests
          </TabsTrigger>
          <TabsTrigger value="collections" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Collections
          </TabsTrigger>
        </TabsList>

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-6">
          <BooksSearchInterface
            onAddToLibrary={handleAddToLibrary}
            onAddToCollection={(book) => {
              // TODO: Implement add to collection
              console.log('Add to collection:', book);
              toast.info('Collections feature coming soon!');
            }}
            onRequestFromStore={handleRequestFromStore}
            userLibraryBooks={userLibraryBookIds}
          />
        </TabsContent>

        {/* Library Tab */}
        <TabsContent value="library" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-serif text-bookconnect-brown">
                <Library className="h-5 w-5" />
                My Personal Library
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingLibrary ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bookconnect-terracotta mx-auto"></div>
                  <p className="text-bookconnect-brown/70 mt-2">Loading your library...</p>
                </div>
              ) : personalBooks.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-bookconnect-brown/30 mx-auto mb-4" />
                  <h3 className="font-serif text-lg font-semibold text-bookconnect-brown mb-2">
                    Your Library is Empty
                  </h3>
                  <p className="text-bookconnect-brown/70 mb-4">
                    Start building your personal library by discovering books.
                  </p>
                  <Button
                    onClick={() => setActiveTab('search')}
                    className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Discover Books
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {personalBooks.map((book) => (
                    <PersonalBookCard
                      key={book.id}
                      book={book}
                      readingListItem={getReadingListItem(book.id)}
                      onStatusChange={handleStatusChange}
                      onRate={handleRateBook}
                      onTogglePrivacy={handleTogglePrivacy}
                      onRemove={handleRemoveBook}
                      onAddToCollection={(bookId) => {
                        // TODO: Implement add to collection
                        console.log('Add to collection:', bookId);
                        toast.info('Collections feature coming soon!');
                      }}
                      onRequestFromStore={handleRequestFromStore}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Store Requests Tab */}
        <TabsContent value="store-requests" className="space-y-6">
          <UserStoreRequests />
        </TabsContent>

        {/* Collections Tab */}
        <TabsContent value="collections" className="space-y-6">
          <Card>
            <CardContent className="p-8 text-center">
              <FolderOpen className="h-12 w-12 text-bookconnect-brown/30 mx-auto mb-4" />
              <h3 className="font-serif text-lg font-semibold text-bookconnect-brown mb-2">
                Collections Coming Soon
              </h3>
              <p className="text-bookconnect-brown/70">
                Organize your books into custom collections and lists.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Rate Modal */}
      <QuickRateModal
        isOpen={quickRateModal.isOpen}
        onClose={() => setQuickRateModal({ isOpen: false, book: null })}
        book={quickRateModal.book}
        onSubmit={handleQuickRate}
      />

      {/* Remove Book Confirmation Dialog */}
      <RemoveBookConfirmDialog
        isOpen={removeBookModal.isOpen}
        onClose={() => setRemoveBookModal({ isOpen: false, book: null, isRemoving: false })}
        book={removeBookModal.book}
        onConfirm={handleConfirmRemoveBook}
        isRemoving={removeBookModal.isRemoving}
      />

      {/* Store Request Modal */}
      <StoreRequestModal
        isOpen={storeRequestModal.isOpen}
        onClose={() => setStoreRequestModal({ isOpen: false, book: null, isSubmitting: false })}
        book={storeRequestModal.book}
        onSubmit={handleSubmitStoreRequest}
        isSubmitting={storeRequestModal.isSubmitting}
      />
    </div>
  );
};

export default BooksSection;
