/**
 * Book Listings Management Utilities
 * 
 * Utility functions for book listings management operations.
 */

import { BookListingData, BookListingStatus } from '@/types/bookListings';
import type { ListingFilterFunction, TabValue } from '../types';

/**
 * Filter a single listing based on search term
 */
export const filterListing: ListingFilterFunction = (listing, searchTerm) => {
  if (!searchTerm.trim()) return true;

  const term = searchTerm.toLowerCase();

  // Safe property access with null checks
  const title = listing.book_title?.toLowerCase() || '';
  const author = listing.book_author?.toLowerCase() || '';
  const customerName = listing.customer_name?.toLowerCase() || '';
  const customerEmail = listing.customer_email?.toLowerCase() || '';

  return (
    title.includes(term) ||
    author.includes(term) ||
    customerName.includes(term) ||
    customerEmail.includes(term)
  );
};

/**
 * Filter listings array based on status and search term
 */
export const filterListings = (
  listings: BookListingData[],
  status: string,
  searchTerm: string
): BookListingData[] => {
  let filtered = listings;

  // Filter by status if not 'all'
  if (status !== 'all') {
    filtered = filtered.filter(listing => listing.status === status);
  }

  // Filter by search term if provided
  if (searchTerm.trim()) {
    filtered = filtered.filter(listing => filterListing(listing, searchTerm));
  }

  return filtered;
};

/**
 * Get listings count by status
 */
export const getListingsCountByStatus = (
  listings: BookListingData[], 
  status: BookListingStatus
): number => {
  return listings.filter(listing => listing.status === status).length;
};

/**
 * Get all listings count
 */
export const getAllListingsCount = (listings: BookListingData[]): number => {
  return listings.length;
};

/**
 * Get tab counts for display
 */
export const getTabCounts = (listings: BookListingData[]) => {
  return {
    all: getAllListingsCount(listings),
    pending: getListingsCountByStatus(listings, 'pending'),
    approved: getListingsCountByStatus(listings, 'approved'),
    rejected: getListingsCountByStatus(listings, 'rejected'),
  };
};

/**
 * Convert tab value to status filter
 */
export const getStatusFilterFromTab = (tab: TabValue): BookListingStatus | undefined => {
  return tab === 'all' ? undefined : tab as BookListingStatus;
};

/**
 * Check if listing has any images
 */
export const hasImages = (listing: BookListingData): boolean => {
  return !!(listing.image_1_url || listing.image_2_url || listing.image_3_url);
};

/**
 * Get all image URLs from listing
 */
export const getImageUrls = (listing: BookListingData): string[] => {
  return [listing.image_1_url, listing.image_2_url, listing.image_3_url]
    .filter(Boolean) as string[];
};

/**
 * Format listing submission date
 */
export const formatSubmissionDate = (dateString: string): string => {
  const date = new Date(dateString);

  // Handle invalid dates
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Format listing review date
 */
export const formatReviewDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString();
};

/**
 * Check if listing can be updated
 */
export const canUpdateListing = (listing: BookListingData): boolean => {
  return listing.status === 'pending';
};

/**
 * Get success message for status update
 */
export const getStatusUpdateMessage = (status: BookListingStatus): string => {
  switch (status) {
    case 'approved':
      return 'Listing approved successfully';
    case 'rejected':
      return 'Listing rejected successfully';
    case 'pending':
      return 'Listing reset to pending successfully';
    default:
      return 'Listing updated successfully';
  }
};

/**
 * Validate listing notes based on status
 */
export const validateNotes = (status: string, notes: string): string => {
  // Notes are required when rejecting a listing
  if (status === 'rejected' && !notes.trim()) {
    return 'Notes are required when rejecting a listing';
  }

  // Check length limit
  if (notes.length > 500) {
    return 'Notes cannot exceed 500 characters';
  }

  return '';
};

/**
 * Format price with Indian currency symbol
 */
export const formatPrice = (price: number): string => {
  return `₹${price.toFixed(2)}`;
};

/**
 * Get status badge color classes
 */
export const getStatusBadgeColor = (status: BookListingStatus): string => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Sort listings by creation date (newest first)
 */
export const sortListings = (listings: BookListingData[]): BookListingData[] => {
  return [...listings].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
};
