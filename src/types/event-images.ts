/**
 * Types for event image handling
 */

// Image metadata stored in the database
export interface EventImageMetadata {
  originalWidth: number;
  originalHeight: number;
  originalSize: number; // in bytes
  originalFormat: string;
  uploadedAt: string;
  uploadedBy: string;
}

// Image sizes for different display contexts
export enum ImageSize {
  THUMBNAIL = 'thumbnail', // 200x200
  MEDIUM = 'medium',       // 600x400
  ORIGINAL = 'original'    // max 1200px width
}

// Image upload progress state
export interface ImageUploadProgress {
  isUploading: boolean;
  progress: number; // 0-100
  error: string | null;
}

// Image upload response
export interface ImageUploadResponse {
  imageUrl: string;
  thumbnailUrl: string;
  mediumUrl: string;
  metadata: EventImageMetadata;
}

// Image validation result
export interface ImageValidationResult {
  isValid: boolean;
  errors: string[];
}

// Accepted image formats
export const ACCEPTED_IMAGE_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];

// Maximum file size in bytes (5MB)
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/**
 * Validates an image file before upload
 * @param file The file to validate
 * @returns Validation result with errors if any
 */
export const validateImage = (file: File): ImageValidationResult => {
  const errors: string[] = [];

  // Check file type
  if (!ACCEPTED_IMAGE_FORMATS.includes(file.type)) {
    errors.push(`File type ${file.type} is not supported. Please use JPG, PNG, or WebP.`);
  }

  // Check file size
  if (file.size > MAX_IMAGE_SIZE) {
    const sizeMB = (MAX_IMAGE_SIZE / (1024 * 1024)).toFixed(0);
    errors.push(`File size exceeds the ${sizeMB}MB limit.`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
