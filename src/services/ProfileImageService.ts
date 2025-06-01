import { supabase } from '@/lib/supabase';
import { clearProfileCache } from '@/services/profileService';

/**
 * Multi-tier profile image processing and upload service
 * Generates optimized images in 3 sizes: thumbnail (100x100), medium (300x300), full (600x600)
 */

export interface ImageSize {
  width: number;
  height: number;
  quality: number;
  suffix: string;
}

export interface ProcessedImage {
  blob: Blob;
  size: ImageSize;
  filePath: string;
  publicUrl: string;
}

export interface UploadProgress {
  stage: 'processing' | 'uploading' | 'updating' | 'complete';
  progress: number; // 0-100
  message: string;
}

export interface AvatarUrls {
  thumbnail: string;
  medium: string;
  full: string;
  legacy: string; // Points to full for backward compatibility
}

export class ProfileImageService {
  // Image size configurations
  private static readonly IMAGE_SIZES: Record<string, ImageSize> = {
    thumbnail: { width: 100, height: 100, quality: 0.8, suffix: 'thumb' },
    medium: { width: 300, height: 300, quality: 0.85, suffix: 'med' },
    full: { width: 600, height: 600, quality: 0.9, suffix: 'full' }
  };

  // Supported file types
  private static readonly SUPPORTED_TYPES = [
    'image/jpeg',
    'image/png', 
    'image/webp',
    'image/gif'
  ];

  // Maximum original file size (5MB)
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024;

