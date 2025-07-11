/**
 * Books Section Page - Refactored
 * 
 * Main page container with layout and navigation for Books Section
 * Follows BookConnect design system patterns
 */

import React, { useState } from 'react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { BookType } from '@/types/books';
import { PersonalBook } from '@/services/books';

// Import hooks
import { useBooksData } from './hooks/useBooksData';
import { useBooksNavigation } from './hooks/useBooksNavigation';

// Import components
import { BooksHeader } from './components/BooksHeader';
import { SearchSection } from './components/SearchSection';
import { PersonalBooksSection } from './components/PersonalBooksSection';
import { StoreRequestsSection } from './components/StoreRequestsSection';
import { CollectionsSection } from './components/CollectionsSection';
import { QuickActions } from './components/QuickActions';
import ReviewEditModal from '@/components/books/ReviewEditModal';
import { AddToCollectionModal } from '@/components/books/collections/AddToCollectionModal';

const BooksSection: React.FC = () => {
  const { user } = useAuth();
  
  // Hooks
  const booksData = useBooksData();
  const navigation = useBooksNavigation('search');

  // Modal states
  const [quickRateModal, setQuickRateModal] = useState<{
    isOpen: boolean;
    book: PersonalBook | null;
  }>({
    isOpen: false,
    book: null
  });

  const [removeBookModal, setRemoveBookModal] = useState<{
    isOpen: boolean;
    book: PersonalBook | null;
    isRemoving: boolean;
  }>({
    isOpen: false,
    book: null,
    isRemoving: false
  });

  const [storeRequestModal, setStoreRequestModal] = useState<{
    isOpen: boolean;
    book: BookType | PersonalBook | null;
    isSubmitting: boolean;
  }>({
    isOpen: false,
    book: null,
    isSubmitting: false
  });

  const [reviewEditModal, setReviewEditModal] = useState<{
    isOpen: boolean;
    book: PersonalBook | null;
  }>({
    isOpen: false,
    book: null
  });

  const [addToCollectionModal, setAddToCollectionModal] = useState<{
    isOpen: boolean;
    book: PersonalBook | null;
  }>({
    isOpen: false,
    book: null
  });

  // Collections refresh trigger
  const [collectionsRefreshTrigger, setCollectionsRefreshTrigger] = useState(0);

  // Enhanced handlers that integrate with modals
  const handleAddToLibraryWithRating = async (book: BookType): Promise<void> => {
    await booksData.handleAddToLibrary(book);
    
    // Find the newly added book to show quick rating modal
    const addedBook = booksData.personalBooks.find(pb => pb.google_books_id === book.id);
    if (addedBook) {
      setQuickRateModal({
        isOpen: true,
        book: addedBook
      });
    }
  };

  const handleQuickRate = async (
    rating: number, 
    review?: string, 
    reviewIsPublic?: boolean
  ): Promise<void> => {
    if (!user || !quickRateModal.book) return;

    try {
      await booksData.handleRateBook(quickRateModal.book.id, rating);
      
      // If there's a review, update it separately
      if (review) {
        await booksData.handleUpdateReview(quickRateModal.book.id, review, reviewIsPublic);
      }

      toast.success('Rating saved successfully');
    } catch (error) {
      console.error('Error saving rating:', error);
      toast.error('Failed to save rating');
      throw error;
    }
  };

  const handleEditReview = (book: PersonalBook) => {
    setReviewEditModal({
      isOpen: true,
      book
    });
  };

  const handleSubmitReview = async (reviewText: string, reviewIsPublic: boolean) => {
    if (!reviewEditModal.book) return;

    try {
      await booksData.handleUpdateReview(reviewEditModal.book.id, reviewText, reviewIsPublic);
      toast.success(reviewText.trim() ? 'Review updated successfully' : 'Review deleted successfully');
    } catch (error) {
      console.error('Error updating review:', error);
      toast.error('Failed to update review');
      throw error;
    }
  };

  const handleAddToCollection = (book: PersonalBook) => {
    setAddToCollectionModal({
      isOpen: true,
      book
    });
  };

  const handleRemoveBook = async (bookId: string) => {
    if (!user) return;

    // Find the book to remove
    const bookToRemove = booksData.personalBooks.find(book => book.id === bookId);
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
      const success = await booksData.handleRemoveBook(removeBookModal.book.id);

      if (success) {
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
      const success = await booksData.handleSubmitStoreRequest(storeRequestModal.book, additionalNotes);

      if (success) {
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
      setStoreRequestModal(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  // Show sign-in prompt for unauthenticated users
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
      {/* Page Header with Navigation */}
      <BooksHeader
        activeTab={navigation.activeTab}
        onTabChange={navigation.setActiveTab}
      />

      {/* Main Content */}
      <Tabs value={navigation.activeTab} onValueChange={navigation.setActiveTab} className="space-y-6">
        {/* Search Tab */}
        <SearchSection
          onAddToLibrary={handleAddToLibraryWithRating}
          onRequestFromStore={handleRequestFromStore}
          userLibraryBooks={booksData.userLibraryBookIds}
        />

        {/* Library Tab */}
        <PersonalBooksSection
          personalBooks={booksData.personalBooks}
          isLoadingLibrary={booksData.isLoadingLibrary}
          getReadingListItem={booksData.getReadingListItem}
          onStatusChange={booksData.handleStatusChange}
          onRate={booksData.handleRateBook}
          onEditReview={handleEditReview}
          onTogglePrivacy={booksData.handleTogglePrivacy}
          onRemove={handleRemoveBook}
          onAddToCollection={handleAddToCollection}
          onRequestFromStore={handleRequestFromStore}
          onNavigateToSearch={navigation.navigateToSearch}
        />

        {/* Store Requests Tab */}
        <StoreRequestsSection />

        {/* Collections Tab */}
        <CollectionsSection
          userId={user?.id || ''}
          personalBooks={booksData.personalBooks}
          refreshTrigger={collectionsRefreshTrigger}
        />
      </Tabs>

      {/* Quick Actions Modals */}
      <QuickActions
        quickRateModal={quickRateModal}
        onQuickRateModalChange={setQuickRateModal}
        onQuickRate={handleQuickRate}
        removeBookModal={removeBookModal}
        onRemoveBookModalChange={setRemoveBookModal}
        onConfirmRemoveBook={handleConfirmRemoveBook}
        storeRequestModal={storeRequestModal}
        onStoreRequestModalChange={setStoreRequestModal}
        onSubmitStoreRequest={handleSubmitStoreRequest}
      />

      {/* Review Edit Modal */}
      <ReviewEditModal
        isOpen={reviewEditModal.isOpen}
        book={reviewEditModal.book}
        readingListItem={reviewEditModal.book ? booksData.getReadingListItem(reviewEditModal.book.id) : null}
        onClose={() => setReviewEditModal({ isOpen: false, book: null })}
        onSubmit={handleSubmitReview}
      />

      {/* Add to Collection Modal */}
      <AddToCollectionModal
        isOpen={addToCollectionModal.isOpen}
        book={addToCollectionModal.book}
        onClose={() => setAddToCollectionModal({ isOpen: false, book: null })}
        onSuccess={() => {
          setAddToCollectionModal({ isOpen: false, book: null });
          // Trigger collections refresh to update book counts
          setCollectionsRefreshTrigger(prev => prev + 1);
          toast.success('Book added to collections successfully!');
        }}
        userId={user?.id || ''}
      />
    </div>
  );
};

export default BooksSection;
