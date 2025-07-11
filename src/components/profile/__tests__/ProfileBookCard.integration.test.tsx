/**
 * ProfileBookCard Integration Tests
 * 
 * Tests for ProfileBookCard with ReviewViewModal integration
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
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

const mockReadingListItemWithPublicReview: ReadingListItem = {
  id: 'item-1',
  user_id: 'user-1',
  book_id: 'book-1',
  status: 'completed',
  rating: 4,
  review_text: 'This is a great book with an amazing storyline.',
  is_public: true,
  review_is_public: true,
  added_at: '2023-01-01T00:00:00Z',
  status_changed_at: '2023-01-01T00:00:00Z',
  rated_at: '2023-01-02T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z'
};

const mockReadingListItemWithPrivateReview: ReadingListItem = {
  ...mockReadingListItemWithPublicReview,
  review_is_public: false
};

const mockReadingListItemNoReview: ReadingListItem = {
  ...mockReadingListItemWithPublicReview,
  review_text: undefined
};

describe('ProfileBookCard Integration', () => {
  it('renders book card with public review and opens modal on click', async () => {
    render(
      <ProfileBookCard
        book={mockBook}
        readingListItem={mockReadingListItemWithPublicReview}
        reviewerName="John Doe"
      />
    );

    // Check that book information is displayed
    expect(screen.getByText('Test Book Title')).toBeInTheDocument();
    expect(screen.getByText('by Test Author')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();

    // Check that review section is displayed
    expect(screen.getByText('Review:')).toBeInTheDocument();
    expect(screen.getByText('"This is a great book with an amazing storyline."')).toBeInTheDocument();
    expect(screen.getByText('Click to read full review')).toBeInTheDocument();

    // Click on review to open modal
    const reviewSection = screen.getByText('"This is a great book with an amazing storyline."');
    fireEvent.click(reviewSection);

    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByText('Book Review')).toBeInTheDocument();
    });

    // Check modal content
    expect(screen.getByText('John Doe\'s review of "Test Book Title"')).toBeInTheDocument();
    expect(screen.getByText('4/5 stars')).toBeInTheDocument();
    expect(screen.getByText('Public review')).toBeInTheDocument();
  });

  it('does not show review section for private reviews', () => {
    render(
      <ProfileBookCard
        book={mockBook}
        readingListItem={mockReadingListItemWithPrivateReview}
        reviewerName="John Doe"
      />
    );

    // Should show book information
    expect(screen.getByText('Test Book Title')).toBeInTheDocument();
    
    // Should not show review section
    expect(screen.queryByText('Review:')).not.toBeInTheDocument();
    expect(screen.queryByText('Click to read full review')).not.toBeInTheDocument();
    
    // Should show "No rating or review yet" message
    expect(screen.getByText('No rating or review yet')).toBeInTheDocument();
  });

  it('does not show review section when no review exists', () => {
    render(
      <ProfileBookCard
        book={mockBook}
        readingListItem={mockReadingListItemNoReview}
        reviewerName="John Doe"
      />
    );

    // Should show book information
    expect(screen.getByText('Test Book Title')).toBeInTheDocument();
    
    // Should not show review section
    expect(screen.queryByText('Review:')).not.toBeInTheDocument();
    
    // Should show rating but no review
    expect(screen.getByText('Rating:')).toBeInTheDocument();
  });

  it('closes modal when close button is clicked', async () => {
    render(
      <ProfileBookCard
        book={mockBook}
        readingListItem={mockReadingListItemWithPublicReview}
        reviewerName="John Doe"
      />
    );

    // Open modal
    const reviewSection = screen.getByText('"This is a great book with an amazing storyline."');
    fireEvent.click(reviewSection);

    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByText('Book Review')).toBeInTheDocument();
    });

    // Close modal
    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    // Wait for modal to disappear
    await waitFor(() => {
      expect(screen.queryByText('Book Review')).not.toBeInTheDocument();
    });
  });

  it('works without reviewer name', async () => {
    render(
      <ProfileBookCard
        book={mockBook}
        readingListItem={mockReadingListItemWithPublicReview}
      />
    );

    // Open modal
    const reviewSection = screen.getByText('"This is a great book with an amazing storyline."');
    fireEvent.click(reviewSection);

    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByText('Book Review')).toBeInTheDocument();
    });

    // Should show generic description without reviewer name
    expect(screen.getByText('Review of "Test Book Title"')).toBeInTheDocument();
  });

  it('handles compact mode correctly', () => {
    render(
      <ProfileBookCard
        book={mockBook}
        readingListItem={mockReadingListItemWithPublicReview}
        compact={true}
        reviewerName="John Doe"
      />
    );

    // Should still show all content in compact mode
    expect(screen.getByText('Test Book Title')).toBeInTheDocument();
    expect(screen.getByText('Review:')).toBeInTheDocument();
    expect(screen.getByText('"This is a great book with an amazing storyline."')).toBeInTheDocument();
  });

  it('shows rating when available', () => {
    render(
      <ProfileBookCard
        book={mockBook}
        readingListItem={mockReadingListItemWithPublicReview}
        reviewerName="John Doe"
      />
    );

    // Should show rating section
    expect(screen.getByText('Rating:')).toBeInTheDocument();
    
    // Should show star rating component (we can't easily test the stars, but we can check it renders)
    const ratingSection = screen.getByText('Rating:').closest('div');
    expect(ratingSection).toBeInTheDocument();
  });

  it('handles missing book cover gracefully', () => {
    const bookWithoutCover = { ...mockBook, cover_url: undefined };
    
    render(
      <ProfileBookCard
        book={bookWithoutCover}
        readingListItem={mockReadingListItemWithPublicReview}
        reviewerName="John Doe"
      />
    );

    // Should show "No Cover" placeholder
    expect(screen.getByText('No Cover')).toBeInTheDocument();
    
    // Should still show other content
    expect(screen.getByText('Test Book Title')).toBeInTheDocument();
  });

  it('respects showReview prop', () => {
    render(
      <ProfileBookCard
        book={mockBook}
        readingListItem={mockReadingListItemWithPublicReview}
        showReview={false}
        reviewerName="John Doe"
      />
    );

    // Should not show review section even if review exists and is public
    expect(screen.queryByText('Review:')).not.toBeInTheDocument();
    expect(screen.queryByText('"This is a great book with an amazing storyline."')).not.toBeInTheDocument();
  });
});