  /**
   * Validates an image file before processing
   */
  private static validateFile(file: File): void {
    if (!this.SUPPORTED_TYPES.includes(file.type)) {
      throw new Error(`Unsupported file type. Please use: ${this.SUPPORTED_TYPES.join(', ')}`);
    }

    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`File too large. Maximum size is ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }
  }

  /**
   * Creates a square crop of an image (centered)
   */
  private static cropToSquare(
    sourceCanvas: HTMLCanvasElement, 
    sourceCtx: CanvasRenderingContext2D,
    img: HTMLImageElement
  ): void {
    const size = Math.min(img.width, img.height);
    const offsetX = (img.width - size) / 2;
    const offsetY = (img.height - size) / 2;

    sourceCanvas.width = size;
    sourceCanvas.height = size;
    sourceCtx.drawImage(img, offsetX, offsetY, size, size, 0, 0, size, size);
  }

  /**
   * Processes an image to a specific size with WebP conversion and fallback
   */
  private static async processImageSize(
    sourceCanvas: HTMLCanvasElement,
    size: ImageSize,
    originalType: string
  ): Promise<Blob> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    canvas.width = size.width;
    canvas.height = size.height;

    // Draw resized image with high quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(sourceCanvas, 0, 0, size.width, size.height);

    // Try WebP first for better compression, fallback to original format
    const formats = ['image/webp', originalType];
    
    for (const format of formats) {
      try {
        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, format, size.quality);
        });

        if (blob && blob.size > 0) {
          return blob;
        }
      } catch (error) {
        console.warn(`Failed to create ${format} blob, trying next format`);
      }
    }

    throw new Error('Failed to process image in any supported format');
  }

  /**
   * Generates file paths for all image sizes
   */
  private static generateFilePaths(userId: string, timestamp: number): Record<string, string> {
    const paths: Record<string, string> = {};
    
    Object.entries(this.IMAGE_SIZES).forEach(([key, size]) => {
      paths[key] = `avatars/${userId}-${timestamp}-${size.suffix}.webp`;
    });

    return paths;
  }

  /**
   * Processes a single image file into multiple optimized sizes
   */
  public static async processImage(
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<ProcessedImage[]> {
    this.validateFile(file);

    onProgress?.({
      stage: 'processing',
      progress: 10,
      message: 'Loading image...'
    });

    return new Promise((resolve, reject) => {
      const img = new Image();
      const sourceCanvas = document.createElement('canvas');
      const sourceCtx = sourceCanvas.getContext('2d');

      if (!sourceCtx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      img.onload = async () => {
        try {
          onProgress?.({
            stage: 'processing',
            progress: 30,
            message: 'Cropping to square...'
          });

          // Create square crop
          this.cropToSquare(sourceCanvas, sourceCtx, img);

          onProgress?.({
            stage: 'processing',
            progress: 50,
            message: 'Generating optimized sizes...'
          });

          const timestamp = Date.now();
          const userId = 'temp'; // Will be set during upload
          const filePaths = this.generateFilePaths(userId, timestamp);
          const processedImages: ProcessedImage[] = [];

          // Process each size
          let progressStep = 0;
          const totalSteps = Object.keys(this.IMAGE_SIZES).length;

          for (const [key, size] of Object.entries(this.IMAGE_SIZES)) {
            const blob = await this.processImageSize(sourceCanvas, size, file.type);
            
            processedImages.push({
              blob,
              size,
              filePath: filePaths[key],
              publicUrl: '' // Will be set after upload
            });

            progressStep++;
            onProgress?.({
              stage: 'processing',
              progress: 50 + (progressStep / totalSteps) * 30,
              message: `Generated ${key} size (${size.width}x${size.height})`
            });
          }

          onProgress?.({
            stage: 'processing',
            progress: 80,
            message: 'Image processing complete'
          });

          resolve(processedImages);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Uploads processed images to Supabase storage
   */
  public static async uploadImages(
    processedImages: ProcessedImage[],
    userId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<ProcessedImage[]> {
    onProgress?.({
      stage: 'uploading',
      progress: 0,
      message: 'Starting upload...'
    });

    const timestamp = Date.now();
    const uploadedImages: ProcessedImage[] = [];

    for (let i = 0; i < processedImages.length; i++) {
      const image = processedImages[i];
      
      // Update file path with actual user ID
      const filePath = `avatars/${userId}-${timestamp}-${image.size.suffix}.webp`;
      
      onProgress?.({
        stage: 'uploading',
        progress: (i / processedImages.length) * 80,
        message: `Uploading ${image.size.suffix} size...`
      });

      // Upload to Supabase
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, image.blob, {
          contentType: 'image/webp',
          upsert: true
        });

      if (uploadError) {
        throw new Error(`Failed to upload ${image.size.suffix} image: ${uploadError.message}`);
      }

      // Get public URL
      const { data } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      uploadedImages.push({
        ...image,
        filePath,
        publicUrl: data.publicUrl
      });
    }

    onProgress?.({
      stage: 'uploading',
      progress: 80,
      message: 'All images uploaded successfully'
    });

    return uploadedImages;
  }

  /**
   * Updates user profile with new avatar URLs
   */
  public static async updateUserProfile(
    userId: string,
    uploadedImages: ProcessedImage[],
    onProgress?: (progress: UploadProgress) => void
  ): Promise<AvatarUrls> {
    onProgress?.({
      stage: 'updating',
      progress: 90,
      message: 'Updating profile...'
    });

    // Map uploaded images to avatar URLs
    const avatarUrls: Partial<AvatarUrls> = {};
    
    uploadedImages.forEach(image => {
      switch (image.size.suffix) {
        case 'thumb':
          avatarUrls.thumbnail = image.publicUrl;
          break;
        case 'med':
          avatarUrls.medium = image.publicUrl;
          break;
        case 'full':
          avatarUrls.full = image.publicUrl;
          avatarUrls.legacy = image.publicUrl; // Backward compatibility
          break;
      }
    });

    // Update database
    const { error } = await supabase
      .from('users')
      .update({
        avatar_thumbnail_url: avatarUrls.thumbnail,
        avatar_medium_url: avatarUrls.medium,
        avatar_full_url: avatarUrls.full,
        avatar_url: avatarUrls.legacy // Maintain backward compatibility
      })
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }

    // Clear profile cache to ensure fresh data is loaded
    clearProfileCache();

    // Debug: Log the generated URLs
    console.log('Generated avatar URLs:', avatarUrls);

    onProgress?.({
      stage: 'complete',
      progress: 100,
      message: 'Profile updated successfully!'
    });

    return avatarUrls as AvatarUrls;
  }

  /**
   * Complete avatar upload workflow
   */
  public static async uploadAvatar(
    file: File,
    userId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<AvatarUrls> {
    try {
      // Process image into multiple sizes
      const processedImages = await this.processImage(file, onProgress);
      
      // Upload all sizes to storage
      const uploadedImages = await this.uploadImages(processedImages, userId, onProgress);
      
      // Update user profile
      const avatarUrls = await this.updateUserProfile(userId, uploadedImages, onProgress);
      
      return avatarUrls;
    } catch (error) {
      throw new Error(`Avatar upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
