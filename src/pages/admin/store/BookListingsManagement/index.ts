/**
 * Book Listings Management - Modular Structure
 * 
 * This module provides a complete book listings management system for store owners.
 * It includes components for viewing, filtering, and managing customer book submissions.
 */

// Main component
export { default } from './BookListingsManagement';

// Components
export * from './components/BookListingCard';
export * from './components/BookListingDetailDialog';
export * from './components/DeleteConfirmationDialog';
export * from './components/ListingFilters';
export * from './components/ListingTabs';

// Hooks
export * from './hooks/useBookListings';
export * from './hooks/useListingActions';

// Utils
export * from './utils/listingUtils';

// Types
export * from './types';
