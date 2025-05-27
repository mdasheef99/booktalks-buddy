/**
 * Testimonial Utility Functions
 * Helper functions for testimonial management operations
 */

import type { 
  Testimonial, 
  TestimonialFormData, 
  TestimonialApprovalStatus 
} from '@/lib/api/store/types/communityShowcaseTypes';
import type { TestimonialStats, TestimonialFilterType } from '../types/testimonialTypes';
import { DEFAULT_FORM_DATA, SOURCE_TYPES } from '../constants/testimonialConstants';

// ===== FORM DATA UTILITIES =====

/**
 * Create default form data
 */
export const createDefaultFormData = (): TestimonialFormData => ({
  ...DEFAULT_FORM_DATA,
});

/**
 * Convert testimonial to form data for editing
 */
export const testimonialToFormData = (testimonial: Testimonial): TestimonialFormData => ({
  customer_name: testimonial.customer_name || '',
  testimonial_text: testimonial.testimonial_text,
  rating: testimonial.rating || undefined,
  source_type: testimonial.source_type,
  source_url: testimonial.source_url || '',
  is_anonymous: testimonial.is_anonymous,
  is_featured: testimonial.is_featured,
});

/**
 * Reset form data to defaults
 */
export const resetFormData = (): TestimonialFormData => createDefaultFormData();

// ===== TESTIMONIAL FILTERING =====

/**
 * Filter testimonials by approval status
 */
export const filterTestimonialsByStatus = (
  testimonials: Testimonial[], 
  status: TestimonialFilterType
): Testimonial[] => {
  if (status === 'all') {
    return testimonials;
  }
  return testimonials.filter(t => t.approval_status === status);
};

/**
 * Filter testimonials by featured status
 */
export const filterTestimonialsByFeatured = (
  testimonials: Testimonial[], 
  featured: boolean | null
): Testimonial[] => {
  if (featured === null) {
    return testimonials;
  }
  return testimonials.filter(t => t.is_featured === featured);
};

/**
 * Filter testimonials by source type
 */
export const filterTestimonialsBySourceType = (
  testimonials: Testimonial[], 
  sourceType: string | null
): Testimonial[] => {
  if (!sourceType) {
    return testimonials;
  }
  return testimonials.filter(t => t.source_type === sourceType);
};

// ===== TESTIMONIAL STATISTICS =====

/**
 * Calculate testimonial statistics
 */
export const calculateTestimonialStats = (testimonials: Testimonial[]): TestimonialStats => {
  const stats: TestimonialStats = {
    total: testimonials.length,
    approved: 0,
    pending: 0,
    rejected: 0,
    featured: 0,
  };

  testimonials.forEach(testimonial => {
    switch (testimonial.approval_status) {
      case 'approved':
        stats.approved++;
        break;
      case 'pending':
        stats.pending++;
        break;
      case 'rejected':
        stats.rejected++;
        break;
    }

    if (testimonial.is_featured) {
      stats.featured++;
    }
  });

  return stats;
};

/**
 * Get approved testimonials
 */
export const getApprovedTestimonials = (testimonials: Testimonial[]): Testimonial[] => {
  return testimonials.filter(t => t.approval_status === 'approved');
};

/**
 * Get pending testimonials
 */
export const getPendingTestimonials = (testimonials: Testimonial[]): Testimonial[] => {
  return testimonials.filter(t => t.approval_status === 'pending');
};

/**
 * Get featured testimonials
 */
export const getFeaturedTestimonials = (testimonials: Testimonial[]): Testimonial[] => {
  return testimonials.filter(t => t.is_featured);
};

// ===== TESTIMONIAL SORTING =====

/**
 * Sort testimonials by creation date (newest first)
 */
export const sortTestimonialsByDate = (testimonials: Testimonial[]): Testimonial[] => {
  return [...testimonials].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
};

/**
 * Sort testimonials by display order
 */
export const sortTestimonialsByOrder = (testimonials: Testimonial[]): Testimonial[] => {
  return [...testimonials].sort((a, b) => a.display_order - b.display_order);
};

/**
 * Sort testimonials by featured status (featured first)
 */
export const sortTestimonialsByFeatured = (testimonials: Testimonial[]): Testimonial[] => {
  return [...testimonials].sort((a, b) => {
    if (a.is_featured && !b.is_featured) return -1;
    if (!a.is_featured && b.is_featured) return 1;
    return 0;
  });
};

// ===== SOURCE TYPE UTILITIES =====

/**
 * Get source type label
 */
export const getSourceTypeLabel = (sourceType: string): string => {
  const source = SOURCE_TYPES.find(s => s.value === sourceType);
  return source?.label || sourceType;
};

/**
 * Get all source type options
 */
export const getSourceTypeOptions = () => SOURCE_TYPES;

// ===== DATE FORMATTING =====

/**
 * Format testimonial creation date
 */
export const formatTestimonialDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString();
};

/**
 * Format testimonial creation date with time
 */
export const formatTestimonialDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString();
};

/**
 * Get relative time for testimonial
 */
export const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    return 'Today';
  } else if (diffInDays === 1) {
    return 'Yesterday';
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else {
    return formatTestimonialDate(dateString);
  }
};

// ===== VALIDATION HELPERS =====

/**
 * Check if testimonial can be edited
 */
export const canEditTestimonial = (testimonial: Testimonial): boolean => {
  // Add any business logic for when testimonials can be edited
  return true;
};

/**
 * Check if testimonial can be deleted
 */
export const canDeleteTestimonial = (testimonial: Testimonial): boolean => {
  // Add any business logic for when testimonials can be deleted
  return true;
};

/**
 * Check if testimonial approval can be changed
 */
export const canChangeApproval = (testimonial: Testimonial): boolean => {
  // Only pending testimonials can have their approval changed
  return testimonial.approval_status === 'pending';
};

// ===== DISPLAY UTILITIES =====

/**
 * Get customer display name
 */
export const getCustomerDisplayName = (testimonial: Testimonial): string => {
  return testimonial.is_anonymous ? 'Anonymous Customer' : (testimonial.customer_name || 'Unknown Customer');
};

/**
 * Truncate testimonial text for display
 */
export const truncateTestimonialText = (text: string, maxLength: number = 150): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength).trim() + '...';
};

/**
 * Check if testimonial has source URL
 */
export const hasSourceUrl = (testimonial: Testimonial): boolean => {
  return Boolean(testimonial.source_url && testimonial.source_url.trim());
};
