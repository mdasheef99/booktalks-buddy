/**
 * Book Listings Management Types
 * 
 * Type definitions specific to the book listings management module.
 */

import { BookListingData, BookListingStatus } from '@/types/bookListings';

// Re-export main types for convenience
export type { BookListingData, BookListingStatus };

// Component prop types
export interface BookListingCardProps {
  listing: BookListingData;
  onView: () => void;
  onUpdateStatus: (id: string, status: BookListingStatus, notes?: string) => void;
  onDelete: (id: string) => void;
  isUpdating: boolean;
  isDeleting: boolean;
}

export interface BookListingDetailDialogProps {
  listing: BookListingData;
  open: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, status: BookListingStatus, notes?: string) => void;
  onDelete: (id: string) => void;
  isUpdating: boolean;
  isDeleting: boolean;
}

export interface ListingFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export interface ListingTabsProps {
  activeTab: TabValue;
  onTabChange: (tab: TabValue) => void;
  listings: BookListingData[];
}

// Tab types
export type TabValue = 'all' | 'pending' | 'approved' | 'rejected';

// Hook return types
export interface UseBookListingsReturn {
  listings: BookListingData[];
  loading: boolean;
  error: string | null;
  loadListings: () => Promise<void>;
  filteredListings: BookListingData[];
}

export interface UseListingActionsReturn {
  updateListingStatus: (
    listingId: string,
    status: BookListingStatus,
    notes?: string
  ) => Promise<void>;
  deleteListing: (listingId: string) => Promise<void>;
  updating: boolean;
  deleting: boolean;
}

// Filter function type
export type ListingFilterFunction = (listing: BookListingData, searchTerm: string) => boolean;
