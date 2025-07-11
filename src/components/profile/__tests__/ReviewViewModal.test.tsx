/**
 * ReviewViewModal Component Tests
 * 
 * Tests for the review viewing modal component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ReviewViewModal from '../ReviewViewModal';
import { PersonalBook, ReadingListItem } from '@/services/books';

// Mock data
const mockBook: PersonalBook = {
  id: 'book-1',
  user_id: 'user-1',
  google_books_id: 'google-1',
  title: 'Test Book Title',
  author: 'Test Author',
  cover_url: 'https://example.com/cover.jpg',
  description: 'A test book description',
  genre: 'Fiction',
  published_date: '2023-01-01',
  page_count: 300,
  isbn: '1234567890',
  added_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z'
};

const mockReadingListItemWithReview: ReadingListItem = {
  id: 'item-1',
  user_id: 'user-1',
  book_id: 'book-1',
  status: 'completed',
  rating: 4,
  review_text: 'This is a great book with an amazing storyline. I really enjoyed reading it and would recommend it to anyone interested in fiction.',
  is_public: true,
  review_is_public: true,
  added_at: '2023-01-01T00:00:00Z',
  status_changed_at: '2023-01-01T00:00:00Z',
  rated_at: '2023-01-02T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z'
};

const mockReadingListItemPrivateReview: ReadingListItem = {
  ...mockReadingListItemWithReview,
  review_is_public: false
};

const mockReadingListItemNoReview: ReadingListItem = {
  ...mockReadingListItemWithReview,
  review_text: undefined
};

describe('ReviewViewModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it('renders review modal correctly with all information', () => {
    render(
      <ReviewViewModal
        isOpen={true}
        onClose={mockOnClose}
        book={mockBook}
        readingListItem={mockReadingListItemWithReview}
        reviewerName="John Doe"
      />
    );

    // Check modal title
    expect(screen.getByText('Book Review')).toBeInTheDocument();
    
    // Check book information
    expect(screen.getByText('Test Book Title')).toBeInTheDocument();
    expect(screen.getByText('by Test Author')).toBeInTheDocument();
    expect(screen.getByText('Fiction')).toBeInTheDocument();
    
    // Check rating
    expect(screen.getByText('4/5 stars')).toBeInTheDocument();
    
    // Check reviewer name
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    
    // Check review text
    expect(screen.getByText('"This is a great book with an amazing storyline. I really enjoyed reading it and would recommend it to anyone interested in fiction."')).toBeInTheDocument();
    
    // Check review date
    expect(screen.getByText('January 2, 2023')).toBeInTheDocument();
    
    // Check privacy indicator
    expect(screen.getByText('Public review')).toBeInTheDocument();
  });

  it('does not render when review is private', () => {
    const { container } = render(
      <ReviewViewModal
        isOpen={true}
        onClose={mockOnClose}
        book={mockBook}
        readingListItem={mockReadingListItemPrivateReview}
        reviewerName="John Doe"
      />
    );

    // Modal should not render for private reviews
    expect(container.firstChild).toBeNull();
  });

  it('does not render when no review text exists', () => {
    const { container } = render(
      <ReviewViewModal
        isOpen={true}
        onClose={mockOnClose}
        book={mockBook}
        readingListItem={mockReadingListItemNoReview}
        reviewerName="John Doe"
      />
    );

    // Modal should not render when no review exists
    expect(container.firstChild).toBeNull();
  });

  it('does not render when book is null', () => {
    const { container } = render(
      <ReviewViewModal
        isOpen={true}
        onClose={mockOnClose}
        book={null}
        readingListItem={mockReadingListItemWithReview}
        reviewerName="John Doe"
      />
    );

    // Modal should not render when book is null
    expect(container.firstChild).toBeNull();
  });

  it('does not render when readingListItem is null', () => {
    const { container } = render(
      <ReviewViewModal
        isOpen={true}
        onClose={mockOnClose}
        book={mockBook}
        readingListItem={null}
        reviewerName="John Doe"
      />
    );

    // Modal should not render when readingListItem is null
    expect(container.firstChild).toBeNull();
  });

  it('handles missing cover image gracefully', () => {
    const bookWithoutCover = { ...mockBook, cover_url: undefined };
    
    render(
      <ReviewViewModal
        isOpen={true}
        onClose={mockOnClose}
        book={bookWithoutCover}
        readingListItem={mockReadingListItemWithReview}
        reviewerName="John Doe"
      />
    );

    // Should show "No Cover" placeholder
    expect(screen.getByText('No Cover')).toBeInTheDocument();
  });

  it('works without reviewer name', () => {
    render(
      <ReviewViewModal
        isOpen={true}
        onClose={mockOnClose}
        book={mockBook}
        readingListItem={mockReadingListItemWithReview}
      />
    );

    // Should show generic description without reviewer name
    expect(screen.getByText('Review of "Test Book Title"')).toBeInTheDocument();
    
    // Should not show reviewer name in header
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  it('shows loading state correctly', () => {
    render(
      <ReviewViewModal
        isOpen={true}
        onClose={mockOnClose}
        book={mockBook}
        readingListItem={mockReadingListItemWithReview}
        reviewerName="John Doe"
        loading={true}
      />
    );

    // Should show loading message
    expect(screen.getByText('Loading review...')).toBeInTheDocument();
    
    // Should not show review content while loading
    expect(screen.queryByText('"This is a great book')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <ReviewViewModal
        isOpen={true}
        onClose={mockOnClose}
        book={mockBook}
        readingListItem={mockReadingListItemWithReview}
        reviewerName="John Doe"
      />
    );

    // Click close button
    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    // Should call onClose
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('handles review without rating', () => {
    const itemWithoutRating = { ...mockReadingListItemWithReview, rating: undefined };
    
    render(
      <ReviewViewModal
        isOpen={true}
        onClose={mockOnClose}
        book={mockBook}
        readingListItem={itemWithoutRating}
        reviewerName="John Doe"
      />
    );

    // Should not show rating section
    expect(screen.queryByText('/5 stars')).not.toBeInTheDocument();
    
    // Should still show review text
    expect(screen.getByText('"This is a great book')).toBeInTheDocument();
  });

  it('uses updated_at when rated_at is not available', () => {
    const itemWithoutRatedAt = { 
      ...mockReadingListItemWithReview, 
      rated_at: undefined,
      updated_at: '2023-03-15T00:00:00Z'
    };
    
    render(
      <ReviewViewModal
        isOpen={true}
        onClose={mockOnClose}
        book={mockBook}
        readingListItem={itemWithoutRatedAt}
        reviewerName="John Doe"
      />
    );

    // Should show updated_at date instead of rated_at
    expect(screen.getByText('March 15, 2023')).toBeInTheDocument();
  });
});
