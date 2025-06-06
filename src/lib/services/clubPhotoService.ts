/**
 * Club Photo Service
 *
 * Handles all photo-related operations for club management.
 * Provides photo upload, compression, management, and deletion operations.
 */

import { supabase } from '@/lib/supabase';
import { ImageUploadService } from './imageUpload';

// =====================================================
// Types
// =====================================================

export interface ClubPhotoData {
  coverPhotoUrl: string;
  coverPhotoThumbnailUrl: string;
  uploadedAt: string;
  fileSize: number;
  tempBucket?: string; // Optional: indicates if photos are in temporary storage
}

export interface ClubPhotoUploadOptions {
  file: File;
  clubId: string;
  userId: string;
}

// =====================================================
// Club Photo Service Class
// =====================================================

export class ClubPhotoService {
  private static readonly CLUB_PHOTO_CONFIG = {
    bucket: 'club-photos',
    maxSizeBytes: 3 * 1024 * 1024, // 3MB
    targetSizeBytes: 512 * 1024, // 512KB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    mainImage: {
      maxWidth: 1200,
      maxHeight: 800,
      quality: 0.8
    },
    thumbnail: {
      maxWidth: 300,
      maxHeight: 200,
      quality: 0.7
    }
  };

  /**
   * Upload club photo with compression and thumbnail generation
   */
  static async uploadClubPhoto(options: ClubPhotoUploadOptions): Promise<ClubPhotoData> {
    const { file, clubId, userId } = options;

    // For creation mode, use a different approach
    if (clubId === 'temp') {
      return this.uploadClubPhotoForCreation(file, userId);
    }

    // Validate permissions for management mode
    await this.validateClubLeadPermission(clubId, userId);

    // Validate file
    this.validatePhotoFile(file);

    // Generate unique filename
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const baseFilename = `${timestamp}-${Math.random().toString(36).substr(2, 9)}`;

    // Process images
    const mainImageFile = await this.compressImage(file, this.CLUB_PHOTO_CONFIG.mainImage);
    const thumbnailFile = await this.compressImage(file, this.CLUB_PHOTO_CONFIG.thumbnail);

    // Upload main image
    console.log('🔄 Uploading main image to club-photos bucket:', {
      bucket: this.CLUB_PHOTO_CONFIG.bucket,
      folder: clubId,
      userId
    });
    const mainUploadResult = await ImageUploadService.uploadImage(mainImageFile, {
      bucket: this.CLUB_PHOTO_CONFIG.bucket,
      folder: clubId,
      maxSizeBytes: this.CLUB_PHOTO_CONFIG.maxSizeBytes,
      allowedTypes: this.CLUB_PHOTO_CONFIG.allowedTypes
    });

    // Upload thumbnail
    const thumbnailUploadResult = await ImageUploadService.uploadImage(thumbnailFile, {
      bucket: this.CLUB_PHOTO_CONFIG.bucket,
      folder: clubId,
      maxSizeBytes: this.CLUB_PHOTO_CONFIG.maxSizeBytes,
      allowedTypes: this.CLUB_PHOTO_CONFIG.allowedTypes
    });

    // Update database
    const photoData: ClubPhotoData = {
      coverPhotoUrl: mainUploadResult.url,
      coverPhotoThumbnailUrl: thumbnailUploadResult.url,
      uploadedAt: new Date().toISOString(),
      fileSize: mainImageFile.size
    };

    await this.updateClubPhotoInDatabase(clubId, photoData);

    return photoData;
  }

  /**
   * Upload club photo for creation mode (before club exists)
   * Uses the profiles bucket temporarily since user has upload access there
   */
  private static async uploadClubPhotoForCreation(file: File, userId: string): Promise<ClubPhotoData> {
    // Validate file
    this.validatePhotoFile(file);

    // Generate unique filename with user ID for temporary storage
    // Use avatars folder since that's what the profiles bucket policy allows
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);
    const tempFolder = `avatars`; // Use avatars folder which is allowed by RLS policy

    // Process images
    const mainImageFile = await this.compressImage(file, this.CLUB_PHOTO_CONFIG.mainImage);
    const thumbnailFile = await this.compressImage(file, this.CLUB_PHOTO_CONFIG.thumbnail);

    // Create filenames that match the profiles bucket policy (userId-timestamp-type)
    const mainFileName = `${userId}-${timestamp}-${randomId}-club-main.jpg`;
    const thumbFileName = `${userId}-${timestamp}-${randomId}-club-thumb.jpg`;

    // Upload main image directly using supabase storage (bypass ImageUploadService)
    const mainPath = `${tempFolder}/${mainFileName}`;
    const { data: mainData, error: mainError } = await supabase.storage
      .from('profiles')
      .upload(mainPath, mainImageFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (mainError) {
      throw new Error(`Failed to upload main image: ${mainError.message}`);
    }

    // Upload thumbnail directly using supabase storage
    const thumbPath = `${tempFolder}/${thumbFileName}`;
    const { data: thumbData, error: thumbError } = await supabase.storage
      .from('profiles')
      .upload(thumbPath, thumbnailFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (thumbError) {
      throw new Error(`Failed to upload thumbnail: ${thumbError.message}`);
    }

    // Get public URLs
    const { data: mainUrlData } = supabase.storage
      .from('profiles')
      .getPublicUrl(mainPath);

    const { data: thumbUrlData } = supabase.storage
      .from('profiles')
      .getPublicUrl(thumbPath);

    // Return photo data without updating database (will be done during club creation)
    return {
      coverPhotoUrl: mainUrlData.publicUrl,
      coverPhotoThumbnailUrl: thumbUrlData.publicUrl,
      uploadedAt: new Date().toISOString(),
      fileSize: mainImageFile.size,
      tempBucket: 'profiles' // Mark that this is in temp storage
    };
  }

  /**
   * Move photos from temporary folder to club folder after club creation
   */
  static async movePhotosToClubFolder(clubId: string, photoData: ClubPhotoData): Promise<ClubPhotoData> {
    try {
      console.log('🔄 Starting photo move process:', { clubId, photoData });

      // Determine source bucket (profiles for temp storage, club-photos for existing)
      const sourceBucket = photoData.tempBucket || this.CLUB_PHOTO_CONFIG.bucket;
      console.log('📁 Source bucket:', sourceBucket);

      // Extract temp folder paths from URLs
      console.log('🔍 [URL EXTRACTION] Processing URLs:', {
        mainUrl: photoData.coverPhotoUrl,
        thumbUrl: photoData.coverPhotoThumbnailUrl,
        sourceBucket
      });

      const mainTempPath = this.extractPathFromUrl(photoData.coverPhotoUrl, sourceBucket);
      const thumbnailTempPath = this.extractPathFromUrl(photoData.coverPhotoThumbnailUrl, sourceBucket);

      console.log('📂 [URL EXTRACTION] Extracted paths:', { mainTempPath, thumbnailTempPath });

      if (!mainTempPath || !thumbnailTempPath) {
        throw new Error('Invalid photo URLs for moving');
      }

      // Generate new paths in club folder
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      const mainNewPath = `${clubId}/${timestamp}-${randomId}-main.jpg`;
      const thumbnailNewPath = `${clubId}/${timestamp}-${randomId}-thumb.jpg`;

      // If photos are in temp storage (profiles bucket), copy them to club-photos bucket
      if (sourceBucket === 'profiles') {
        console.log('📥 [PHOTO MOVE] Downloading from profiles bucket...');

        // Download from profiles bucket
        const { data: mainData, error: mainDownloadError } = await supabase.storage
          .from('profiles')
          .download(mainTempPath);

        if (mainDownloadError) {
          console.error('❌ [PHOTO MOVE] Failed to download main image:', mainDownloadError);
          throw new Error(`Failed to download main image: ${mainDownloadError.message}`);
        }
        console.log('✅ [PHOTO MOVE] Main image downloaded, size:', mainData.size);

        const { data: thumbData, error: thumbDownloadError } = await supabase.storage
          .from('profiles')
          .download(thumbnailTempPath);

        if (thumbDownloadError) {
          console.error('❌ [PHOTO MOVE] Failed to download thumbnail:', thumbDownloadError);
          throw new Error(`Failed to download thumbnail: ${thumbDownloadError.message}`);
        }
        console.log('✅ [PHOTO MOVE] Thumbnail downloaded, size:', thumbData.size);

        // Upload to club-photos bucket
        console.log('📤 [PHOTO MOVE] Uploading to club-photos bucket:', {
          bucket: this.CLUB_PHOTO_CONFIG.bucket,
          mainNewPath,
          thumbnailNewPath
        });

        const { data: mainUploadData, error: mainUploadError } = await supabase.storage
          .from(this.CLUB_PHOTO_CONFIG.bucket)
          .upload(mainNewPath, mainData, { cacheControl: '3600', upsert: false });

        if (mainUploadError) {
          console.error('❌ [PHOTO MOVE] Failed to upload main image:', {
            error: mainUploadError,
            path: mainNewPath,
            bucket: this.CLUB_PHOTO_CONFIG.bucket,
            dataSize: mainData.size
          });
          throw new Error(`Failed to upload main image: ${mainUploadError.message}`);
        }
        console.log('✅ [PHOTO MOVE] Main image uploaded successfully:', mainUploadData);

        const { error: thumbUploadError } = await supabase.storage
          .from(this.CLUB_PHOTO_CONFIG.bucket)
          .upload(thumbnailNewPath, thumbData, { cacheControl: '3600', upsert: false });

        if (thumbUploadError) {
          console.error('❌ [PHOTO MOVE] Failed to upload thumbnail:', thumbUploadError);
          throw new Error(`Failed to upload thumbnail: ${thumbUploadError.message}`);
        }
        console.log('✅ [PHOTO MOVE] Thumbnail uploaded successfully');

        // Clean up temp files from profiles bucket
        await supabase.storage.from('profiles').remove([mainTempPath, thumbnailTempPath]);
      } else {
        // Move within club-photos bucket
        const { error: mainMoveError } = await supabase.storage
          .from(this.CLUB_PHOTO_CONFIG.bucket)
          .move(mainTempPath, mainNewPath);

        if (mainMoveError) {
          throw new Error(`Failed to move main image: ${mainMoveError.message}`);
        }

        const { error: thumbMoveError } = await supabase.storage
          .from(this.CLUB_PHOTO_CONFIG.bucket)
          .move(thumbnailTempPath, thumbnailNewPath);

        if (thumbMoveError) {
          throw new Error(`Failed to move thumbnail: ${thumbMoveError.message}`);
        }
      }

      // Get new URLs
      const { data: mainUrlData } = supabase.storage
        .from(this.CLUB_PHOTO_CONFIG.bucket)
        .getPublicUrl(mainNewPath);

      const { data: thumbUrlData } = supabase.storage
        .from(this.CLUB_PHOTO_CONFIG.bucket)
        .getPublicUrl(thumbnailNewPath);

      // Return updated photo data
      const updatedPhotoData: ClubPhotoData = {
        coverPhotoUrl: mainUrlData.publicUrl,
        coverPhotoThumbnailUrl: thumbUrlData.publicUrl,
        uploadedAt: photoData.uploadedAt,
        fileSize: photoData.fileSize
      };

      // Update database with new URLs
      await this.updateClubPhotoInDatabase(clubId, updatedPhotoData);

      return updatedPhotoData;
    } catch (error) {
      console.error('Error moving photos to club folder:', error);
      throw error;
    }
  }

  /**
   * Update club photo metadata in database
   */
  static async updateClubPhotoInDatabase(clubId: string, photoData: ClubPhotoData): Promise<void> {
    console.log('💾 [DATABASE UPDATE] Updating club photo metadata:', {
      clubId,
      coverPhotoUrl: photoData.coverPhotoUrl,
      coverPhotoThumbnailUrl: photoData.coverPhotoThumbnailUrl,
      uploadedAt: photoData.uploadedAt
    });

    const { data, error } = await supabase
      .from('book_clubs')
      .update({
        cover_photo_url: photoData.coverPhotoUrl,
        cover_photo_thumbnail_url: photoData.coverPhotoThumbnailUrl,
        cover_photo_updated_at: photoData.uploadedAt
      })
      .eq('id', clubId)
      .select(); // Add select to see what was updated

    if (error) {
      console.error('❌ [DATABASE UPDATE] Failed to update club photo:', error);
      throw new Error(`Failed to update club photo: ${error.message}`);
    }

    console.log('✅ [DATABASE UPDATE] Club photo metadata updated successfully:', data);
  }

  /**
   * Delete club photo
   */
  static async deleteClubPhoto(clubId: string, userId: string): Promise<void> {
    // Validate permissions
    await this.validateClubLeadPermission(clubId, userId);
    
    // Get current photo URLs
    const { data: club } = await supabase
      .from('book_clubs')
      .select('cover_photo_url, cover_photo_thumbnail_url')
      .eq('id', clubId)
      .single();
    
    if (!club?.cover_photo_url) {
      throw new Error('No photo to delete');
    }
    
    // Delete from storage
    const mainPath = this.extractPathFromUrl(club.cover_photo_url);
    const thumbnailPath = this.extractPathFromUrl(club.cover_photo_thumbnail_url);
    
    if (mainPath) {
      await supabase.storage.from(this.CLUB_PHOTO_CONFIG.bucket).remove([mainPath]);
    }
    if (thumbnailPath) {
      await supabase.storage.from(this.CLUB_PHOTO_CONFIG.bucket).remove([thumbnailPath]);
    }
    
    // Update database
    await supabase
      .from('book_clubs')
      .update({
        cover_photo_url: null,
        cover_photo_thumbnail_url: null,
        cover_photo_updated_at: new Date().toISOString()
      })
      .eq('id', clubId);
  }

  /**
   * Get club photo data
   */
  static async getClubPhoto(clubId: string): Promise<ClubPhotoData | null> {
    const { data: club } = await supabase
      .from('book_clubs')
      .select('cover_photo_url, cover_photo_thumbnail_url, cover_photo_updated_at')
      .eq('id', clubId)
      .single();
    
    if (!club?.cover_photo_url) {
      return null;
    }
    
    return {
      coverPhotoUrl: club.cover_photo_url,
      coverPhotoThumbnailUrl: club.cover_photo_thumbnail_url,
      uploadedAt: club.cover_photo_updated_at || new Date().toISOString(),
      fileSize: 0 // Size not stored in database
    };
  }

  /**
   * Validate club lead permission
   */
  private static async validateClubLeadPermission(clubId: string, userId: string): Promise<void> {
    const { data } = await supabase
      .from('book_clubs')
      .select('lead_user_id')
      .eq('id', clubId)
      .single();
    
    if (data?.lead_user_id !== userId) {
      throw new Error('Only club leads can manage club photos');
    }
  }

  /**
   * Validate photo file
   */
  private static validatePhotoFile(file: File): void {
    if (file.size > this.CLUB_PHOTO_CONFIG.maxSizeBytes) {
      throw new Error('File size must be less than 3MB');
    }
    
    if (!this.CLUB_PHOTO_CONFIG.allowedTypes.includes(file.type)) {
      throw new Error('Only JPEG, PNG, and WebP images are allowed');
    }
  }

  /**
   * Compress image using Canvas API
   */
  private static async compressImage(
    file: File, 
    config: { maxWidth: number; maxHeight: number; quality: number }
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      
      img.onload = () => {
        // Calculate dimensions maintaining aspect ratio
        let { width, height } = img;
        const aspectRatio = width / height;
        
        if (width > config.maxWidth) {
          width = config.maxWidth;
          height = width / aspectRatio;
        }
        
        if (height > config.maxHeight) {
          height = config.maxHeight;
          width = height * aspectRatio;
        }
        
        // Set canvas dimensions and draw
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            
            resolve(compressedFile);
          },
          'image/jpeg',
          config.quality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Extract storage path from public URL
   */
  private static extractPathFromUrl(url: string, bucket?: string): string | null {
    if (!url) return null;

    // Default to club-photos bucket if not specified
    const targetBucket = bucket || 'club-photos';
    const regex = new RegExp(`\\/storage\\/v1\\/object\\/public\\/${targetBucket}\\/(.+)$`);
    const match = url.match(regex);
    return match ? match[1] : null;
  }
}
