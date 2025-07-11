/**
 * ProfileCollectionsSection Component Tests
 * 
 * Tests for the ProfileCollectionsSection component including:
 * - Loading states
 * - Error handling
 * - Empty states (current user vs others)
 * - Collections display
 * - Privacy controls
 * - Pagination functionality
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { toast } from 'sonner';
import ProfileCollectionsSection from '../ProfileCollectionsSection';
import { getPublicCollections } from '@/services/books/collections';
import { BookCollection } from '@/services/books/collections';

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn()
  }
}));

vi.mock('@/services/books/collections', () => ({
  getPublicCollections: vi.fn()
}));

vi.mock('@/components/books/collections/CollectionCard', () => ({
  CollectionCard: ({ collection }: { collection: BookCollection }) => (
    <div data-testid={`collection-${collection.id}`}>
      <h3>{collection.name}</h3>
      <p>{collection.description}</p>
      <span>Books: {collection.book_count}</span>
    </div>
  )
}));

const mockGetPublicCollections = getPublicCollections as ReturnType<typeof vi.fn>;

describe('ProfileCollectionsSection', () => {
  const defaultProps = {
    userId: 'test-user-id',
    username: 'testuser',
    isCurrentUser: false
  };

  const mockCollections: BookCollection[] = [
    {
      id: '1',
      user_id: 'test-user-id',
      name: 'Sci-Fi Favorites',
      description: 'My favorite science fiction books',
      is_public: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      book_count: 5,
      preview_covers: ['cover1.jpg', 'cover2.jpg']
    },
    {
      id: '2',
      user_id: 'test-user-id',
      name: 'Classic Literature',
      description: 'Timeless classics',
      is_public: true,
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
      book_count: 8,
      preview_covers: ['cover3.jpg']
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should display loading state initially', async () => {
      mockGetPublicCollections.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<ProfileCollectionsSection {...defaultProps} />);

      expect(screen.getByText('Loading collections...')).toBeInTheDocument();
      expect(screen.getByText('Collections')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error state when API call fails', async () => {
      const errorMessage = 'Failed to fetch collections';
      mockGetPublicCollections.mockRejectedValue(new Error(errorMessage));

      render(<ProfileCollectionsSection {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Unable to Load Collections')).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      expect(toast.error).toHaveBeenCalledWith('Failed to load collections');
    });
  });

  describe('Empty State', () => {
    it('should display appropriate empty state for other users', async () => {
      mockGetPublicCollections.mockResolvedValue([]);

      render(<ProfileCollectionsSection {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('No Public Collections')).toBeInTheDocument();
        expect(screen.getByText('testuser hasn\'t shared any collections publicly yet.')).toBeInTheDocument();
      });
    });

    it('should display appropriate empty state for current user', async () => {
      mockGetPublicCollections.mockResolvedValue([]);

      render(<ProfileCollectionsSection {...defaultProps} isCurrentUser={true} />);

      await waitFor(() => {
        expect(screen.getByText('Your Collections are Private')).toBeInTheDocument();
        expect(screen.getByText('Your collections are set to private or you haven\'t created any collections yet.')).toBeInTheDocument();
      });
    });
  });

  describe('Collections Display', () => {
    it('should display collections when data is loaded', async () => {
      mockGetPublicCollections.mockResolvedValue(mockCollections);

      render(<ProfileCollectionsSection {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Collections')).toBeInTheDocument();
        expect(screen.getByText('(2 collections)')).toBeInTheDocument();
        expect(screen.getByTestId('collection-1')).toBeInTheDocument();
        expect(screen.getByTestId('collection-2')).toBeInTheDocument();
        expect(screen.getByText('Sci-Fi Favorites')).toBeInTheDocument();
        expect(screen.getByText('Classic Literature')).toBeInTheDocument();
      });
    });

    it('should call getPublicCollections with correct parameters', async () => {
      mockGetPublicCollections.mockResolvedValue(mockCollections);

      render(<ProfileCollectionsSection {...defaultProps} />);

      await waitFor(() => {
        expect(mockGetPublicCollections).toHaveBeenCalledWith('test-user-id', {
          includeBookCount: true,
          includePreviewCovers: true,
          sortBy: 'updated_at',
          sortOrder: 'desc',
          limit: 50
        });
      });
    });
  });

  describe('Pagination', () => {
    it('should show "Show More" button when there are more than 12 collections', async () => {
      const manyCollections = Array.from({ length: 15 }, (_, i) => ({
        ...mockCollections[0],
        id: `collection-${i}`,
        name: `Collection ${i}`
      }));

      mockGetPublicCollections.mockResolvedValue(manyCollections);

      render(<ProfileCollectionsSection {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Show More Collections (3 more)')).toBeInTheDocument();
      });
    });

    it('should expand to show all collections when "Show More" is clicked', async () => {
      const manyCollections = Array.from({ length: 15 }, (_, i) => ({
        ...mockCollections[0],
        id: `collection-${i}`,
        name: `Collection ${i}`
      }));

      mockGetPublicCollections.mockResolvedValue(manyCollections);

      render(<ProfileCollectionsSection {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Show More Collections (3 more)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Show More Collections (3 more)'));

      expect(screen.getByText('Show Less')).toBeInTheDocument();
      expect(screen.queryByText('Show More Collections (3 more)')).not.toBeInTheDocument();
    });

    it('should collapse to show initial limit when "Show Less" is clicked', async () => {
      const manyCollections = Array.from({ length: 15 }, (_, i) => ({
        ...mockCollections[0],
        id: `collection-${i}`,
        name: `Collection ${i}`
      }));

      mockGetPublicCollections.mockResolvedValue(manyCollections);

      render(<ProfileCollectionsSection {...defaultProps} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Show More Collections (3 more)'));
      });

      fireEvent.click(screen.getByText('Show Less'));

      expect(screen.getByText('Show More Collections (3 more)')).toBeInTheDocument();
      expect(screen.queryByText('Show Less')).not.toBeInTheDocument();
    });

    it('should not show pagination controls when collections are 12 or fewer', async () => {
      mockGetPublicCollections.mockResolvedValue(mockCollections);

      render(<ProfileCollectionsSection {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByText(/Show More/)).not.toBeInTheDocument();
        expect(screen.queryByText('Show Less')).not.toBeInTheDocument();
      });
    });
  });

  describe('Privacy Controls', () => {
    it('should only call getPublicCollections (not all collections)', async () => {
      mockGetPublicCollections.mockResolvedValue(mockCollections);

      render(<ProfileCollectionsSection {...defaultProps} />);

      await waitFor(() => {
        expect(mockGetPublicCollections).toHaveBeenCalled();
        // Verify it's specifically the public collections function
        expect(mockGetPublicCollections).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            includeBookCount: true,
            includePreviewCovers: true
          })
        );
      });
    });
  });

  describe('Component Props', () => {
    it('should apply custom className when provided', async () => {
      mockGetPublicCollections.mockResolvedValue(mockCollections);

      const { container } = render(
        <ProfileCollectionsSection {...defaultProps} className="custom-class" />
      );

      await waitFor(() => {
        expect(container.querySelector('.custom-class')).toBeInTheDocument();
      });
    });

    it('should handle different usernames correctly', async () => {
      mockGetPublicCollections.mockResolvedValue([]);

      render(<ProfileCollectionsSection {...defaultProps} username="differentuser" />);

      await waitFor(() => {
        expect(screen.getByText('differentuser hasn\'t shared any collections publicly yet.')).toBeInTheDocument();
      });
    });
  });
});
