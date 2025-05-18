import { supabase } from '@/lib/supabase';
import {
  EventImageMetadata,
  ImageUploadResponse,
  validateImage
} from '@/types/event-images';

// Import validateImage from event-images.ts
// This function is now defined in event-images.ts

/**
 * Creates a unique file path for an event image
 * @param eventId The event ID
 * @param userId The user ID
 * @param fileExt The file extension
 * @param size The image size variant
 * @returns A unique file path
 */
export const createEventImagePath = (
  eventId: string,
  userId: string,
  fileExt: string,
  size: 'thumbnail' | 'medium' | 'original' = 'original'
): string => {
  const timestamp = Date.now();
  return `${userId}/${eventId}/${size}_${timestamp}.${fileExt}`;
};

/**
 * Resizes an image to the specified dimensions
 * @param file The image file
 * @param maxWidth Maximum width
 * @param maxHeight Maximum height
 * @param quality JPEG quality (0-1)
 * @returns Promise resolving to a Blob of the resized image
 */
export const resizeImage = async (
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number = 0.8
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions while maintaining aspect ratio
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round(height * (maxWidth / width));
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round(width * (maxHeight / height));
          height = maxHeight;
        }
      }

      // Set canvas dimensions and draw resized image
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        },
        file.type,
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
};

/**
 * Uploads an event image and creates optimized versions
 * @param file The image file
 * @param eventId The event ID
 * @param userId The user ID
 * @param altText Optional alt text for the image
 * @param onProgress Optional progress callback
 * @returns Promise resolving to the uploaded image URLs and metadata
 */
export const uploadEventImage = async (
  file: File,
  eventId: string,
  userId: string,
  _altText: string = '', // Unused but kept for API compatibility
  onProgress?: (progress: number) => void
): Promise<ImageUploadResponse> => {
  // Validate the image
  const validation = validateImage(file);
  if (!validation.isValid) {
    throw new Error(validation.errors.join(', '));
  }

  // Get file extension
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';

  // Create image metadata
  const metadata: EventImageMetadata = {
    originalWidth: 0,
    originalHeight: 0,
    originalSize: file.size,
    originalFormat: file.type,
    uploadedAt: new Date().toISOString(),
    uploadedBy: userId
  };

  // Get original image dimensions
  await new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => {
      metadata.originalWidth = img.width;
      metadata.originalHeight = img.height;
      resolve();
    };
    img.onerror = () => {
      resolve(); // Continue even if we can't get dimensions
    };
    img.src = URL.createObjectURL(file);
  });

  // Create optimized versions
  const thumbnailBlob = await resizeImage(file, 200, 200, 0.8);
  const mediumBlob = await resizeImage(file, 600, 400, 0.85);
  const originalBlob = await resizeImage(file, 1200, 1200, 0.9);

  // Create file paths
  const thumbnailPath = createEventImagePath(eventId, userId, fileExt, 'thumbnail');
  const mediumPath = createEventImagePath(eventId, userId, fileExt, 'medium');
  const originalPath = createEventImagePath(eventId, userId, fileExt, 'original');

  // Upload thumbnail
  const { error: thumbnailError } = await supabase.storage
    .from('event-images')
    .upload(thumbnailPath, thumbnailBlob, {
      contentType: file.type,
      upsert: true
    });

  if (thumbnailError) throw thumbnailError;
  if (onProgress) onProgress(33);

  // Upload medium
  const { error: mediumError } = await supabase.storage
    .from('event-images')
    .upload(mediumPath, mediumBlob, {
      contentType: file.type,
      upsert: true
    });

  if (mediumError) throw mediumError;
  if (onProgress) onProgress(66);

  // Upload original
  const { error: originalError } = await supabase.storage
    .from('event-images')
    .upload(originalPath, originalBlob, {
      contentType: file.type,
      upsert: true
    });

  if (originalError) throw originalError;
  if (onProgress) onProgress(100);

  // Get public URLs
  const { data: thumbnailUrl } = supabase.storage
    .from('event-images')
    .getPublicUrl(thumbnailPath);

  const { data: mediumUrl } = supabase.storage
    .from('event-images')
    .getPublicUrl(mediumPath);

  const { data: originalUrl } = supabase.storage
    .from('event-images')
    .getPublicUrl(originalPath);

  return {
    imageUrl: originalUrl.publicUrl,
    thumbnailUrl: thumbnailUrl.publicUrl,
    mediumUrl: mediumUrl.publicUrl,
    metadata
  };
};

/**
 * Deletes all image versions for an event
 * @param eventId The event ID
 * @param userId The user ID
 * @returns Promise resolving when deletion is complete
 */
export const deleteEventImages = async (
  eventId: string,
  userId: string
): Promise<void> => {
  const { data, error } = await supabase.storage
    .from('event-images')
    .list(`${userId}/${eventId}`);

  if (error) throw error;

  if (data && data.length > 0) {
    const filesToDelete = data.map(file => `${userId}/${eventId}/${file.name}`);

    const { error: deleteError } = await supabase.storage
      .from('event-images')
      .remove(filesToDelete);

    if (deleteError) throw deleteError;
  }
};
