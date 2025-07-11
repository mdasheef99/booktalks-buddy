/**
 * Books Data Hook
 * 
 * Data fetching and state management for Books Section
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  PersonalBook,
  ReadingListItem,
  getUserBooks,
  getReadingList,
  addBookToLibrary,
  addToReadingList,
  updateReadingListItem,
  rateBook,
  isBookInLibrary,
  removeBookFromLibrary,
  createAuthenticatedStoreRequest,
  requestBookFromStore
} from '@/services/books';
import { BookType } from '@/types/books';

export interface BooksDataState {
  personalBooks: PersonalBook[];
  readingList: ReadingListItem[];
  userLibraryBookIds: string[];
  isLoadingLibrary: boolean;
}

export interface BooksDataActions {
  loadUserLibrary: () => Promise<void>;
  handleAddToLibrary: (book: BookType) => Promise<void>;
  handleStatusChange: (bookId: string, status: 'want_to_read' | 'currently_reading' | 'completed') => Promise<void>;
  handleRateBook: (bookId: string, rating: number) => Promise<void>;
  handleUpdateReview: (bookId: string, reviewText: string, reviewIsPublic?: boolean) => Promise<void>;
  handleTogglePrivacy: (bookId: string, isPublic: boolean) => Promise<void>;
  handleRemoveBook: (bookId: string) => Promise<boolean>;
  handleQuickRate: (rating: number, review?: string, reviewIsPublic?: boolean) => Promise<void>;
  handleSubmitStoreRequest: (book: BookType | PersonalBook, additionalNotes?: string) => Promise<boolean>;
  getReadingListItem: (bookId: string) => ReadingListItem | undefined;
}

export interface UseBooksDataReturn extends BooksDataState, BooksDataActions {}

export const useBooksData = (): UseBooksDataReturn => {
  const { user } = useAuth();
  
  // State
  const [personalBooks, setPersonalBooks] = useState<PersonalBook[]>([]);
  const [readingList, setReadingList] = useState<ReadingListItem[]>([]);
  const [userLibraryBookIds, setUserLibraryBookIds] = useState<string[]>([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);

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
    if (!user) return;

    try {
      // This function is called from QuickRateModal with a specific book
      // The book context should be passed from the parent component
      throw new Error('handleQuickRate requires book context from parent component');
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

  const handleUpdateReview = async (bookId: string, reviewText: string, reviewIsPublic: boolean = true) => {
    if (!user) return;

    try {
      await updateReadingListItem(user.id, bookId, {
        review_text: reviewText,
        review_is_public: reviewIsPublic
      });

      // Update local state
      setReadingList(prev =>
        prev.map(item =>
          item.book_id === bookId
            ? {
                ...item,
                review_text: reviewText,
                review_is_public: reviewIsPublic,
                updated_at: new Date().toISOString()
              }
            : item
        )
      );

      toast.success('Review updated');
    } catch (error) {
      console.error('Error updating review:', error);
      toast.error('Failed to update review');
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

  const handleRemoveBook = async (bookId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const success = await removeBookFromLibrary(user.id, bookId);

      if (success) {
        // Update local state - remove from all arrays
        const bookToRemove = personalBooks.find(book => book.id === bookId);
        setPersonalBooks(prev => prev.filter(book => book.id !== bookId));
        setReadingList(prev => prev.filter(item => item.book_id !== bookId));
        setUserLibraryBookIds(prev => prev.filter(id => id !== bookToRemove?.google_books_id));

        toast.success(`Removed book from your library`);
        return true;
      } else {
        throw new Error('Failed to remove book');
      }
    } catch (error) {
      console.error('Error removing book:', error);
      toast.error('Failed to remove book from library');
      return false;
    }
  };

  const handleSubmitStoreRequest = async (book: BookType | PersonalBook, additionalNotes?: string): Promise<boolean> => {
    if (!user) {
      toast.error('Please sign in to request books from stores');
      return false;
    }

    try {
      let result: any;

      if ('google_books_id' in book) {
        // PersonalBook - use requestBookFromStore
        result = await requestBookFromStore(
          user.id,
          user.email || '',
          user.user_metadata?.full_name || user.email || 'Unknown User',
          book,
          additionalNotes
        );
      } else {
        // BookType - use createAuthenticatedStoreRequest
        result = await createAuthenticatedStoreRequest(
          user.id,
          user.email || '',
          user.user_metadata?.full_name || user.email || 'Unknown User',
          {
            book_title: book.title,
            book_author: book.author,
            description: additionalNotes,
            google_books_id: book.id
          }
        );
      }

      if (result) {
        toast.success(`Request submitted to your book club's store successfully`);
        return true;
      } else {
        throw new Error('Failed to submit request');
      }
    } catch (error) {
      console.error('Error submitting store request:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit store request';
      toast.error(errorMessage);
      return false;
    }
  };

  // Get reading list item for a book
  const getReadingListItem = (bookId: string): ReadingListItem | undefined => {
    return readingList.find(item => item.book_id === bookId);
  };

  return {
    // State
    personalBooks,
    readingList,
    userLibraryBookIds,
    isLoadingLibrary,
    
    // Actions
    loadUserLibrary,
    handleAddToLibrary,
    handleStatusChange,
    handleRateBook,
    handleUpdateReview,
    handleTogglePrivacy,
    handleRemoveBook,
    handleQuickRate,
    handleSubmitStoreRequest,
    getReadingListItem
  };
};
