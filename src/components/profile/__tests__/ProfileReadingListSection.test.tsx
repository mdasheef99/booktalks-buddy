/**
 * ProfileReadingListSection Component Tests
 * 
 * Tests for the reading list section component used in user profiles
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProfileReadingListSection from '../ProfileReadingListSection';
import { ReadingListItem } from '@/services/books';

// Mock the API call
vi.mock('@/lib/api/books/reading-lists', () => ({
  getPublicReadingList: vi.fn()
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn()
  }
}));

// Mock ProfileBookCard component
vi.mock('../ProfileBookCard', () => ({
  default: ({ book, readingListItem }: any) => (
    <div data-testid="profile-book-card">
      <span>{book.title}</span>
      <span>{readingListItem.status}</span>
    </div>
  )
}));

import { getPublicReadingList } from '@/lib/api/books/reading-lists';

const mockGetPublicReadingList = getPublicReadingList as any;

// Mock data
const mockReadingListItems: ReadingListItem[] = [
  {
    id: 'reading-1',
    user_id: 'user-1',
    book_id: 'book-1',
    status: 'completed',
    rating: 4,
    review_text: 'Great book!',
    is_public: true,
    review_is_public: true,
    added_at: '2023-01-01T00:00:00Z',
    status_changed_at: '2023-01-01T00:00:00Z',
    rated_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    personal_books: {
      id: 'book-1',
      user_id: 'user-1',
      google_books_id: 'google-1',
      title: 'Test Book 1',
      author: 'Test Author 1',
      added_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    }
  },
  {
    id: 'reading-2',
    user_id: 'user-1',
    book_id: 'book-2',
    status: 'currently_reading',
    rating: undefined,
    review_text: undefined,
    is_public: true,
    review_is_public: true,
    added_at: '2023-01-02T00:00:00Z',
    status_changed_at: '2023-01-02T00:00:00Z',
    updated_at: '2023-01-02T00:00:00Z',
    personal_books: {
      id: 'book-2',
      user_id: 'user-1',
      google_books_id: 'google-2',
      title: 'Test Book 2',
      author: 'Test Author 2',
      added_at: '2023-01-02T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z'
    }
  }
];

describe('ProfileReadingListSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    mockGetPublicReadingList.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <ProfileReadingListSection
        userId="user-1"
        username="testuser"
        isCurrentUser={false}
      />
    );

    expect(screen.getByText('Loading reading list...')).toBeInTheDocument();
  });

  it('renders reading list with books', async () => {
    mockGetPublicReadingList.mockResolvedValue(mockReadingListItems);

    render(
      <ProfileReadingListSection
        userId="user-1"
        username="testuser"
        isCurrentUser={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Reading List')).toBeInTheDocument();
      expect(screen.getByText('(2 books)')).toBeInTheDocument();
    });

    // Check that book cards are rendered
    const bookCards = screen.getAllByTestId('profile-book-card');
    expect(bookCards).toHaveLength(2);
    
    expect(screen.getByText('Test Book 1')).toBeInTheDocument();
    expect(screen.getByText('Test Book 2')).toBeInTheDocument();
  });

  it('renders empty state for other users with no public books', async () => {
    mockGetPublicReadingList.mockResolvedValue([]);

    render(
      <ProfileReadingListSection
        userId="user-1"
        username="testuser"
        isCurrentUser={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No Public Books')).toBeInTheDocument();
      expect(screen.getByText("testuser hasn't shared any books publicly yet.")).toBeInTheDocument();
    });
  });

  it('renders different empty state for current user', async () => {
    mockGetPublicReadingList.mockResolvedValue([]);

    render(
      <ProfileReadingListSection
        userId="user-1"
        username="testuser"
        isCurrentUser={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Your Reading List is Private')).toBeInTheDocument();
      expect(screen.getByText("Your books are set to private or you haven't added any books yet.")).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    mockGetPublicReadingList.mockRejectedValue(new Error('API Error'));

    render(
      <ProfileReadingListSection
        userId="user-1"
        username="testuser"
        isCurrentUser={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Unable to Load Reading List')).toBeInTheDocument();
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });

  it('filters out items without book data', async () => {
    const itemsWithMissingBooks = [
      mockReadingListItems[0], // Has book data
      {
        ...mockReadingListItems[1],
        personal_books: undefined // Missing book data
      }
    ];

    mockGetPublicReadingList.mockResolvedValue(itemsWithMissingBooks);

    render(
      <ProfileReadingListSection
        userId="user-1"
        username="testuser"
        isCurrentUser={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('(1 book)')).toBeInTheDocument();
    });

    // Only one book card should be rendered
    const bookCards = screen.getAllByTestId('profile-book-card');
    expect(bookCards).toHaveLength(1);
  });

  describe('Search Integration', () => {
    it('renders search component when books are present', async () => {
      mockGetPublicReadingList.mockResolvedValue(mockReadingListItems);

      render(
        <ProfileReadingListSection
          userId="user-1"
          username="testuser"
          isCurrentUser={false}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Search testuser's reading list...")).toBeInTheDocument();
        expect(screen.getByText('2 of 2 books')).toBeInTheDocument();
      });
    });

    it('filters books when searching by title', async () => {
      const user = userEvent.setup();
      mockGetPublicReadingList.mockResolvedValue(mockReadingListItems);

      render(
        <ProfileReadingListSection
          userId="user-1"
          username="testuser"
          isCurrentUser={false}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('(2 books)')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText("Search testuser's reading list...");
      await user.type(searchInput, 'Test Book 1');

      await waitFor(() => {
        expect(screen.getByText('1 of 2 books')).toBeInTheDocument();
        expect(screen.getByText('Test Book 1')).toBeInTheDocument();
        expect(screen.queryByText('Test Book 2')).not.toBeInTheDocument();
      });
    });

    it('shows no results message when search has no matches', async () => {
      const user = userEvent.setup();
      mockGetPublicReadingList.mockResolvedValue(mockReadingListItems);

      render(
        <ProfileReadingListSection
          userId="user-1"
          username="testuser"
          isCurrentUser={false}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('(2 books)')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText("Search testuser's reading list...");
      await user.type(searchInput, 'nonexistent book');

      await waitFor(() => {
        expect(screen.getByText('No Books Found')).toBeInTheDocument();
        expect(screen.getByText('Try adjusting your search terms or filters.')).toBeInTheDocument();
        expect(screen.getByText('0 of 2 books')).toBeInTheDocument();
      });
    });

    it('filters books by reading status', async () => {
      const user = userEvent.setup();
      mockGetPublicReadingList.mockResolvedValue(mockReadingListItems);

      render(
        <ProfileReadingListSection
          userId="user-1"
          username="testuser"
          isCurrentUser={false}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('(2 books)')).toBeInTheDocument();
      });

      // Open filters
      await user.click(screen.getByRole('button', { name: /filters/i }));

      // Select "Completed" status
      const statusSelect = screen.getByRole('combobox');
      await user.click(statusSelect);
      await user.click(screen.getByText(/completed \(1\)/i));

      await waitFor(() => {
        expect(screen.getByText('1 of 2 books')).toBeInTheDocument();
        expect(screen.getByText('Test Book 1')).toBeInTheDocument();
        expect(screen.queryByText('Test Book 2')).not.toBeInTheDocument();
      });
    });

    it('updates show more button text based on filtered results', async () => {
      const user = userEvent.setup();
      // Create more items to trigger show more functionality
      const manyItems = Array.from({ length: 15 }, (_, i) => ({
        ...mockReadingListItems[0],
        id: `rl${i + 1}`,
        book_id: `book${i + 1}`,
        personal_books: {
          ...mockReadingListItems[0].personal_books!,
          id: `book${i + 1}`,
          title: `Test Book ${i + 1}`
        }
      }));

      mockGetPublicReadingList.mockResolvedValue(manyItems);

      render(
        <ProfileReadingListSection
          userId="user-1"
          username="testuser"
          isCurrentUser={false}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('(15 books)')).toBeInTheDocument();
        expect(screen.getByText(/show more books \(3 more\)/i)).toBeInTheDocument();
      });

      // Filter to reduce results
      const searchInput = screen.getByPlaceholderText("Search testuser's reading list...");
      await user.type(searchInput, 'Test Book 1');

      await waitFor(() => {
        // Should show filtered count in show more button
        expect(screen.getByText('10 of 15 books')).toBeInTheDocument();
      });
    });

    it('does not render search when no books are present', async () => {
      mockGetPublicReadingList.mockResolvedValue([]);

      render(
        <ProfileReadingListSection
          userId="user-1"
          username="testuser"
          isCurrentUser={false}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('No Public Books')).toBeInTheDocument();
      });

      expect(screen.queryByPlaceholderText("Search testuser's reading list...")).not.toBeInTheDocument();
    });
  });
});
