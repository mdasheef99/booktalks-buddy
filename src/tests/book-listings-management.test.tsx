/**
 * Comprehensive Unit Tests for BookListingsManagement Refactoring
 * 
 * This test suite verifies the refactored BookListingsManagement components
 * to ensure backward compatibility, functionality, and integration work correctly.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from './test-utils';
import { BookListingData, BookListingStatus } from '@/types/bookListings';

// Mock the BookListingService
const mockBookListingService = {
  getStoreBookListings: vi.fn(),
  updateBookListingStatus: vi.fn(),
};

vi.mock('@/lib/services/bookListingService', () => ({
  BookListingService: mockBookListingService,
}));

// Create mock functions that can be controlled per test
const mockUseStoreOwnerAccess = vi.fn();
const mockUseAuth = vi.fn();
const mockUseBookListings = vi.fn();
const mockUseListingActions = vi.fn();

// Mock the hooks with vi.mock
vi.mock('@/hooks/useStoreOwnerAccess', () => ({
  useStoreOwnerAccess: mockUseStoreOwnerAccess,
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: mockUseAuth,
}));

vi.mock('@/pages/admin/store/BookListingsManagement/hooks/useBookListings', () => ({
  useBookListings: mockUseBookListings,
}));

vi.mock('@/pages/admin/store/BookListingsManagement/hooks/useListingActions', () => ({
  useListingActions: mockUseListingActions,
}));

// Mock toast notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Create mock book listing data
const createMockBookListing = (overrides = {}): BookListingData => ({
  id: 'test-listing-1',
  customer_name: 'John Doe',
  customer_email: 'john@example.com',
  customer_phone: '123-456-7890',
  book_title: 'Test Book',
  book_author: 'Test Author',
  book_isbn: '1234567890',
  book_condition: 'good',
  asking_price: 25.99,
  description: 'A great test book',
  status: 'pending' as BookListingStatus,
  store_id: 'test-store-id',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  store_owner_notes: null,
  images: [],
  ...overrides,
});

describe('BookListingsManagement Refactoring Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Set up default mock return values
    mockUseStoreOwnerAccess.mockReturnValue({
      isStoreOwner: true,
      storeId: 'test-store-id',
      loading: false,
    });

    mockUseAuth.mockReturnValue({
      user: { id: 'test-user-id' },
      session: null,
      loading: false,
    });

    mockUseBookListings.mockReturnValue({
      listings: [],
      loading: false,
      error: null,
      loadListings: vi.fn(),
      filteredListings: []
    });

    mockUseListingActions.mockReturnValue({
      updateListingStatus: vi.fn(),
      updating: false
    });

    // Set up service mock defaults
    mockBookListingService.getStoreBookListings.mockResolvedValue([
      createMockBookListing(),
      createMockBookListing({ id: 'test-listing-2', status: 'approved' }),
    ]);
    mockBookListingService.updateBookListingStatus.mockResolvedValue({});
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('1. Backward Compatibility Tests', () => {
    it('should import successfully from legacy path', async () => {
      // Test that the legacy import path works
      const { default: LegacyComponent } = await import(
        '@/pages/admin/store/BookListingsManagement'
      );
      
      expect(LegacyComponent).toBeDefined();
      expect(typeof LegacyComponent).toBe('function');
    });

    it('should import successfully from new modular path', async () => {
      // Test that the new modular import path works
      const { default: ModularComponent } = await import(
        '@/pages/admin/store/BookListingsManagement/BookListingsManagement'
      );
      
      expect(ModularComponent).toBeDefined();
      expect(typeof ModularComponent).toBe('function');
    });

    it('should export all components from index aggregator', async () => {
      // Test that all exports are available from the index
      const moduleExports = await import(
        '@/pages/admin/store/BookListingsManagement/'
      );
      
      expect(moduleExports.default).toBeDefined();
      expect(moduleExports.useBookListings).toBeDefined();
      expect(moduleExports.useListingActions).toBeDefined();
      expect(moduleExports.BookListingCard).toBeDefined();
      expect(moduleExports.BookListingDetailDialog).toBeDefined();
      expect(moduleExports.ListingFilters).toBeDefined();
      expect(moduleExports.ListingTabs).toBeDefined();
    });
  });

  describe('2. Main Component Tests', () => {
    beforeEach(() => {
      // Reset mocks before each test
      mockBookListingService.getStoreBookListings.mockClear();
      mockBookListingService.updateBookListingStatus.mockClear();

      // Set default mock values for successful tests
      mockUseStoreOwnerAccess.isStoreOwner = true;
      mockUseStoreOwnerAccess.storeId = 'test-store-id';
      mockUseStoreOwnerAccess.loading = false;

      mockBookListingService.getStoreBookListings.mockResolvedValue([]);
    });

    it('should render BookListingsManagement component without errors', async () => {
      const { default: BookListingsManagement } = await import(
        '@/pages/admin/store/BookListingsManagement'
      );

      renderWithProviders(<BookListingsManagement />);

      await waitFor(() => {
        expect(screen.getByText('Book Listings Management')).toBeInTheDocument();
      });
    });

    it('should show loading state initially', async () => {
      const { default: BookListingsManagement } = await import(
        '@/pages/admin/store/BookListingsManagement'
      );

      // Mock loading state
      mockUseStoreOwnerAccess.loading = true;

      renderWithProviders(<BookListingsManagement />);

      expect(screen.getByTestId('loading-skeleton') ||
             document.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('should show access denied when user is not store owner', async () => {
      const { default: BookListingsManagement } = await import(
        '@/pages/admin/store/BookListingsManagement'
      );

      // Mock access denied
      mockUseStoreOwnerAccess.isStoreOwner = false;
      mockUseStoreOwnerAccess.loading = false;

      renderWithProviders(<BookListingsManagement />);

      expect(screen.getByText(/don't have permission/i)).toBeInTheDocument();
    });
  });

  describe('3. Custom Hooks Tests', () => {
    it('should test useBookListings hook functionality', async () => {
      const { useBookListings } = await import(
        '@/pages/admin/store/BookListingsManagement/hooks/useBookListings'
      );

      const { renderHook } = await import('@testing-library/react');

      const { result, waitForNextUpdate } = renderHook(() =>
        useBookListings({
          storeId: 'test-store-id',
          activeTab: 'all',
          searchTerm: '',
          storeAccessLoading: false,
        })
      );

      expect(result.current.loading).toBe(true);

      await waitForNextUpdate();

      expect(mockBookListingService.getStoreBookListings).toHaveBeenCalledWith(
        'test-store-id',
        undefined
      );
      expect(result.current.listings).toHaveLength(2);
    });

    it('should test useListingActions hook functionality', async () => {
      const { useListingActions } = await import(
        '@/pages/admin/store/BookListingsManagement/hooks/useListingActions'
      );

      const { renderHook } = await import('@testing-library/react');

      const mockOnSuccess = vi.fn();
      const { result } = renderHook(() =>
        useListingActions({
          userId: 'test-user-id',
          onSuccess: mockOnSuccess,
        })
      );

      await result.current.updateListingStatus('test-listing-1', 'approved');

      expect(mockBookListingService.updateBookListingStatus).toHaveBeenCalledWith(
        'test-listing-1',
        { status: 'approved', store_owner_notes: undefined },
        'test-user-id'
      );
    });
  });

  describe('4. Sub-Component Tests', () => {
    it('should render BookListingCard component', async () => {
      const { BookListingCard } = await import(
        '@/pages/admin/store/BookListingsManagement/components/BookListingCard'
      );

      const mockListing = createMockBookListing();
      const mockOnViewDetails = vi.fn();
      const mockOnUpdateStatus = vi.fn();

      renderWithProviders(
        <BookListingCard
          listing={mockListing}
          onViewDetails={mockOnViewDetails}
          onUpdateStatus={mockOnUpdateStatus}
          updating={false}
        />
      );

      expect(screen.getByText('Test Book')).toBeInTheDocument();
      expect(screen.getByText('Test Author')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should render ListingFilters component', async () => {
      const { ListingFilters } = await import(
        '@/pages/admin/store/BookListingsManagement/components/ListingFilters'
      );

      const mockOnSearchChange = vi.fn();

      renderWithProviders(
        <ListingFilters
          searchTerm=""
          onSearchChange={mockOnSearchChange}
        />
      );

      const searchInput = screen.getByPlaceholderText(/search by book title/i);
      expect(searchInput).toBeInTheDocument();

      fireEvent.change(searchInput, { target: { value: 'test search' } });
      expect(mockOnSearchChange).toHaveBeenCalledWith('test search');
    });

    it('should render ListingTabs component', async () => {
      const { ListingTabs } = await import(
        '@/pages/admin/store/BookListingsManagement/components/ListingTabs'
      );

      const mockOnTabChange = vi.fn();
      const mockListings = [
        createMockBookListing({ status: 'pending' }),
        createMockBookListing({ status: 'approved' }),
      ];

      renderWithProviders(
        <ListingTabs
          activeTab="all"
          onTabChange={mockOnTabChange}
          listings={mockListings}
        />
      );

      expect(screen.getByText('All')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('Approved')).toBeInTheDocument();
      expect(screen.getByText('Rejected')).toBeInTheDocument();
    });
  });

  describe('5. Utility Functions Tests', () => {
    it('should test filterListings utility function', async () => {
      const { filterListings } = await import(
        '@/pages/admin/store/BookListingsManagement/utils/listingUtils'
      );

      const listings = [
        createMockBookListing({ book_title: 'JavaScript Guide', status: 'pending' }),
        createMockBookListing({ book_title: 'Python Basics', status: 'approved' }),
        createMockBookListing({ book_title: 'React Handbook', status: 'pending' }),
      ];

      // Test filtering by status
      const pendingListings = filterListings(listings, 'pending', '');
      expect(pendingListings).toHaveLength(2);

      // Test filtering by search term
      const jsListings = filterListings(listings, 'all', 'JavaScript');
      expect(jsListings).toHaveLength(1);
      expect(jsListings[0].book_title).toBe('JavaScript Guide');
    });

    it('should test getTabCounts utility function', async () => {
      const { getTabCounts } = await import(
        '@/pages/admin/store/BookListingsManagement/utils/listingUtils'
      );

      const listings = [
        createMockBookListing({ status: 'pending' }),
        createMockBookListing({ status: 'pending' }),
        createMockBookListing({ status: 'approved' }),
        createMockBookListing({ status: 'rejected' }),
      ];

      const counts = getTabCounts(listings);
      expect(counts.pending).toBe(2);
      expect(counts.approved).toBe(1);
      expect(counts.rejected).toBe(1);
      expect(counts.all).toBe(4);
    });

    it('should test formatSubmissionDate utility function', async () => {
      const { formatSubmissionDate } = await import(
        '@/pages/admin/store/BookListingsManagement/utils/listingUtils'
      );

      const testDate = '2023-07-15T10:30:00Z';
      const formatted = formatSubmissionDate(testDate);

      expect(formatted).toMatch(/Jul 15, 2023/);
    });

    it('should test canUpdateListing utility function', async () => {
      const { canUpdateListing } = await import(
        '@/pages/admin/store/BookListingsManagement/utils/listingUtils'
      );

      const pendingListing = createMockBookListing({ status: 'pending' });
      const approvedListing = createMockBookListing({ status: 'approved' });

      expect(canUpdateListing(pendingListing)).toBe(true);
      expect(canUpdateListing(approvedListing)).toBe(false);
    });

    it('should test validateNotes utility function', async () => {
      const { validateNotes } = await import(
        '@/pages/admin/store/BookListingsManagement/utils/listingUtils'
      );

      expect(validateNotes('rejected', '')).toBe('Notes are required when rejecting a listing');
      expect(validateNotes('approved', '')).toBe('');
      expect(validateNotes('rejected', 'Valid reason')).toBe('');
    });
  });

  describe('6. Integration Tests', () => {
    it('should handle API integration correctly', async () => {
      const { default: BookListingsManagement } = await import(
        '@/pages/admin/store/BookListingsManagement'
      );

      // Mock successful API response
      mockBookListingService.getStoreBookListings.mockResolvedValue([
        createMockBookListing(),
      ]);

      renderWithProviders(<BookListingsManagement />);

      await waitFor(() => {
        expect(mockBookListingService.getStoreBookListings).toHaveBeenCalledWith(
          'test-store-id',
          undefined
        );
      });

      expect(screen.getByText('Test Book')).toBeInTheDocument();
    });

    it('should handle API errors gracefully', async () => {
      const { default: BookListingsManagement } = await import(
        '@/pages/admin/store/BookListingsManagement'
      );

      // Mock API error
      mockBookListingService.getStoreBookListings.mockRejectedValue(
        new Error('API Error')
      );

      renderWithProviders(<BookListingsManagement />);

      await waitFor(() => {
        expect(screen.getByText(/error loading listings/i)).toBeInTheDocument();
      });
    });

    it('should handle status updates correctly', async () => {
      const { default: BookListingsManagement } = await import(
        '@/pages/admin/store/BookListingsManagement'
      );

      mockBookListingService.getStoreBookListings.mockResolvedValue([
        createMockBookListing(),
      ]);

      renderWithProviders(<BookListingsManagement />);

      await waitFor(() => {
        expect(screen.getByText('Test Book')).toBeInTheDocument();
      });

      // Find and click approve button
      const approveButton = screen.getByText('Approve');
      fireEvent.click(approveButton);

      await waitFor(() => {
        expect(mockBookListingService.updateBookListingStatus).toHaveBeenCalledWith(
          'test-listing-1',
          { status: 'approved', store_owner_notes: undefined },
          'test-user-id'
        );
      });
    });
  });

  describe('7. Error Handling Tests', () => {
    it('should handle missing store ID gracefully', async () => {
      const { default: BookListingsManagement } = await import(
        '@/pages/admin/store/BookListingsManagement'
      );

      // Mock missing store ID
      mockUseStoreOwnerAccess.storeId = null;

      renderWithProviders(<BookListingsManagement />);

      expect(screen.getByText(/store not found/i)).toBeInTheDocument();
    });

    it('should handle update failures gracefully', async () => {
      const { useListingActions } = await import(
        '@/pages/admin/store/BookListingsManagement/hooks/useListingActions'
      );

      const { renderHook } = await import('@testing-library/react');

      // Mock update failure
      mockBookListingService.updateBookListingStatus.mockRejectedValue(
        new Error('Update failed')
      );

      const { result } = renderHook(() =>
        useListingActions({
          userId: 'test-user-id',
          onSuccess: vi.fn(),
        })
      );

      await result.current.updateListingStatus('test-listing-1', 'approved');

      // Should handle error gracefully without crashing
      expect(result.current.updating).toBe(false);
    });
  });

  describe('8. TypeScript Type Safety Tests', () => {
    it('should have correct TypeScript types', async () => {
      // Test that all imports have correct types
      const moduleExports = await import(
        '@/pages/admin/store/BookListingsManagement/'
      );

      // These should not throw TypeScript errors
      expect(typeof moduleExports.default).toBe('function');
      expect(typeof moduleExports.useBookListings).toBe('function');
      expect(typeof moduleExports.useListingActions).toBe('function');
      expect(typeof moduleExports.BookListingCard).toBe('function');
      expect(typeof moduleExports.BookListingDetailDialog).toBe('function');
      expect(typeof moduleExports.ListingFilters).toBe('function');
      expect(typeof moduleExports.ListingTabs).toBe('function');
    });

    it('should export types correctly', async () => {
      const types = await import(
        '@/pages/admin/store/BookListingsManagement/types'
      );

      // Should have type exports available
      expect(types).toBeDefined();
    });
  });
});
