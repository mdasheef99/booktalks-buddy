// =====================================================
// Book Availability Requests Types
// =====================================================

export interface BookAvailabilityRequestFormData {
  // Customer Information (Required)
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  
  // Book Information (Required)
  book_title: string;
  book_author: string;
  
  // Additional Details (Optional)
  description?: string;
}

export interface BookAvailabilityRequestData extends BookAvailabilityRequestFormData {
  id: string;
  store_id: string;
  status: BookAvailabilityRequestStatus;
  store_owner_notes?: string;
  responded_by?: string;
  responded_at?: string;
  created_at: string;
  updated_at: string;
  request_source?: 'anonymous' | 'authenticated_user';
  user_id?: string;
  google_books_id?: string;
}

export type BookAvailabilityRequestStatus = 'pending' | 'responded' | 'resolved';

export interface BookAvailabilityRequestSubmission {
  formData: BookAvailabilityRequestFormData;
  storeId: string;
}

export interface BookAvailabilityRequestUpdateData {
  status?: BookAvailabilityRequestStatus;
  store_owner_notes?: string;
  responded_by?: string;
}

export interface BookAvailabilityRequestFormErrors {
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  book_title?: string;
  book_author?: string;
  description?: string;
}

// =====================================================
// Validation Rules and Constants
// =====================================================

export const VALIDATION_RULES = {
  customer_name: {
    required: true,
    minLength: 6,
    maxLength: 50,
  },
  customer_email: {
    required: true,
    maxLength: 254,
    pattern: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  },
  customer_phone: {
    required: true,
    exactLength: 10,
    pattern: /^\d{10}$/,
  },
  book_title: {
    required: true,
    minLength: 6,
    maxLength: 100,
  },
  book_author: {
    required: true,
    minLength: 6,
    maxLength: 50,
  },
  description: {
    required: false,
    maxLength: 1000,
  },
  store_owner_notes: {
    required: false,
    maxLength: 500,
  },
} as const;

// =====================================================
// Helper Functions and Utilities
// =====================================================

export const validateBookAvailabilityRequestForm = (
  data: Partial<BookAvailabilityRequestFormData>
): BookAvailabilityRequestFormErrors => {
  const errors: BookAvailabilityRequestFormErrors = {};

  // Note: Import validation utilities at the top of the file instead
  // For now, we'll use basic validation until we can properly import the utilities

  // Customer Name Validation
  if (!data.customer_name?.trim()) {
    errors.customer_name = 'Customer name is required';
  } else if (data.customer_name.trim().length < VALIDATION_RULES.customer_name.minLength) {
    errors.customer_name = `Customer name must be at least ${VALIDATION_RULES.customer_name.minLength} characters`;
  } else if (data.customer_name.trim().length > VALIDATION_RULES.customer_name.maxLength) {
    errors.customer_name = `Customer name must be ${VALIDATION_RULES.customer_name.maxLength} characters or less`;
  } else if (!/^[a-zA-Z\s\-']+$/.test(data.customer_name.trim())) {
    errors.customer_name = 'Customer name can only contain letters, spaces, hyphens, and apostrophes';
  }

  // Customer Email Validation
  if (!data.customer_email?.trim()) {
    errors.customer_email = 'Email address is required';
  } else if (data.customer_email.trim().length > VALIDATION_RULES.customer_email.maxLength) {
    errors.customer_email = `Email must be ${VALIDATION_RULES.customer_email.maxLength} characters or less`;
  } else if (!VALIDATION_RULES.customer_email.pattern.test(data.customer_email.trim())) {
    errors.customer_email = 'Please enter a valid email address';
  }

  // Customer Phone Validation
  if (!data.customer_phone?.trim()) {
    errors.customer_phone = 'Phone number is required';
  } else {
    const digitsOnly = data.customer_phone.replace(/\D/g, '');
    if (digitsOnly.length !== VALIDATION_RULES.customer_phone.exactLength) {
      errors.customer_phone = 'Phone number must be exactly 10 digits';
    }
  }

  // Book Title Validation
  if (!data.book_title?.trim()) {
    errors.book_title = 'Book title is required';
  } else if (data.book_title.trim().length < VALIDATION_RULES.book_title.minLength) {
    errors.book_title = `Book title must be at least ${VALIDATION_RULES.book_title.minLength} characters`;
  } else if (data.book_title.trim().length > VALIDATION_RULES.book_title.maxLength) {
    errors.book_title = `Book title must be ${VALIDATION_RULES.book_title.maxLength} characters or less`;
  } else if (!/^[a-zA-Z0-9\s\.,!?:;\-']+$/.test(data.book_title.trim())) {
    errors.book_title = 'Book title contains invalid characters';
  }

  // Book Author Validation
  if (!data.book_author?.trim()) {
    errors.book_author = 'Author name is required';
  } else if (data.book_author.trim().length < VALIDATION_RULES.book_author.minLength) {
    errors.book_author = `Author name must be at least ${VALIDATION_RULES.book_author.minLength} characters`;
  } else if (data.book_author.trim().length > VALIDATION_RULES.book_author.maxLength) {
    errors.book_author = `Author name must be ${VALIDATION_RULES.book_author.maxLength} characters or less`;
  } else if (!/^[a-zA-Z\s\-']+$/.test(data.book_author.trim())) {
    errors.book_author = 'Author name can only contain letters, spaces, hyphens, and apostrophes';
  }

  // Description Validation (Optional)
  if (data.description && data.description.trim().length > VALIDATION_RULES.description.maxLength) {
    errors.description = `Description must be ${VALIDATION_RULES.description.maxLength} characters or less`;
  }

  return errors;
};

export const formatRequestStatus = (status: BookAvailabilityRequestStatus): string => {
  switch (status) {
    case 'pending':
      return 'Pending Review';
    case 'responded':
      return 'Responded To';
    case 'resolved':
      return 'Resolved';
    default:
      return 'Unknown';
  }
};

export const getStatusColor = (status: BookAvailabilityRequestStatus): string => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'responded':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'resolved':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

// =====================================================
// API Response Types
// =====================================================

export interface BookAvailabilityRequestApiResponse {
  request: BookAvailabilityRequestData;
}

export interface BookAvailabilityRequestListApiResponse {
  requests: BookAvailabilityRequestData[];
  total: number;
}

export interface BookAvailabilityRequestCreateApiResponse {
  request: BookAvailabilityRequestData;
  message: string;
}

export interface BookAvailabilityRequestUpdateApiResponse {
  request: BookAvailabilityRequestData;
  message: string;
}

// =====================================================
// Form State and UI Types
// =====================================================

export interface BookAvailabilityRequestFormState {
  data: BookAvailabilityRequestFormData;
  errors: BookAvailabilityRequestFormErrors;
  isSubmitting: boolean;
  isValid: boolean;
}

export interface BookAvailabilityRequestFilters {
  status: BookAvailabilityRequestStatus | 'all';
  searchTerm: string;
}

// =====================================================
// Default Values
// =====================================================

export const DEFAULT_FORM_DATA: BookAvailabilityRequestFormData = {
  customer_name: '',
  customer_email: '',
  customer_phone: '',
  book_title: '',
  book_author: '',
  description: '',
};

export const DEFAULT_FORM_STATE: BookAvailabilityRequestFormState = {
  data: DEFAULT_FORM_DATA,
  errors: {},
  isSubmitting: false,
  isValid: false,
};

export const DEFAULT_FILTERS: BookAvailabilityRequestFilters = {
  status: 'all',
  searchTerm: '',
};
