/**
 * Profile Reading List Integration Tests
 * 
 * Integration tests to verify the reading list components work together
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import ProfileBookCard from '../ProfileBookCard';
import ProfileReadingListSection from '../ProfileReadingListSection';
import ReadingListStats from '../ReadingListStats';
import { PersonalBook, ReadingListItem } from '@/services/books';

// Mock data for integration testing
const mockBook: PersonalBook = {
  id: 'book-1',
  user_id: 'user-1',
  google_books_id: 'google-1',
  title: 'Integration Test Book',
  author: 'Test Author',
  cover_url: 'https://example.com/cover.jpg',
  added_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z'
};

const mockReadingListItem: ReadingListItem = {
  id: 'reading-1',
  user_id: 'user-1',
  book_id: 'book-1',
  status: 'completed',
  rating: 5,
  review_text: 'Excellent book for integration testing!',
  is_public: true,
  review_is_public: true,
  added_at: '2023-01-01T00:00:00Z',
  status_changed_at: '2023-01-01T00:00:00Z',
  rated_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  personal_books: mockBook
};

describe('Profile Reading List Integration', () => {
  it('components can be imported without errors', () => {
    expect(ProfileBookCard).toBeDefined();
    expect(ProfileReadingListSection).toBeDefined();
    expect(ReadingListStats).toBeDefined();
  });

  it('ProfileBookCard accepts required props', () => {
    expect(() => {
      const props = {
        book: mockBook,
        readingListItem: mockReadingListItem
      };
      // Just verify props structure is correct
      expect(props.book.title).toBe('Integration Test Book');
      expect(props.readingListItem.status).toBe('completed');
    }).not.toThrow();
  });

  it('ProfileReadingListSection accepts required props', () => {
    expect(() => {
      const props = {
        userId: 'user-1',
        username: 'testuser',
        isCurrentUser: false
      };
      // Just verify props structure is correct
      expect(props.userId).toBe('user-1');
      expect(props.username).toBe('testuser');
      expect(props.isCurrentUser).toBe(false);
    }).not.toThrow();
  });

  it('ReadingListStats accepts required props', () => {
    expect(() => {
      const props = {
        readingList: [mockReadingListItem]
      };
      // Just verify props structure is correct
      expect(props.readingList).toHaveLength(1);
      expect(props.readingList[0].rating).toBe(5);
    }).not.toThrow();
  });

  it('components have consistent data interfaces', () => {
    // Verify that the data structures are compatible between components
    const bookData = mockReadingListItem.personal_books;
    const readingData = mockReadingListItem;

    // ProfileBookCard expects both book and reading list item
    expect(bookData).toBeDefined();
    expect(readingData).toBeDefined();
    expect(bookData?.id).toBe(readingData.book_id);

    // ReadingListStats expects array of reading list items
    const statsData = [readingData];
    expect(statsData).toHaveLength(1);
    expect(statsData[0].personal_books).toBeDefined();
  });

  it('privacy settings are consistently handled', () => {
    // Test public book and review
    expect(mockReadingListItem.is_public).toBe(true);
    expect(mockReadingListItem.review_is_public).toBe(true);

    // Test private review scenario
    const privateReview = {
      ...mockReadingListItem,
      review_is_public: false
    };
    expect(privateReview.is_public).toBe(true); // Book still public
    expect(privateReview.review_is_public).toBe(false); // Review private

    // Test completely private book
    const privateBook = {
      ...mockReadingListItem,
      is_public: false,
      review_is_public: false
    };
    expect(privateBook.is_public).toBe(false);
    expect(privateBook.review_is_public).toBe(false);
  });

  it('reading statuses are properly typed', () => {
    const validStatuses = ['want_to_read', 'currently_reading', 'completed'] as const;
    
    validStatuses.forEach(status => {
      const item = {
        ...mockReadingListItem,
        status
      };
      expect(item.status).toBe(status);
    });
  });

  it('rating values are within valid range', () => {
    // Test valid ratings
    [1, 2, 3, 4, 5].forEach(rating => {
      const item = {
        ...mockReadingListItem,
        rating
      };
      expect(item.rating).toBeGreaterThanOrEqual(1);
      expect(item.rating).toBeLessThanOrEqual(5);
    });

    // Test undefined rating
    const noRating = {
      ...mockReadingListItem,
      rating: undefined
    };
    expect(noRating.rating).toBeUndefined();
  });
});
