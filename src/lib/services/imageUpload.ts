import { supabase } from '@/lib/supabase';

export interface ImageUploadOptions {
  bucket: string;
  folder: string;
  maxSizeBytes?: number;
  allowedTypes?: string[];
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface ImageUploadResult {
  url: string;
  path: string;
  size: number;
  type: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Service for handling image uploads to Supabase Storage with optimization
 */
export class ImageUploadService {
  private static readonly DEFAULT_OPTIONS: Partial<ImageUploadOptions> = {
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    quality: 0.8,
    maxWidth: 1920,
    maxHeight: 1080
  };

  /**
   * Upload an image file with optimization and validation
   */
  static async uploadImage(
    file: File,
    options: ImageUploadOptions,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<ImageUploadResult> {
    const config = { ...this.DEFAULT_OPTIONS, ...options };

    // Validate file
    this.validateFile(file, config);

    // Optimize image if needed
    const optimizedFile = await this.optimizeImage(file, config);

    // Generate unique filename
    const fileName = this.generateFileName(optimizedFile);
    const filePath = `${config.folder}/${fileName}`;

    try {
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(config.bucket)
        .upload(filePath, optimizedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(config.bucket)
        .getPublicUrl(filePath);

      return {
        url: urlData.publicUrl,
        path: filePath,
        size: optimizedFile.size,
        type: optimizedFile.type
      };
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    }
  }

  /**
   * Delete an image from storage
   */
  static async deleteImage(bucket: string, path: string): Promise<void> {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  /**
   * Validate file size and type
   */
  private static validateFile(file: File, options: Partial<ImageUploadOptions>): void {
    // Check file size
    if (options.maxSizeBytes && file.size > options.maxSizeBytes) {
      const maxSizeMB = (options.maxSizeBytes / (1024 * 1024)).toFixed(1);
      throw new Error(`File size must be less than ${maxSizeMB}MB`);
    }

    // Check file type
    if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
      const allowedExtensions = options.allowedTypes
        .map(type => type.split('/')[1])
        .join(', ');
      throw new Error(`File type must be one of: ${allowedExtensions}`);
    }
  }

  /**
   * Optimize image by resizing and compressing
   */
  private static async optimizeImage(
    file: File,
    options: Partial<ImageUploadOptions>
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          // Calculate new dimensions
          const { width, height } = this.calculateDimensions(
            img.width,
            img.height,
            options.maxWidth || 1920,
            options.maxHeight || 1080
          );

          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;

          // Draw and compress image
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Image optimization failed'));
                return;
              }

              // Create optimized file
              const optimizedFile = new File([blob], file.name, {
                type: 'image/jpeg', // Convert to JPEG for better compression
                lastModified: Date.now()
              });

              resolve(optimizedFile);
            },
            'image/jpeg',
            options.quality || 0.8
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Calculate optimal dimensions while maintaining aspect ratio
   */
  private static calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    let { width, height } = { width: originalWidth, height: originalHeight };

    // Scale down if larger than max dimensions
    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }

    if (height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }

    return { width: Math.round(width), height: Math.round(height) };
  }

  /**
   * Generate unique filename with timestamp
   */
  private static generateFileName(file: File): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop() || 'jpg';
    return `${timestamp}_${randomString}.${extension}`;
  }
}

/**
 * Predefined upload configurations for different use cases
 */
export const UPLOAD_CONFIGS = {
  CAROUSEL_BOOK: {
    bucket: 'store-carousel-images',
    maxSizeBytes: 3 * 1024 * 1024, // 3MB
    maxWidth: 600,
    maxHeight: 800,
    quality: 0.85
  },
  PROMOTIONAL_BANNER: {
    bucket: 'store-banner-images',
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
    maxWidth: 1200,
    maxHeight: 400,
    quality: 0.8
  },
  COMMUNITY_MEMBER: {
    bucket: 'store-community-images',
    maxSizeBytes: 2 * 1024 * 1024, // 2MB
    maxWidth: 400,
    maxHeight: 400,
    quality: 0.9
  }
} as const;
