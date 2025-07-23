// =====================================================
// Book Listings Types
// =====================================================

export interface BookListingFormData {
  // Customer Information
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  
  // Book Information
  book_title: string;
  book_author: string;
  book_isbn?: string;
  book_condition: BookCondition;
  book_description?: string;
  asking_price?: number;
}

export interface BookListingData extends BookListingFormData {
  id: string;
  store_id: string;
  image_1_url?: string;
  image_2_url?: string;
  image_3_url?: string;
  status: BookListingStatus;
  store_owner_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export type BookCondition = 'excellent' | 'very_good' | 'good' | 'fair' | 'poor';

export type BookListingStatus = 'pending' | 'approved' | 'rejected';

export interface BookListingSubmission {
  formData: BookListingFormData;
  storeId: string;
  images: File[];
}

export interface BookListingUpdateData {
  status?: BookListingStatus;
  store_owner_notes?: string;
  reviewed_by?: string;
}

export interface BookListingFormErrors {
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  book_title?: string;
  book_author?: string;
  book_isbn?: string;
  book_condition?: string;
  book_description?: string;
  asking_price?: string;
  images?: string;
}

export interface BookListingImageUpload {
  file: File;
  position: 1 | 2 | 3;
  preview?: string;
}

// =====================================================
// Constants
// =====================================================

export const BOOK_CONDITIONS: { value: BookCondition; label: string }[] = [
  { value: 'excellent', label: 'Excellent - Like new, no visible wear' },
  { value: 'very_good', label: 'Very Good - Minor wear, all pages intact' },
  { value: 'good', label: 'Good - Some wear, readable condition' },
  { value: 'fair', label: 'Fair - Noticeable wear, still readable' },
  { value: 'poor', label: 'Poor - Heavy wear, may have damage' }
];

export const BOOK_LISTING_STATUSES: { value: BookListingStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Pending Review', color: 'yellow' },
  { value: 'approved', label: 'Approved', color: 'green' },
  { value: 'rejected', label: 'Rejected', color: 'red' }
];

export const VALIDATION_RULES = {
  customer_name: {
    required: true,
    maxLength: 50,
    minLength: 6
  },
  customer_email: {
    required: true,
    maxLength: 254,
    pattern: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  },
  customer_phone: {
    required: true,
    exactLength: 10,
    pattern: /^\d{10}$/
  },
  book_title: {
    required: true,
    maxLength: 100,
    minLength: 6
  },
  book_author: {
    required: true,
    maxLength: 50,
    minLength: 6
  },
  book_isbn: {
    required: false,
    maxLength: 20,
    pattern: /^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/
  },
  book_description: {
    required: false,
    maxLength: 1000
  },
  asking_price: {
    required: false,
    min: 0,
    max: 9999.99
  },
  store_owner_notes: {
    required: false,
    maxLength: 500
  }
} as const;

export const IMAGE_UPLOAD_CONFIG = {
  maxImages: 3,
  maxSizeBytes: 3 * 1024 * 1024, // 3MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  bucket: 'book-listing-images'
} as const;

// =====================================================
// Utility Functions
// =====================================================

/**
 * Format book condition for display
 */
export const formatBookCondition = (condition: string): string => {
  const conditionMap: Record<string, string> = {
    excellent: 'Excellent',
    very_good: 'Very Good',
    good: 'Good',
    fair: 'Fair',
    poor: 'Poor'
  };
  return conditionMap[condition] || condition;
};

/**
 * Format book listing status for display
 */
export const formatListingStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: 'Pending Review',
    approved: 'Approved',
    rejected: 'Rejected'
  };
  return statusMap[status] || status;
};

/**
 * Get status color for UI
 */
export const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    pending: 'text-yellow-600 bg-yellow-50',
    approved: 'text-green-600 bg-green-50',
    rejected: 'text-red-600 bg-red-50'
  };
  return colorMap[status] || 'text-gray-600 bg-gray-50';
};


