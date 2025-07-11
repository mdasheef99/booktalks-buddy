/**
 * Personal Books Section Search Integration Tests
 * 
 * Tests for search functionality integration in PersonalBooksSection
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PersonalBooksSection } from '../PersonalBooksSection';
import { PersonalBook, ReadingListItem } from '@/services/books';

// Mock PersonalBookCard component
jest.mock('@/components/books/PersonalBookCard', () => {
  return function MockPersonalBookCard({ book }: { book: PersonalBook }) {
    return (
      <div data-testid={`book-card-${book.id}`}>
        <h3>{book.title}</h3>
        <p>{book.author}</p>
      </div>
    );
  };
});

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
  }
];

const mockGetReadingListItem = (bookId: string): ReadingListItem | undefined => {
  return mockReadingListItems.find(item => item.book_id === bookId);
};

const defaultProps = {
  personalBooks: mockPersonalBooks,
  isLoadingLibrary: false,
  getReadingListItem: mockGetReadingListItem,
  onStatusChange: jest.fn(),
  onRate: jest.fn(),
  onEditReview: jest.fn(),
  onTogglePrivacy: jest.fn(),
  onRemove: jest.fn(),
  onRequestFromStore: jest.fn(),
  onNavigateToSearch: jest.fn()
};

describe('PersonalBooksSection Search Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all books initially', () => {
    render(<PersonalBooksSection {...defaultProps} />);

    expect(screen.getByTestId('book-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('book-card-2')).toBeInTheDocument();
    expect(screen.getByTestId('book-card-3')).toBeInTheDocument();
    expect(screen.getByText('3 of 3 books')).toBeInTheDocument();
  });

  it('filters books when searching by title', async () => {
    const user = userEvent.setup();
    render(<PersonalBooksSection {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(/search by title, author, or description/i);
    await user.type(searchInput, 'gatsby');

    await waitFor(() => {
      expect(screen.getByTestId('book-card-1')).toBeInTheDocument();
      expect(screen.queryByTestId('book-card-2')).not.toBeInTheDocument();
      expect(screen.queryByTestId('book-card-3')).not.toBeInTheDocument();
    });

    expect(screen.getByText('1 of 3 books')).toBeInTheDocument();
  });

  it('filters books when searching by author', async () => {
    const user = userEvent.setup();
    render(<PersonalBooksSection {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(/search by title, author, or description/i);
    await user.type(searchInput, 'orwell');

    await waitFor(() => {
      expect(screen.queryByTestId('book-card-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('book-card-2')).not.toBeInTheDocument();
      expect(screen.getByTestId('book-card-3')).toBeInTheDocument();
    });

    expect(screen.getByText('1 of 3 books')).toBeInTheDocument();
  });

  it('shows no results message when no books match search', async () => {
    const user = userEvent.setup();
    render(<PersonalBooksSection {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(/search by title, author, or description/i);
    await user.type(searchInput, 'nonexistent book');

    await waitFor(() => {
      expect(screen.queryByTestId('book-card-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('book-card-2')).not.toBeInTheDocument();
      expect(screen.queryByTestId('book-card-3')).not.toBeInTheDocument();
    });

    expect(screen.getByText('No Books Found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your search terms or filters.')).toBeInTheDocument();
    expect(screen.getByText('0 of 3 books')).toBeInTheDocument();
  });

  it('filters books by reading status', async () => {
    const user = userEvent.setup();
    render(<PersonalBooksSection {...defaultProps} />);

    // Open filters
    await user.click(screen.getByRole('button', { name: /filters/i }));
    
    // Select "Completed" status
    const statusSelect = screen.getByRole('combobox');
    await user.click(statusSelect);
    await user.click(screen.getByText(/completed \(1\)/i));

    await waitFor(() => {
      expect(screen.getByTestId('book-card-1')).toBeInTheDocument();
      expect(screen.queryByTestId('book-card-2')).not.toBeInTheDocument();
      expect(screen.queryByTestId('book-card-3')).not.toBeInTheDocument();
    });

    expect(screen.getByText('1 of 3 books')).toBeInTheDocument();
  });

  it('combines search and status filters', async () => {
    const user = userEvent.setup();
    render(<PersonalBooksSection {...defaultProps} />);

    // Add search term that matches multiple books
    const searchInput = screen.getByPlaceholderText(/search by title, author, or description/i);
    await user.type(searchInput, 'novel');

    // Open filters and select "No Status"
    await user.click(screen.getByRole('button', { name: /filters/i }));
    const statusSelect = screen.getByRole('combobox');
    await user.click(statusSelect);
    await user.click(screen.getByText(/no status \(2\)/i));

    await waitFor(() => {
      // Should show books that match "novel" AND have no reading status
      expect(screen.queryByTestId('book-card-1')).not.toBeInTheDocument(); // Has status
      expect(screen.getByTestId('book-card-2')).toBeInTheDocument(); // Matches "novel" and no status
      expect(screen.getByTestId('book-card-3')).toBeInTheDocument(); // Matches "novel" and no status
    });
  });

  it('clears filters correctly', async () => {
    const user = userEvent.setup();
    render(<PersonalBooksSection {...defaultProps} />);

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
      expect(screen.getByTestId('book-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('book-card-2')).toBeInTheDocument();
      expect(screen.getByTestId('book-card-3')).toBeInTheDocument();
    });

    expect(screen.getByText('3 of 3 books')).toBeInTheDocument();
    expect(searchInput).toHaveValue('');
  });

  it('shows empty library message when no books exist', () => {
    render(<PersonalBooksSection {...defaultProps} personalBooks={[]} />);

    expect(screen.getByText('Your Library is Empty')).toBeInTheDocument();
    expect(screen.getByText('Start building your personal library by discovering books.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /discover books/i })).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<PersonalBooksSection {...defaultProps} isLoadingLibrary={true} />);

    expect(screen.getByText('Loading your library...')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/search by title/i)).not.toBeInTheDocument();
  });
});
