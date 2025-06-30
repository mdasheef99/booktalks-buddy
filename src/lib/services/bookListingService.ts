import { supabase } from '@/lib/supabase';
import { ImageUploadService, ImageUploadOptions } from './imageUpload';

// =====================================================
// Types and Interfaces
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
  book_condition: 'excellent' | 'very_good' | 'good' | 'fair' | 'poor';
  book_description?: string;
  asking_price?: number;
}

export interface BookListingData extends BookListingFormData {
  id: string;
  store_id: string;
  image_1_url?: string;
  image_2_url?: string;
  image_3_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  store_owner_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BookListingImageUpload {
  file: File;
  position: 1 | 2 | 3;
}

export interface BookListingSubmission {
  formData: BookListingFormData;
  storeId: string;
  images: File[];
}

export interface BookListingUpdateData {
  status?: 'pending' | 'approved' | 'rejected';
  store_owner_notes?: string;
  reviewed_by?: string;
}

// =====================================================
// Book Listing Service Class
// =====================================================

export class BookListingService {
  private static readonly BOOK_LISTING_CONFIG = {
    bucket: 'book-listing-images',
    maxSizeBytes: 3 * 1024 * 1024, // 3MB per image
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxImages: 3,
    imageConfig: {
      maxWidth: 800,
      maxHeight: 600,
      quality: 0.8
    }
  };

  /**
   * Submit a new book listing with images
   */
  static async submitBookListing(submission: BookListingSubmission): Promise<BookListingData> {
    const { formData, storeId, images } = submission;

    // Validate images
    if (images.length === 0) {
      throw new Error('At least one image is required');
    }

    if (images.length > this.BOOK_LISTING_CONFIG.maxImages) {
      throw new Error(`Maximum ${this.BOOK_LISTING_CONFIG.maxImages} images allowed`);
    }

    // Validate each image
    images.forEach((image, index) => {
      this.validateImage(image, index + 1);
    });

    try {
      // Upload images first
      const imageUrls = await this.uploadImages(images, storeId);

      // Create the book listing record
      const listingData = {
        ...formData,
        store_id: storeId,
        image_1_url: imageUrls[0] || null,
        image_2_url: imageUrls[1] || null,
        image_3_url: imageUrls[2] || null,
        status: 'pending' as const
      };

      const { data, error } = await supabase
        .from('book_listings')
        .insert([listingData])
        .select()
        .single();

      if (error) {
        // If database insert fails, we should clean up uploaded images
        await this.cleanupImages(imageUrls);
        throw new Error(`Failed to create book listing: ${error.message}`);
      }

      return data as BookListingData;
    } catch (error) {
      console.error('Error submitting book listing:', error);
      throw error;
    }
  }

  /**
   * Get book listings for a store (admin use)
   */
  static async getStoreBookListings(
    storeId: string,
    status?: 'pending' | 'approved' | 'rejected'
  ): Promise<BookListingData[]> {
    let query = supabase
      .from('book_listings')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch book listings: ${error.message}`);
    }

    return data as BookListingData[];
  }

  /**
   * Update book listing status (admin use)
   */
  static async updateBookListingStatus(
    listingId: string,
    updateData: BookListingUpdateData,
    reviewerId: string
  ): Promise<BookListingData> {
    const updatePayload = {
      ...updateData,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('book_listings')
      .update(updatePayload)
      .eq('id', listingId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update book listing: ${error.message}`);
    }

    return data as BookListingData;
  }

  /**
   * Get a single book listing by ID
   */
  static async getBookListing(listingId: string): Promise<BookListingData | null> {
    const { data, error } = await supabase
      .from('book_listings')
      .select('*')
      .eq('id', listingId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch book listing: ${error.message}`);
    }

    return data as BookListingData;
  }

  /**
   * Delete a book listing and its images
   */
  static async deleteBookListing(listingId: string): Promise<void> {
    // First get the listing to find image URLs
    const listing = await this.getBookListing(listingId);
    if (!listing) {
      throw new Error('Book listing not found');
    }

    // Delete the database record
    const { error } = await supabase
      .from('book_listings')
      .delete()
      .eq('id', listingId);

    if (error) {
      throw new Error(`Failed to delete book listing: ${error.message}`);
    }

    // Clean up images
    const imageUrls = [listing.image_1_url, listing.image_2_url, listing.image_3_url]
      .filter(Boolean) as string[];
    
    if (imageUrls.length > 0) {
      await this.cleanupImages(imageUrls);
    }
  }

  // =====================================================
  // Private Helper Methods
  // =====================================================

  /**
   * Upload multiple images for a book listing
   */
  private static async uploadImages(images: File[], storeId: string): Promise<string[]> {
    const uploadPromises = images.map(async (image, index) => {
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      const fileName = `${storeId}-${timestamp}-${randomId}-${index + 1}`;

      const uploadOptions: ImageUploadOptions = {
        bucket: this.BOOK_LISTING_CONFIG.bucket,
        folder: storeId,
        maxSizeBytes: this.BOOK_LISTING_CONFIG.maxSizeBytes,
        allowedTypes: this.BOOK_LISTING_CONFIG.allowedTypes,
        ...this.BOOK_LISTING_CONFIG.imageConfig
      };

      const result = await ImageUploadService.uploadImage(image, uploadOptions);
      return result.url;
    });

    return Promise.all(uploadPromises);
  }

  /**
   * Validate an image file
   */
  private static validateImage(file: File, position: number): void {
    if (!file) {
      throw new Error(`Image ${position} is required`);
    }

    if (file.size > this.BOOK_LISTING_CONFIG.maxSizeBytes) {
      const maxSizeMB = this.BOOK_LISTING_CONFIG.maxSizeBytes / (1024 * 1024);
      throw new Error(`Image ${position} must be smaller than ${maxSizeMB}MB`);
    }

    if (!this.BOOK_LISTING_CONFIG.allowedTypes.includes(file.type)) {
      throw new Error(`Image ${position} must be a JPEG, PNG, or WebP file`);
    }
  }

  /**
   * Clean up uploaded images (in case of errors)
   */
  private static async cleanupImages(imageUrls: string[]): Promise<void> {
    try {
      const deletePromises = imageUrls.map(async (url) => {
        if (!url) return;
        
        // Extract file path from URL
        const urlParts = url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const folderName = urlParts[urlParts.length - 2];
        const filePath = `${folderName}/${fileName}`;

        await supabase.storage
          .from(this.BOOK_LISTING_CONFIG.bucket)
          .remove([filePath]);
      });

      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error cleaning up images:', error);
      // Don't throw here as this is cleanup
    }
  }
}


