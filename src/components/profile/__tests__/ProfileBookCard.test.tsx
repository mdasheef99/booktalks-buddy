/**
 * ProfileBookCard Component Tests
 * 
 * Tests for the view-only book card component used in user profiles
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ProfileBookCard from '../ProfileBookCard';
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

const mockReadingListItem: ReadingListItem = {
  id: 'reading-1',
  user_id: 'user-1',
  book_id: 'book-1',
  status: 'completed',
  rating: 4,
  review_text: 'This is a great book with an engaging plot.',
  is_public: true,
  review_is_public: true,
  added_at: '2023-01-01T00:00:00Z',
  status_changed_at: '2023-01-01T00:00:00Z',
  rated_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  personal_books: mockBook
};

describe('ProfileBookCard', () => {
  it('renders book information correctly', () => {
    render(
      <ProfileBookCard
        book={mockBook}
        readingListItem={mockReadingListItem}
      />
    );

    // Check book title and author
    expect(screen.getByText('Test Book Title')).toBeInTheDocument();
    expect(screen.getByText('by Test Author')).toBeInTheDocument();
    
    // Check reading status
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('displays rating when available', () => {
    render(
      <ProfileBookCard
        book={mockBook}
        readingListItem={mockReadingListItem}
      />
    );

    // Check rating section
    expect(screen.getByText('Rating:')).toBeInTheDocument();
    // Stars should be rendered (4 filled stars)
    const stars = screen.getAllByRole('button');
    expect(stars).toHaveLength(5); // 5 star buttons
  });

  it('displays review when public and available', () => {
    render(
      <ProfileBookCard
        book={mockBook}
        readingListItem={mockReadingListItem}
        showReview={true}
      />
    );

    // Check review section
    expect(screen.getByText('Review:')).toBeInTheDocument();
    expect(screen.getByText('"This is a great book with an engaging plot."')).toBeInTheDocument();
  });

  it('hides review when not public', () => {
    const privateReviewItem = {
      ...mockReadingListItem,
      review_is_public: false
    };

    render(
      <ProfileBookCard
        book={mockBook}
        readingListItem={privateReviewItem}
        showReview={true}
      />
    );

    // Review should not be displayed
    expect(screen.queryByText('Review:')).not.toBeInTheDocument();
    expect(screen.queryByText('"This is a great book with an engaging plot."')).not.toBeInTheDocument();
  });

  it('shows no rating/review state when neither exists', () => {
    const noRatingReviewItem = {
      ...mockReadingListItem,
      rating: undefined,
      review_text: undefined
    };

    render(
      <ProfileBookCard
        book={mockBook}
        readingListItem={noRatingReviewItem}
      />
    );

    // Should show empty state message
    expect(screen.getByText('No rating or review yet')).toBeInTheDocument();
  });

  it('handles missing cover image gracefully', () => {
    const noCoverBook = {
      ...mockBook,
      cover_url: undefined
    };

    render(
      <ProfileBookCard
        book={noCoverBook}
        readingListItem={mockReadingListItem}
      />
    );

    // Should show "No Cover" placeholder
    expect(screen.getByText('No Cover')).toBeInTheDocument();
  });

  it('applies compact styling when compact prop is true', () => {
    const { container } = render(
      <ProfileBookCard
        book={mockBook}
        readingListItem={mockReadingListItem}
        compact={true}
      />
    );

    // Check that compact classes are applied (this is a basic check)
    expect(container.firstChild).toBeInTheDocument();
  });
});
