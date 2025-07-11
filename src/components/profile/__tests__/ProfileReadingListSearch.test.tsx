/**
 * Profile Reading List Search Component Tests
 *
 * Tests for search and filter functionality in profile reading list viewing
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProfileReadingListSearch } from '../ProfileReadingListSearch';
import { ReadingListItem } from '@/services/books';

// Mock data
const mockReadingListItems: ReadingListItem[] = [
  {
    id: 'rl1',
    user_id: 'user1',
    book_id: 'book1',
    status: 'completed',
    rating: 5,
    review_text: 'Amazing classic novel about the American Dream',
    is_public: true,
    review_is_public: true,
    added_at: '2024-01-01T00:00:00Z',
    status_changed_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    personal_books: {
      id: 'book1',
      user_id: 'user1',
      google_books_id: 'gb1',
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      description: 'A classic American novel about the Jazz Age',
      thumbnail: 'https://example.com/gatsby.jpg',
      published_date: '1925',
      page_count: 180,
      categories: ['Fiction', 'Classic'],
      language: 'en',
      isbn_10: '1234567890',
      isbn_13: '1234567890123',
      added_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  },
  {
    id: 'rl2',
    user_id: 'user1',
    book_id: 'book2',
    status: 'currently_reading',
    rating: undefined,
    review_text: undefined,
    is_public: true,
    review_is_public: false,
    added_at: '2024-01-02T00:00:00Z',
    status_changed_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    personal_books: {
      id: 'book2',
      user_id: 'user1',
      google_books_id: 'gb2',
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      description: 'A novel about racial injustice in the American South',
      thumbnail: 'https://example.com/mockingbird.jpg',
      published_date: '1960',
      page_count: 281,
      categories: ['Fiction', 'Classic'],
      language: 'en',
      isbn_10: '0987654321',
      isbn_13: '0987654321098',
      added_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z'
    }
  },
  {
    id: 'rl3',
    user_id: 'user1',
    book_id: 'book3',
    status: 'want_to_read',
    rating: undefined,
    review_text: 'Looking forward to reading this dystopian masterpiece',
    is_public: true,
    review_is_public: true,
    added_at: '2024-01-03T00:00:00Z',
    status_changed_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
    personal_books: {
      id: 'book3',
      user_id: 'user1',
      google_books_id: 'gb3',
      title: '1984',
      author: 'George Orwell',
      description: 'A dystopian social science fiction novel',
      thumbnail: 'https://example.com/1984.jpg',
      published_date: '1949',
      page_count: 328,
      categories: ['Fiction', 'Dystopian'],
      language: 'en',
      isbn_10: '1122334455',
      isbn_13: '1122334455667',
      added_at: '2024-01-03T00:00:00Z',
      updated_at: '2024-01-03T00:00:00Z'
    }
  }
];

const defaultProps = {
  readingList: mockReadingListItems,
  username: 'testuser',
  isCurrentUser: false,
  onFilteredItemsChange: vi.fn()
};

describe('ProfileReadingListSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input with appropriate placeholder', () => {
    render(<ProfileReadingListSearch {...defaultProps} />);

    expect(screen.getByPlaceholderText("Search testuser's reading list...")).toBeInTheDocument();
    expect(screen.getByText('3 of 3 books')).toBeInTheDocument();
  });

  it('shows current user placeholder when isCurrentUser is true', () => {
    render(<ProfileReadingListSearch {...defaultProps} isCurrentUser={true} />);

    expect(screen.getByPlaceholderText('Search your reading list...')).toBeInTheDocument();
  });

  it('filters books by title search', async () => {
    const user = userEvent.setup();
    render(<ProfileReadingListSearch {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText("Search testuser's reading list...");
    await user.type(searchInput, 'gatsby');

    await waitFor(() => {
      expect(defaultProps.onFilteredItemsChange).toHaveBeenCalledWith([mockReadingListItems[0]]);
    });

    expect(screen.getByText('1 of 3 books')).toBeInTheDocument();
  });

  it('filters books by author search', async () => {
    const user = userEvent.setup();
    render(<ProfileReadingListSearch {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText("Search testuser's reading list...");
    await user.type(searchInput, 'orwell');

    await waitFor(() => {
      expect(defaultProps.onFilteredItemsChange).toHaveBeenCalledWith([mockReadingListItems[2]]);
    });
  });

  it('filters books by description search', async () => {
    const user = userEvent.setup();
    render(<ProfileReadingListSearch {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText("Search testuser's reading list...");
    await user.type(searchInput, 'dystopian');

    await waitFor(() => {
      expect(defaultProps.onFilteredItemsChange).toHaveBeenCalledWith([mockReadingListItems[2]]);
    });
  });

  it('filters books by review text search', async () => {
    const user = userEvent.setup();
    render(<ProfileReadingListSearch {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText("Search testuser's reading list...");
    await user.type(searchInput, 'american dream');

    await waitFor(() => {
      expect(defaultProps.onFilteredItemsChange).toHaveBeenCalledWith([mockReadingListItems[0]]);
    });
  });

  it('shows and hides filter panel', async () => {
    const user = userEvent.setup();
    render(<ProfileReadingListSearch {...defaultProps} />);

    // Initially filters should be hidden
    expect(screen.queryByText('Reading Status')).not.toBeInTheDocument();

    // Click filters button - use more specific selector
    const filtersButton = screen.getByText('Filters').closest('button');
    if (filtersButton) {
      await user.click(filtersButton);
    }

    // Filters should now be visible
    expect(screen.getByText('Reading Status')).toBeInTheDocument();
    expect(screen.getByText('All Books (3)')).toBeInTheDocument();
  });

  it('filters books by reading status', async () => {
    const user = userEvent.setup();
    render(<ProfileReadingListSearch {...defaultProps} />);

    // Open filters
    await user.click(screen.getByRole('button', { name: /filters/i }));

    // Select "Completed" status
    const statusSelect = screen.getByRole('combobox');
    await user.click(statusSelect);
    await user.click(screen.getByText(/completed \(1\)/i));

    await waitFor(() => {
      expect(defaultProps.onFilteredItemsChange).toHaveBeenCalledWith([mockReadingListItems[0]]);
    });

    expect(screen.getByText('1 of 3 books')).toBeInTheDocument();
  });

  it('shows status counts correctly', async () => {
    const user = userEvent.setup();
    render(<ProfileReadingListSearch {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /filters/i }));

    const statusSelect = screen.getByRole('combobox');
    await user.click(statusSelect);

    expect(screen.getByText('All Books (3)')).toBeInTheDocument();
    expect(screen.getByText('Want to Read (1)')).toBeInTheDocument();
    expect(screen.getByText('Currently Reading (1)')).toBeInTheDocument();
    expect(screen.getByText('Completed (1)')).toBeInTheDocument();
  });

  it('combines search and status filters', async () => {
    const user = userEvent.setup();
    render(<ProfileReadingListSearch {...defaultProps} />);

    // Add search term
    const searchInput = screen.getByPlaceholderText("Search testuser's reading list...");
    await user.type(searchInput, 'novel');

    // Open filters and select status
    await user.click(screen.getByRole('button', { name: /filters/i }));
    const statusSelect = screen.getByRole('combobox');
    await user.click(statusSelect);
    await user.click(screen.getByText(/completed/i));

    await waitFor(() => {
      // Should show books that match "novel" AND are completed
      expect(defaultProps.onFilteredItemsChange).toHaveBeenCalledWith([mockReadingListItems[0]]);
    });
  });

  it('shows active filters badges', async () => {
    const user = userEvent.setup();
    render(<ProfileReadingListSearch {...defaultProps} />);

    // Add search term
    const searchInput = screen.getByPlaceholderText("Search testuser's reading list...");
    await user.type(searchInput, 'gatsby');

    // Open filters and set status
    await user.click(screen.getByRole('button', { name: /filters/i }));
    const statusSelect = screen.getByRole('combobox');
    await user.click(statusSelect);
    await user.click(screen.getByText(/completed/i));

    await waitFor(() => {
      expect(screen.getByText('Active filters:')).toBeInTheDocument();
      expect(screen.getByText('Search: "gatsby"')).toBeInTheDocument();
      expect(screen.getByText('Status: completed')).toBeInTheDocument();
    });
  });

  it('clears individual filters', async () => {
    const user = userEvent.setup();
    render(<ProfileReadingListSearch {...defaultProps} />);

    // Add search term and status filter
    const searchInput = screen.getByPlaceholderText("Search testuser's reading list...");
    await user.type(searchInput, 'gatsby');

    await user.click(screen.getByRole('button', { name: /filters/i }));
    const statusSelect = screen.getByRole('combobox');
    await user.click(statusSelect);
    await user.click(screen.getByText(/completed/i));

    // Clear search filter
    const searchBadge = screen.getByText('Search: "gatsby"').closest('div');
    const clearSearchButton = searchBadge?.querySelector('button');
    if (clearSearchButton) {
      await user.click(clearSearchButton);
    }

    await waitFor(() => {
      expect(searchInput).toHaveValue('');
      expect(screen.queryByText('Search: "gatsby"')).not.toBeInTheDocument();
      expect(screen.getByText('Status: completed')).toBeInTheDocument();
    });
  });

  it('clears all filters', async () => {
    const user = userEvent.setup();
    render(<ProfileReadingListSearch {...defaultProps} />);

    // Add search term and status filter
    const searchInput = screen.getByPlaceholderText("Search testuser's reading list...");
    await user.type(searchInput, 'gatsby');

    await user.click(screen.getByRole('button', { name: /filters/i }));
    const statusSelect = screen.getByRole('combobox');
    await user.click(statusSelect);
    await user.click(screen.getByText(/completed/i));

    // Clear all filters
    await user.click(screen.getByRole('button', { name: /clear filters/i }));

    await waitFor(() => {
      expect(searchInput).toHaveValue('');
      expect(screen.queryByText('Active filters:')).not.toBeInTheDocument();
      expect(screen.getByText('3 of 3 books')).toBeInTheDocument();
    });
  });

  it('does not render when reading list is empty', () => {
    render(<ProfileReadingListSearch {...defaultProps} readingList={[]} />);

    expect(screen.queryByPlaceholderText("Search testuser's reading list...")).not.toBeInTheDocument();
  });

  it('clears search with X button', async () => {
    const user = userEvent.setup();
    render(<ProfileReadingListSearch {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText("Search testuser's reading list...");
    await user.type(searchInput, 'gatsby');

    // Click the X button to clear search
    const clearButton = screen.getByRole('button', { name: '' }); // X button has no accessible name
    await user.click(clearButton);

    expect(searchInput).toHaveValue('');
  });
});
