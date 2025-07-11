/**
 * Unit Tests for BookListingsManagement Utility Functions
 * 
 * This test suite focuses specifically on testing the utility functions
 * in the listingUtils.ts file to ensure they work correctly in isolation.
 */

import { describe, it, expect } from 'vitest';
import { BookListingData, BookListingStatus } from '@/types/bookListings';

// Create mock book listing data for testing
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

describe('BookListingsManagement Utility Functions', () => {
  describe('filterListings', () => {
    it('should filter listings by status correctly', async () => {
      const { filterListings } = await import(
        '@/pages/admin/store/BookListingsManagement/utils/listingUtils'
      );

      const listings = [
        createMockBookListing({ id: '1', status: 'pending' }),
        createMockBookListing({ id: '2', status: 'approved' }),
        createMockBookListing({ id: '3', status: 'rejected' }),
        createMockBookListing({ id: '4', status: 'pending' }),
      ];

      expect(filterListings(listings, 'pending', '')).toHaveLength(2);
      expect(filterListings(listings, 'approved', '')).toHaveLength(1);
      expect(filterListings(listings, 'rejected', '')).toHaveLength(1);
      expect(filterListings(listings, 'all', '')).toHaveLength(4);
    });

    it('should filter listings by search term correctly', async () => {
      const { filterListings } = await import(
        '@/pages/admin/store/BookListingsManagement/utils/listingUtils'
      );

      const listings = [
        createMockBookListing({ book_title: 'JavaScript: The Good Parts', book_author: 'Douglas Crockford' }),
        createMockBookListing({ book_title: 'Python Crash Course', book_author: 'Eric Matthes' }),
        createMockBookListing({ book_title: 'Clean Code', book_author: 'Robert Martin', customer_name: 'Jane Smith' }),
      ];

      // Search by book title
      expect(filterListings(listings, 'all', 'JavaScript')).toHaveLength(1);
      expect(filterListings(listings, 'all', 'Python')).toHaveLength(1);
      
      // Search by author
      expect(filterListings(listings, 'all', 'Crockford')).toHaveLength(1);
      
      // Search by customer name
      expect(filterListings(listings, 'all', 'Jane')).toHaveLength(1);
      
      // Case insensitive search
      expect(filterListings(listings, 'all', 'javascript')).toHaveLength(1);
      
      // No matches
      expect(filterListings(listings, 'all', 'NonExistent')).toHaveLength(0);
    });

    it('should combine status and search filters correctly', async () => {
      const { filterListings } = await import(
        '@/pages/admin/store/BookListingsManagement/utils/listingUtils'
      );

      const listings = [
        createMockBookListing({ book_title: 'JavaScript Guide', status: 'pending' }),
        createMockBookListing({ book_title: 'JavaScript Advanced', status: 'approved' }),
        createMockBookListing({ book_title: 'Python Basics', status: 'pending' }),
      ];

      const result = filterListings(listings, 'pending', 'JavaScript');
      expect(result).toHaveLength(1);
      expect(result[0].book_title).toBe('JavaScript Guide');
    });
  });

  describe('getTabCounts', () => {
    it('should calculate tab counts correctly', async () => {
      const { getTabCounts } = await import(
        '@/pages/admin/store/BookListingsManagement/utils/listingUtils'
      );

      const listings = [
        createMockBookListing({ status: 'pending' }),
        createMockBookListing({ status: 'pending' }),
        createMockBookListing({ status: 'approved' }),
        createMockBookListing({ status: 'rejected' }),
        createMockBookListing({ status: 'approved' }),
      ];

      const counts = getTabCounts(listings);
      
      expect(counts.pending).toBe(2);
      expect(counts.approved).toBe(2);
      expect(counts.rejected).toBe(1);
      expect(counts.all).toBe(5);
    });

    it('should handle empty listings array', async () => {
      const { getTabCounts } = await import(
        '@/pages/admin/store/BookListingsManagement/utils/listingUtils'
      );

      const counts = getTabCounts([]);
      
      expect(counts.pending).toBe(0);
      expect(counts.approved).toBe(0);
      expect(counts.rejected).toBe(0);
      expect(counts.all).toBe(0);
    });
  });

  describe('formatSubmissionDate', () => {
    it('should format dates correctly', async () => {
      const { formatSubmissionDate } = await import(
        '@/pages/admin/store/BookListingsManagement/utils/listingUtils'
      );

      // Test various date formats
      expect(formatSubmissionDate('2023-07-15T10:30:00Z')).toMatch(/Jul 15, 2023/);
      expect(formatSubmissionDate('2023-12-25T00:00:00Z')).toMatch(/Dec 25, 2023/);
      expect(formatSubmissionDate('2023-01-01T12:00:00Z')).toMatch(/Jan 1, 2023/);
    });

    it('should handle invalid dates gracefully', async () => {
      const { formatSubmissionDate } = await import(
        '@/pages/admin/store/BookListingsManagement/utils/listingUtils'
      );

      expect(formatSubmissionDate('invalid-date')).toBe('Invalid Date');
      expect(formatSubmissionDate('')).toBe('Invalid Date');
    });
  });

  describe('canUpdateListing', () => {
    it('should return true for pending listings', async () => {
      const { canUpdateListing } = await import(
        '@/pages/admin/store/BookListingsManagement/utils/listingUtils'
      );

      const pendingListing = createMockBookListing({ status: 'pending' });
      expect(canUpdateListing(pendingListing)).toBe(true);
    });

    it('should return false for non-pending listings', async () => {
      const { canUpdateListing } = await import(
        '@/pages/admin/store/BookListingsManagement/utils/listingUtils'
      );

      const approvedListing = createMockBookListing({ status: 'approved' });
      const rejectedListing = createMockBookListing({ status: 'rejected' });
      
      expect(canUpdateListing(approvedListing)).toBe(false);
      expect(canUpdateListing(rejectedListing)).toBe(false);
    });
  });

  describe('validateNotes', () => {
    it('should require notes for rejected status', async () => {
      const { validateNotes } = await import(
        '@/pages/admin/store/BookListingsManagement/utils/listingUtils'
      );

      expect(validateNotes('rejected', '')).toBe('Notes are required when rejecting a listing');
      expect(validateNotes('rejected', '   ')).toBe('Notes are required when rejecting a listing');
      expect(validateNotes('rejected', 'Valid reason')).toBe('');
    });

    it('should not require notes for other statuses', async () => {
      const { validateNotes } = await import(
        '@/pages/admin/store/BookListingsManagement/utils/listingUtils'
      );

      expect(validateNotes('approved', '')).toBe('');
      expect(validateNotes('pending', '')).toBe('');
    });
  });

  describe('formatPrice', () => {
    it('should format prices correctly', async () => {
      const { formatPrice } = await import(
        '@/pages/admin/store/BookListingsManagement/utils/listingUtils'
      );

      expect(formatPrice(25.99)).toBe('$25.99');
      expect(formatPrice(100)).toBe('$100.00');
      expect(formatPrice(0)).toBe('$0.00');
      expect(formatPrice(9.5)).toBe('$9.50');
    });
  });

  describe('getStatusBadgeColor', () => {
    it('should return correct colors for each status', async () => {
      const { getStatusBadgeColor } = await import(
        '@/pages/admin/store/BookListingsManagement/utils/listingUtils'
      );

      expect(getStatusBadgeColor('pending')).toBe('bg-yellow-100 text-yellow-800');
      expect(getStatusBadgeColor('approved')).toBe('bg-green-100 text-green-800');
      expect(getStatusBadgeColor('rejected')).toBe('bg-red-100 text-red-800');
    });
  });

  describe('sortListings', () => {
    it('should sort listings by creation date (newest first)', async () => {
      const { sortListings } = await import(
        '@/pages/admin/store/BookListingsManagement/utils/listingUtils'
      );

      const listings = [
        createMockBookListing({ id: '1', created_at: '2023-01-01T00:00:00Z' }),
        createMockBookListing({ id: '2', created_at: '2023-01-03T00:00:00Z' }),
        createMockBookListing({ id: '3', created_at: '2023-01-02T00:00:00Z' }),
      ];

      const sorted = sortListings(listings);
      
      expect(sorted[0].id).toBe('2'); // Most recent
      expect(sorted[1].id).toBe('3'); // Middle
      expect(sorted[2].id).toBe('1'); // Oldest
    });
  });
});
