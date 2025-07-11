/**
 * Reading List Search Component Tests
 * 
 * Tests for search and filter functionality in reading list
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReadingListSearch } from '../ReadingListSearch';
import { PersonalBook, ReadingListItem } from '@/services/books';

// Mock data
const mockPersonalBooks: PersonalBook[] = [
  {
    id: '1',
    user_id: 'user1',
    google_books_id: 'book1',
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
  },
  {
    id: '2',
    user_id: 'user1',
    google_books_id: 'book2',
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
  },
  {
    id: '3',
    user_id: 'user1',
    google_books_id: 'book3',
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
];

const mockReadingListItems: ReadingListItem[] = [
  {
    id: 'rl1',
    user_id: 'user1',
    book_id: '1',
    status: 'completed',
    rating: 5,
    review_text: 'Amazing book!',
    is_public: true,
    review_is_public: true,
    added_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    status_changed_at: '2024-01-01T00:00:00Z',
    personal_books: mockPersonalBooks[0]
  },
  {
    id: 'rl2',
    user_id: 'user1',
    book_id: '2',
    status: 'currently_reading',
    rating: null,
    review_text: null,
    is_public: true,
    review_is_public: true,
    added_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    status_changed_at: '2024-01-02T00:00:00Z',
    personal_books: mockPersonalBooks[1]
  }
];

const mockGetReadingListItem = (bookId: string): ReadingListItem | undefined => {
  return mockReadingListItems.find(item => item.book_id === bookId);
};

describe('ReadingListSearch', () => {
  const mockOnFilteredBooksChange = jest.fn();

  beforeEach(() => {
    mockOnFilteredBooksChange.mockClear();
  });

  it('renders search input and filter controls', () => {
    render(
      <ReadingListSearch
        personalBooks={mockPersonalBooks}
        getReadingListItem={mockGetReadingListItem}
        onFilteredBooksChange={mockOnFilteredBooksChange}
      />
    );

    expect(screen.getByPlaceholderText(/search by title, author, or description/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument();
    expect(screen.getByText('3 of 3 books')).toBeInTheDocument();
  });

  it('filters books by title search', async () => {
    const user = userEvent.setup();
    
    render(
      <ReadingListSearch
        personalBooks={mockPersonalBooks}
        getReadingListItem={mockGetReadingListItem}
        onFilteredBooksChange={mockOnFilteredBooksChange}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search by title, author, or description/i);
    await user.type(searchInput, 'gatsby');

    await waitFor(() => {
      expect(mockOnFilteredBooksChange).toHaveBeenCalledWith([mockPersonalBooks[0]]);
    });
  });

  it('filters books by author search', async () => {
    const user = userEvent.setup();
    
    render(
      <ReadingListSearch
        personalBooks={mockPersonalBooks}
        getReadingListItem={mockGetReadingListItem}
        onFilteredBooksChange={mockOnFilteredBooksChange}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search by title, author, or description/i);
    await user.type(searchInput, 'orwell');

    await waitFor(() => {
      expect(mockOnFilteredBooksChange).toHaveBeenCalledWith([mockPersonalBooks[2]]);
    });
  });

  it('shows and hides filter panel', async () => {
    const user = userEvent.setup();
    
    render(
      <ReadingListSearch
        personalBooks={mockPersonalBooks}
        getReadingListItem={mockGetReadingListItem}
        onFilteredBooksChange={mockOnFilteredBooksChange}
      />
    );

    const filtersButton = screen.getByRole('button', { name: /filters/i });
    
    // Filter panel should not be visible initially
    expect(screen.queryByText(/reading status/i)).not.toBeInTheDocument();
    
    // Click to show filters
    await user.click(filtersButton);
    expect(screen.getByText(/reading status/i)).toBeInTheDocument();
    
    // Click to hide filters
    await user.click(filtersButton);
    expect(screen.queryByText(/reading status/i)).not.toBeInTheDocument();
  });

  it('filters books by reading status', async () => {
    const user = userEvent.setup();
    
    render(
      <ReadingListSearch
        personalBooks={mockPersonalBooks}
        getReadingListItem={mockGetReadingListItem}
        onFilteredBooksChange={mockOnFilteredBooksChange}
      />
    );

    // Open filters
    await user.click(screen.getByRole('button', { name: /filters/i }));
    
    // Select "Completed" status
    const statusSelect = screen.getByRole('combobox');
    await user.click(statusSelect);
    await user.click(screen.getByText(/completed/i));

    await waitFor(() => {
      expect(mockOnFilteredBooksChange).toHaveBeenCalledWith([mockPersonalBooks[0]]);
    });
  });

  it('shows correct status counts', async () => {
    const user = userEvent.setup();
    
    render(
      <ReadingListSearch
        personalBooks={mockPersonalBooks}
        getReadingListItem={mockGetReadingListItem}
        onFilteredBooksChange={mockOnFilteredBooksChange}
      />
    );

    // Open filters
    await user.click(screen.getByRole('button', { name: /filters/i }));
    
    // Check status counts in dropdown
    const statusSelect = screen.getByRole('combobox');
    await user.click(statusSelect);
    
    expect(screen.getByText(/all books \(3\)/i)).toBeInTheDocument();
    expect(screen.getByText(/completed \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/currently reading \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/no status \(1\)/i)).toBeInTheDocument();
  });

  it('clears all filters', async () => {
    const user = userEvent.setup();
    
    render(
      <ReadingListSearch
        personalBooks={mockPersonalBooks}
        getReadingListItem={mockGetReadingListItem}
        onFilteredBooksChange={mockOnFilteredBooksChange}
      />
    );

    // Add search term
    const searchInput = screen.getByPlaceholderText(/search by title, author, or description/i);
    await user.type(searchInput, 'gatsby');

    // Open filters and set status
    await user.click(screen.getByRole('button', { name: /filters/i }));
    const statusSelect = screen.getByRole('combobox');
    await user.click(statusSelect);
    await user.click(screen.getByText(/completed/i));

    // Clear filters
    await user.click(screen.getByRole('button', { name: /clear filters/i }));

    await waitFor(() => {
      expect(mockOnFilteredBooksChange).toHaveBeenCalledWith(mockPersonalBooks);
    });
    
    expect(searchInput).toHaveValue('');
  });

  it('shows no results message when no books match filters', async () => {
    const user = userEvent.setup();
    
    render(
      <ReadingListSearch
        personalBooks={mockPersonalBooks}
        getReadingListItem={mockGetReadingListItem}
        onFilteredBooksChange={mockOnFilteredBooksChange}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search by title, author, or description/i);
    await user.type(searchInput, 'nonexistent book');

    await waitFor(() => {
      expect(screen.getByText('0 of 3 books')).toBeInTheDocument();
    });
  });
});
