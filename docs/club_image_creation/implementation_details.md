# Book Club Photo Management - Implementation Details

## Overview

This document provides comprehensive implementation specifications for the Book Club Photo Management feature, based on our architect mode analysis with 91% confidence. The implementation follows a service-layer architecture with client-side compression and real-time member count updates.

## Phase 1: Database Foundation

### Database Schema Migration

**Migration File:** `supabase/migrations/20250XXX_club_photos_schema.sql`

```sql
-- Book Club Photo Management Schema Migration
-- Phase 1: Database Foundation
-- Generated from architect mode specifications

-- =========================
-- Add Photo Columns to book_clubs Table
-- =========================

-- Add photo-related columns (nullable for backward compatibility)
ALTER TABLE book_clubs 
ADD COLUMN IF NOT EXISTS cover_photo_url TEXT,
ADD COLUMN IF NOT EXISTS cover_photo_thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS cover_photo_updated_at TIMESTAMPTZ;

-- Add performance index for photo queries
CREATE INDEX IF NOT EXISTS idx_book_clubs_cover_photo 
ON book_clubs(cover_photo_url) 
WHERE cover_photo_url IS NOT NULL;

-- Add composite index for photo and member queries
CREATE INDEX IF NOT EXISTS idx_book_clubs_photo_member_lookup
ON book_clubs(id, cover_photo_url, lead_user_id)
WHERE cover_photo_url IS NOT NULL;

-- =========================
-- Create Member Count View for Performance
-- =========================

-- Optimized view for member count queries
CREATE OR REPLACE VIEW club_with_member_count AS
SELECT 
  bc.*,
  COALESCE(cm.member_count, 0) as member_count,
  COALESCE(cm.approved_member_count, 0) as approved_member_count
FROM book_clubs bc
LEFT JOIN (
  SELECT 
    club_id, 
    COUNT(*) as member_count,
    COUNT(*) FILTER (WHERE role IN ('admin', 'member')) as approved_member_count
  FROM club_members
  GROUP BY club_id
) cm ON bc.id = cm.club_id;

-- =========================
-- Create Storage Bucket
-- =========================

-- Club photos storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'club-photos',
  'club-photos',
  true,
  3145728, -- 3MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- =========================
-- Storage RLS Policies
-- =========================

-- Club leads can upload photos to their clubs
CREATE POLICY "Club leads can upload photos" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'club-photos' AND
  EXISTS (
    SELECT 1 FROM book_clubs
    WHERE id::text = (storage.foldername(name))[1]
    AND lead_user_id = auth.uid()
  )
);

-- Club leads can update their club photos
CREATE POLICY "Club leads can update photos" ON storage.objects
FOR UPDATE TO authenticated USING (
  bucket_id = 'club-photos' AND
  EXISTS (
    SELECT 1 FROM book_clubs
    WHERE id::text = (storage.foldername(name))[1]
    AND lead_user_id = auth.uid()
  )
);

-- Club leads can delete their club photos
CREATE POLICY "Club leads can delete photos" ON storage.objects
FOR DELETE TO authenticated USING (
  bucket_id = 'club-photos' AND
  EXISTS (
    SELECT 1 FROM book_clubs
    WHERE id::text = (storage.foldername(name))[1]
    AND lead_user_id = auth.uid()
  )
);

-- Public read access for all club photos
CREATE POLICY "Anyone can view club photos" ON storage.objects
FOR SELECT TO public USING (bucket_id = 'club-photos');

-- =========================
-- Comments for Documentation
-- =========================

COMMENT ON COLUMN book_clubs.cover_photo_url IS 'Main club photo URL (1200x800 optimized)';
COMMENT ON COLUMN book_clubs.cover_photo_thumbnail_url IS 'Thumbnail photo URL (300x200 optimized)';
COMMENT ON COLUMN book_clubs.cover_photo_updated_at IS 'Timestamp of last photo update';
COMMENT ON VIEW club_with_member_count IS 'Optimized view for club data with member counts';

-- =========================
-- Verification Queries
-- =========================

-- Verify new columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'book_clubs'
  AND column_name LIKE '%photo%'
ORDER BY column_name;

-- Verify storage bucket created
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'club-photos';

-- Verify RLS policies exist
SELECT policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND qual ILIKE '%club-photos%'
ORDER BY policyname;
```

### Rollback Migration

**Rollback File:** `supabase/migrations/rollback_club_photos_schema.sql`

```sql
-- Rollback script for club photos schema
-- Use only if rollback is necessary

-- Drop RLS policies
DROP POLICY IF EXISTS "Club leads can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Club leads can update photos" ON storage.objects;
DROP POLICY IF EXISTS "Club leads can delete photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view club photos" ON storage.objects;

-- Drop view
DROP VIEW IF EXISTS club_with_member_count;

-- Drop indexes
DROP INDEX IF EXISTS idx_book_clubs_cover_photo;
DROP INDEX IF EXISTS idx_book_clubs_photo_member_lookup;

-- Remove columns (WARNING: This will delete photo data)
-- ALTER TABLE book_clubs DROP COLUMN IF EXISTS cover_photo_url;
-- ALTER TABLE book_clubs DROP COLUMN IF EXISTS cover_photo_thumbnail_url;
-- ALTER TABLE book_clubs DROP COLUMN IF EXISTS cover_photo_updated_at;

-- Note: Storage bucket deletion should be done manually if needed
-- DELETE FROM storage.buckets WHERE id = 'club-photos';
```

## Phase 2: Service Layer Implementation

### ClubPhotoService Specification

**File:** `src/lib/services/clubPhotoService.ts`

```typescript
import { supabase } from '@/lib/supabase';
import { ImageUploadService } from './imageUpload';

export interface ClubPhotoData {
  coverPhotoUrl: string;
  coverPhotoThumbnailUrl: string;
  uploadedAt: string;
  fileSize: number;
}

export interface ClubPhotoUploadOptions {
  file: File;
  clubId: string;
  userId: string;
}

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
    
    // Validate permissions
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
    const mainPath = `${clubId}/${baseFilename}.${fileExt}`;
    const mainUploadResult = await ImageUploadService.uploadImage(mainImageFile, {
      bucket: this.CLUB_PHOTO_CONFIG.bucket,
      folder: clubId,
      maxSizeBytes: this.CLUB_PHOTO_CONFIG.maxSizeBytes
    });
    
    // Upload thumbnail
    const thumbnailPath = `${clubId}/${baseFilename}-thumb.${fileExt}`;
    const thumbnailUploadResult = await ImageUploadService.uploadImage(thumbnailFile, {
      bucket: this.CLUB_PHOTO_CONFIG.bucket,
      folder: clubId,
      maxSizeBytes: this.CLUB_PHOTO_CONFIG.maxSizeBytes
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
   * Update club photo metadata in database
   */
  static async updateClubPhotoInDatabase(clubId: string, photoData: ClubPhotoData): Promise<void> {
    const { error } = await supabase
      .from('book_clubs')
      .update({
        cover_photo_url: photoData.coverPhotoUrl,
        cover_photo_thumbnail_url: photoData.coverPhotoThumbnailUrl,
        cover_photo_updated_at: photoData.uploadedAt
      })
      .eq('id', clubId);

    if (error) {
      throw new Error(`Failed to update club photo: ${error.message}`);
    }
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
  private static extractPathFromUrl(url: string): string | null {
    if (!url) return null;
    
    const match = url.match(/\/storage\/v1\/object\/public\/club-photos\/(.+)$/);
    return match ? match[1] : null;
  }
}
```

### Enhanced ClubMembersService Specification

**File:** `src/lib/services/clubMembersService.ts` (Enhancement)

```typescript
// Add these methods to existing ClubMembersService class

/**
 * Get real-time member count with subscription
 */
async getMemberCountRealtime(clubId: string): Promise<{
  count: number;
  subscription: RealtimeChannel;
}> {
  // Get initial count
  const initialCount = await this.getMemberCountCached(clubId);

  // Set up real-time subscription
  const subscription = supabase
    .channel(`member_count_${clubId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'club_members',
      filter: `club_id=eq.${clubId}`
    }, async () => {
      // Invalidate cache and get fresh count
      const cacheKey = CacheKeys.memberCount(clubId);
      CacheManager.invalidate(cacheKey);
      await this.getMemberCountCached(clubId);
    })
    .subscribe();

  return {
    count: initialCount,
    subscription
  };
}

/**
 * Get cached member count
 */
async getMemberCountCached(clubId: string): Promise<number> {
  const cacheKey = CacheKeys.memberCount(clubId);

  return withCache(
    cacheKey,
    () => this.fetchMemberCount(clubId),
    CacheExpiry.MEDIUM, // 5 minutes
    true
  );
}

/**
 * Fetch member count from database
 */
private async fetchMemberCount(clubId: string): Promise<number> {
  const { count, error } = await supabase
    .from('club_members')
    .select('user_id', { count: 'exact', head: true })
    .eq('club_id', clubId);

  if (error) {
    console.error('Error fetching member count:', error);
    return 0;
  }

  return count || 0;
}

// Add to CacheKeys object
static readonly CacheKeys = {
  // ... existing keys
  memberCount: (clubId: string) => `member_count_${clubId}`,
};
```

## Phase 3: Component Specifications

### ClubPhotoUpload Component

**File:** `src/components/bookclubs/photos/ClubPhotoUpload.tsx`

```typescript
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ImageIcon, Upload, X, AlertCircle } from 'lucide-react';
import { ClubPhotoService, ClubPhotoData } from '@/lib/services/clubPhotoService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ClubPhotoUploadProps {
  clubId?: string; // For management mode
  onUploadComplete: (result: ClubPhotoData) => void;
  onUploadError: (error: string) => void;
  currentPhotoUrl?: string;
  disabled?: boolean;
  mode: 'creation' | 'management';
  className?: string;
}

export const ClubPhotoUpload: React.FC<ClubPhotoUploadProps> = ({
  clubId,
  onUploadComplete,
  onUploadError,
  currentPhotoUrl,
  disabled = false,
  mode,
  className = ""
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl || null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = async (file: File) => {
    if (!user?.id) {
      onUploadError('User not authenticated');
      return;
    }

    if (mode === 'management' && !clubId) {
      onUploadError('Club ID required for photo management');
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(0);

    try {
      // Create preview
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      // Simulate progress for compression
      setProgress(20);

      // Upload photo
      const result = await ClubPhotoService.uploadClubPhoto({
        file,
        clubId: clubId || 'temp', // For creation mode, actual clubId set later
        userId: user.id
      });

      setProgress(100);
      onUploadComplete(result);
      toast.success('Photo uploaded successfully');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      onUploadError(errorMessage);

      // Remove preview on error
      if (previewUrl && previewUrl !== currentPhotoUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(currentPhotoUrl || null);
      }
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleRemovePhoto = async () => {
    if (!user?.id || !clubId) return;

    try {
      await ClubPhotoService.deleteClubPhoto(clubId, user.id);
      setPreviewUrl(null);
      toast.success('Photo removed successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove photo';
      toast.error(errorMessage);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={className}>
      <Card
        className={`
          relative overflow-hidden cursor-pointer transition-all duration-200
          ${dragOver ? 'border-bookconnect-terracotta bg-bookconnect-terracotta/5' : 'border-gray-200'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-bookconnect-brown'}
        `}
        onClick={disabled ? undefined : openFileDialog}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="aspect-[3/2] min-h-[200px] flex items-center justify-center p-6">
          {previewUrl ? (
            // Photo Preview
            <div className="relative w-full h-full">
              <img
                src={previewUrl}
                alt="Club photo preview"
                className="w-full h-full object-cover rounded-lg"
              />

              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    openFileDialog();
                  }}
                  disabled={disabled || uploading}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Replace
                </Button>

                {mode === 'management' && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemovePhoto();
                    }}
                    disabled={disabled || uploading}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          ) : (
            // Upload Placeholder
            <div className="text-center space-y-4">
              {uploading ? (
                <div className="space-y-3">
                  <Upload className="h-12 w-12 mx-auto text-bookconnect-terracotta animate-pulse" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Uploading photo...</p>
                    <Progress value={progress} className="w-full max-w-xs mx-auto" />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <ImageIcon className="h-12 w-12 mx-auto text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {dragOver ? 'Drop photo here' : 'Upload club photo'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Drag and drop or click to select • Max 3MB • JPEG, PNG, WebP
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="absolute bottom-0 left-0 right-0 bg-red-50 border-t border-red-200 p-3">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled || uploading}
        />
      </Card>
    </div>
  );
};

export default ClubPhotoUpload;
```

### ClubPhotoDisplay Component

**File:** `src/components/bookclubs/photos/ClubPhotoDisplay.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { ImageIcon } from 'lucide-react';

interface ClubPhotoDisplayProps {
  photoUrl?: string;
  thumbnailUrl?: string;
  clubName: string;
  size: 'small' | 'medium' | 'large';
  aspectRatio?: '16:9' | '3:2' | '1:1';
  showFallback?: boolean;
  loading?: boolean;
  className?: string;
}

export const ClubPhotoDisplay: React.FC<ClubPhotoDisplayProps> = ({
  photoUrl,
  thumbnailUrl,
  clubName,
  size,
  aspectRatio = '3:2',
  showFallback = true,
  loading = false,
  className = ""
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);

  // Determine which image to use based on size
  useEffect(() => {
    if (size === 'small' && thumbnailUrl) {
      setCurrentSrc(thumbnailUrl);
    } else if (photoUrl) {
      setCurrentSrc(photoUrl);
    } else {
      setCurrentSrc(null);
    }
    setImageLoaded(false);
    setImageError(false);
  }, [photoUrl, thumbnailUrl, size]);

  // Size classes
  const sizeClasses = {
    small: 'h-16 w-24',
    medium: 'h-32 w-48',
    large: 'h-48 w-72'
  };

  // Aspect ratio classes
  const aspectClasses = {
    '16:9': 'aspect-video',
    '3:2': 'aspect-[3/2]',
    '1:1': 'aspect-square'
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
  };

  // Geometric pattern fallback
  const GeometricPattern = () => (
    <div className="w-full h-full bg-gradient-to-br from-bookconnect-brown/10 to-bookconnect-terracotta/10 flex items-center justify-center relative overflow-hidden">
      {/* Geometric pattern background */}
      <div className="absolute inset-0 opacity-20">
        <svg width="100%" height="100%" viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <pattern id="geometric" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="2" fill="currentColor" className="text-bookconnect-brown" />
              <rect x="5" y="5" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-bookconnect-terracotta" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#geometric)" />
        </svg>
      </div>

      {/* Club name overlay */}
      <div className="relative z-10 text-center p-4">
        <ImageIcon className="h-8 w-8 mx-auto text-bookconnect-brown/60 mb-2" />
        <p className="text-sm font-medium text-bookconnect-brown/80 line-clamp-2">
          {clubName}
        </p>
      </div>
    </div>
  );

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
      <ImageIcon className="h-8 w-8 text-gray-400" />
    </div>
  );

  return (
    <div className={`
      relative overflow-hidden rounded-lg bg-gray-100
      ${sizeClasses[size]} ${aspectClasses[aspectRatio]} ${className}
    `}>
      {loading ? (
        <LoadingSkeleton />
      ) : currentSrc && !imageError ? (
        <>
          {/* Main Image */}
          <img
            src={currentSrc}
            alt={`${clubName} club photo`}
            className={`
              w-full h-full object-cover transition-opacity duration-300
              ${imageLoaded ? 'opacity-100' : 'opacity-0'}
            `}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="lazy"
          />

          {/* Loading overlay */}
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <LoadingSkeleton />
            </div>
          )}
        </>
      ) : showFallback ? (
        <GeometricPattern />
      ) : (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
          <ImageIcon className="h-8 w-8 text-gray-400" />
        </div>
      )}
    </div>
  );
};

export default ClubPhotoDisplay;
```

### ClubMemberCount Component

**File:** `src/components/bookclubs/ClubMemberCount.tsx`

```typescript
import React, { useState, useEffect, useRef } from 'react';
import { Users } from 'lucide-react';
import { ClubMembersService } from '@/lib/services/clubMembersService';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface ClubMemberCountProps {
  clubId: string;
  initialCount?: number;
  size: 'small' | 'medium' | 'large';
  showIcon?: boolean;
  realTimeUpdates?: boolean;
  className?: string;
}

export const ClubMemberCount: React.FC<ClubMemberCountProps> = ({
  clubId,
  initialCount = 0,
  size,
  showIcon = true,
  realTimeUpdates = true,
  className = ""
}) => {
  const [memberCount, setMemberCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  const clubMembersService = ClubMembersService.getInstance();

  // Size classes
  const sizeClasses = {
    small: {
      text: 'text-xs',
      icon: 'h-3 w-3',
      gap: 'gap-1'
    },
    medium: {
      text: 'text-sm',
      icon: 'h-4 w-4',
      gap: 'gap-1.5'
    },
    large: {
      text: 'text-base',
      icon: 'h-5 w-5',
      gap: 'gap-2'
    }
  };

  const currentSize = sizeClasses[size];

  useEffect(() => {
    const setupMemberCount = async () => {
      if (!clubId) return;

      setLoading(true);

      try {
        if (realTimeUpdates) {
          // Set up real-time subscription
          const { count, subscription } = await clubMembersService.getMemberCountRealtime(clubId);
          setMemberCount(count);
          subscriptionRef.current = subscription;

          // Listen for count updates
          subscription.on('postgres_changes', async () => {
            const updatedCount = await clubMembersService.getMemberCountCached(clubId);
            setMemberCount(updatedCount);
          });
        } else {
          // Get cached count only
          const count = await clubMembersService.getMemberCountCached(clubId);
          setMemberCount(count);
        }
      } catch (error) {
        console.error('Error setting up member count:', error);
        // Keep initial count on error
      } finally {
        setLoading(false);
      }
    };

    setupMemberCount();

    // Cleanup subscription on unmount
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [clubId, realTimeUpdates]);

  // Format member count for display
  const formatCount = (count: number): string => {
    if (count === 0) return '0 members';
    if (count === 1) return '1 member';
    if (count < 1000) return `${count} members`;
    if (count < 10000) return `${(count / 1000).toFixed(1)}k members`;
    return `${Math.floor(count / 1000)}k members`;
  };

  return (
    <div className={`
      flex items-center ${currentSize.gap} text-gray-600
      ${loading ? 'animate-pulse' : ''}
      ${className}
    `}>
      {showIcon && (
        <Users className={`${currentSize.icon} flex-shrink-0`} />
      )}
      <span className={`${currentSize.text} font-medium`}>
        {loading ? '...' : formatCount(memberCount)}
      </span>
    </div>
  );
};

export default ClubMemberCount;
```

## Phase 4: API Endpoint Implementations

### Club Photo API Functions

**File:** `src/lib/api/bookclubs/photos.ts`

```typescript
import { supabase } from '@/lib/supabase';
import { ClubPhotoService, ClubPhotoData } from '@/lib/services/clubPhotoService';

/**
 * Upload club photo API endpoint
 */
export async function uploadClubPhoto(
  clubId: string,
  file: File,
  userId: string
): Promise<ClubPhotoData> {
  try {
    const result = await ClubPhotoService.uploadClubPhoto({
      file,
      clubId,
      userId
    });

    return result;
  } catch (error) {
    console.error('Upload club photo API error:', error);
    throw error;
  }
}

/**
 * Update club photo metadata
 */
export async function updateClubPhoto(
  clubId: string,
  photoData: Partial<ClubPhotoData>,
  userId: string
): Promise<void> {
  try {
    // Validate permissions
    const { data: club } = await supabase
      .from('book_clubs')
      .select('lead_user_id')
      .eq('id', clubId)
      .single();

    if (club?.lead_user_id !== userId) {
      throw new Error('Only club leads can update club photos');
    }

    // Update database
    const { error } = await supabase
      .from('book_clubs')
      .update({
        cover_photo_url: photoData.coverPhotoUrl,
        cover_photo_thumbnail_url: photoData.coverPhotoThumbnailUrl,
        cover_photo_updated_at: new Date().toISOString()
      })
      .eq('id', clubId);

    if (error) {
      throw new Error(`Failed to update club photo: ${error.message}`);
    }
  } catch (error) {
    console.error('Update club photo API error:', error);
    throw error;
  }
}

/**
 * Delete club photo
 */
export async function deleteClubPhoto(
  clubId: string,
  userId: string
): Promise<void> {
  try {
    await ClubPhotoService.deleteClubPhoto(clubId, userId);
  } catch (error) {
    console.error('Delete club photo API error:', error);
    throw error;
  }
}

/**
 * Get club with photo data
 */
export async function getClubWithPhoto(clubId: string) {
  try {
    const { data, error } = await supabase
      .from('club_with_member_count')
      .select(`
        *,
        cover_photo_url,
        cover_photo_thumbnail_url,
        cover_photo_updated_at,
        member_count
      `)
      .eq('id', clubId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch club: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Get club with photo API error:', error);
    throw error;
  }
}
```

### Enhanced Club Creation API

**File:** `src/lib/api/bookclubs/clubs.ts` (Enhancement)

```typescript
// Add to existing createBookClub function

export async function createBookClubWithPhoto(
  userId: string,
  club: {
    name: string;
    description?: string;
    privacy?: string;
    join_questions_enabled?: boolean;
    photoData?: ClubPhotoData;
  }
) {
  if (!club.name) throw new Error('Club name is required');

  console.log('Creating book club with photo:', {
    name: club.name,
    description: club.description,
    privacy: club.privacy,
    join_questions_enabled: club.join_questions_enabled,
    hasPhoto: !!club.photoData,
    lead_user_id: userId,
    access_tier_required: 'free'
  });

  // Create club data with photo URLs if provided
  const clubData = {
    name: club.name,
    description: club.description,
    privacy: club.privacy,
    join_questions_enabled: club.join_questions_enabled || false,
    lead_user_id: userId,
    access_tier_required: 'free',
    ...(club.photoData && {
      cover_photo_url: club.photoData.coverPhotoUrl,
      cover_photo_thumbnail_url: club.photoData.coverPhotoThumbnailUrl,
      cover_photo_updated_at: club.photoData.uploadedAt
    })
  };

  const { data, error } = await supabase
    .from('book_clubs')
    .insert([clubData])
    .select()
    .single();

  if (error) {
    console.error('Error creating book club:', error);
    throw error;
  }

  console.log('Book club created successfully:', data);

  // Add creator as admin member
  const { error: memberError } = await supabase
    .from('club_members')
    .insert([{ user_id: userId, club_id: data.id, role: 'admin' }]);

  if (memberError) {
    console.error('Error adding creator as member:', memberError);
    throw memberError;
  }

  return data;
}
```

## Phase 4: Integration Steps

### 1. CreateBookClubForm Integration

**File:** `src/components/bookclubs/CreateBookClubForm.tsx` (Enhancement)

```typescript
// Add these imports
import ClubPhotoUpload from './photos/ClubPhotoUpload';
import { ClubPhotoData } from '@/lib/services/clubPhotoService';
import { createBookClubWithPhoto } from '@/lib/api/bookclubs/clubs';

// Add to component state
const [photoData, setPhotoData] = useState<ClubPhotoData | null>(null);
const [photoError, setPhotoError] = useState<string | null>(null);

// Add photo upload handlers
const handlePhotoUploadComplete = (result: ClubPhotoData) => {
  setPhotoData(result);
  setPhotoError(null);
};

const handlePhotoUploadError = (error: string) => {
  setPhotoError(error);
  setPhotoData(null);
};

// Modify handleSubmit function
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // ... existing validation logic

  setLoading(true);
  setCreationStep('creating');

  try {
    const clubData = {
      name: name.trim(),
      description: description.trim(),
      privacy,
      join_questions_enabled: privacy === 'private' ? joinQuestionsEnabled : false,
      photoData: photoData || undefined
    };

    let club: any;

    if (privacy === 'private' && joinQuestionsEnabled && questions.length > 0) {
      // Enhanced API with photo support
      club = await createBookClubWithQuestions(user.id, clubData, questions);
    } else {
      // Use enhanced creation API
      club = await createBookClubWithPhoto(user.id, clubData);
    }

    // ... rest of existing logic
  } catch (error) {
    // ... existing error handling
  }
};

// Add to form JSX (after description field)
<div>
  <label className="block text-sm font-medium mb-2">
    Club Photo (Optional)
  </label>
  <ClubPhotoUpload
    mode="creation"
    onUploadComplete={handlePhotoUploadComplete}
    onUploadError={handlePhotoUploadError}
    disabled={loading}
    className="mb-2"
  />
  {photoError && (
    <p className="text-sm text-red-600 mt-1">{photoError}</p>
  )}
  {photoData && (
    <p className="text-sm text-green-600 mt-1">
      Photo uploaded successfully
    </p>
  )}
</div>
```

### 2. ClubSettingsPanel Integration

**File:** `src/components/bookclubs/management/ClubSettingsPanel.tsx` (Enhancement)

```typescript
// Add these imports
import ClubPhotoUpload from '../photos/ClubPhotoUpload';
import { ClubPhotoData } from '@/lib/services/clubPhotoService';

// Add to component state
const [currentPhoto, setCurrentPhoto] = useState<string | null>(null);

// Add photo management section to form
<div className="space-y-4">
  <h3 className="text-lg font-medium">Club Photo</h3>

  <ClubPhotoUpload
    clubId={clubId}
    mode="management"
    currentPhotoUrl={currentPhoto}
    onUploadComplete={(result: ClubPhotoData) => {
      setCurrentPhoto(result.coverPhotoUrl);
      toast.success('Club photo updated successfully');
    }}
    onUploadError={(error: string) => {
      toast.error(`Photo upload failed: ${error}`);
    }}
    disabled={loading}
  />
</div>
```

### 3. Discovery Cards Integration

**File:** `src/components/bookclubs/DiscoveryBookClubCard.tsx` (Enhancement)

```typescript
// Add these imports
import ClubPhotoDisplay from './photos/ClubPhotoDisplay';
import ClubMemberCount from './ClubMemberCount';

// Modify card structure
<Card className="p-6 hover:bg-gray-50 transition-colors" onClick={() => onViewClub(club.id)}>
  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">

    {/* Photo Section */}
    <div className="flex-shrink-0">
      <ClubPhotoDisplay
        photoUrl={club.cover_photo_url}
        thumbnailUrl={club.cover_photo_thumbnail_url}
        clubName={club.name}
        size="medium"
        aspectRatio="3:2"
      />
    </div>

    <div className="flex-1">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-xl font-semibold">{club.name}</h3>
        <ClubMemberCount
          clubId={club.id}
          initialCount={club.member_count}
          size="small"
          realTimeUpdates={true}
        />
      </div>

      {/* ... rest of existing content */}
    </div>
  </div>
</Card>
```

### 4. Club Header Integration

**File:** `src/components/bookclubs/sections/ClubHeader.tsx` (Enhancement)

```typescript
// Add these imports
import ClubPhotoDisplay from '../photos/ClubPhotoDisplay';
import ClubMemberCount from '../ClubMemberCount';

// Modify header structure
<div className="relative">
  {/* Hero Photo Background */}
  {club.cover_photo_url ? (
    <div className="relative h-48 md:h-64 overflow-hidden rounded-lg mb-6">
      <ClubPhotoDisplay
        photoUrl={club.cover_photo_url}
        thumbnailUrl={club.cover_photo_thumbnail_url}
        clubName={club.name}
        size="large"
        aspectRatio="16:9"
        className="w-full h-full"
      />

      {/* Overlay with club info */}
      <div className="absolute inset-0 bg-black/40 flex items-end">
        <div className="p-6 text-white">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{club.name}</h1>
          <ClubMemberCount
            clubId={clubId}
            initialCount={members.length}
            size="large"
            className="text-white"
          />
        </div>
      </div>
    </div>
  ) : (
    // Fallback header without photo
    <div className="mb-6">
      <h1 className="text-3xl md:text-4xl font-bold mb-2">{club.name}</h1>
      <ClubMemberCount
        clubId={clubId}
        initialCount={members.length}
        size="large"
      />
    </div>
  )}

  {/* ... rest of existing header content */}
</div>
```

### 5. User Clubs List Integration

**File:** `src/components/bookclubs/BookClubList.tsx` (Enhancement)

```typescript
// Add these imports
import ClubPhotoDisplay from './photos/ClubPhotoDisplay';
import ClubMemberCount from './ClubMemberCount';

// Modify BookClubCard component
const BookClubCard: React.FC<{ club: any; onClick: () => void }> = ({ club, onClick }) => {
  return (
    <Card className="overflow-hidden cursor-pointer h-64 flex flex-col" onClick={onClick}>
      {/* Photo Header */}
      <div className="h-32 overflow-hidden">
        <ClubPhotoDisplay
          photoUrl={club.cover_photo_url}
          thumbnailUrl={club.cover_photo_thumbnail_url}
          clubName={club.name}
          size="medium"
          aspectRatio="16:9"
          className="w-full h-full"
        />
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold line-clamp-1">{club.name}</h3>
          <ClubMemberCount
            clubId={club.id}
            initialCount={club.member_count}
            size="small"
          />
        </div>

        <p className="text-sm text-gray-600 line-clamp-3 flex-grow">
          {club.description || 'No description available'}
        </p>
      </div>
    </Card>
  );
};
```

### 6. Real-time Hooks Enhancement

**File:** `src/components/bookclubs/hooks/useClubDetails.tsx` (Enhancement)

```typescript
// Add photo update subscription to existing subscriptions
const subscription = supabase
  .channel('club_details_channel')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'book_clubs',
    filter: `id=eq.${clubId}`
  }, (payload) => {
    // Handle photo updates
    if (payload.new && (
      payload.new.cover_photo_url !== payload.old?.cover_photo_url ||
      payload.new.cover_photo_thumbnail_url !== payload.old?.cover_photo_thumbnail_url
    )) {
      // Refresh club data to get updated photo URLs
      fetchData();
    }
  })
  // ... existing subscriptions
  .subscribe();
```

## Phase 5: Testing Requirements

### Unit Tests

**File:** `src/lib/services/__tests__/clubPhotoService.test.ts`

```typescript
import { ClubPhotoService } from '../clubPhotoService';
import { supabase } from '@/lib/supabase';

// Mock Supabase
jest.mock('@/lib/supabase');

describe('ClubPhotoService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadClubPhoto', () => {
    it('should upload photo successfully', async () => {
      // Test implementation
    });

    it('should validate file size', async () => {
      // Test file size validation
    });

    it('should validate file type', async () => {
      // Test file type validation
    });

    it('should validate club lead permission', async () => {
      // Test permission validation
    });
  });

  describe('deleteClubPhoto', () => {
    it('should delete photo successfully', async () => {
      // Test implementation
    });

    it('should handle missing photo gracefully', async () => {
      // Test edge case
    });
  });
});
```

### Component Tests

**File:** `src/components/bookclubs/photos/__tests__/ClubPhotoUpload.test.tsx`

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ClubPhotoUpload from '../ClubPhotoUpload';

describe('ClubPhotoUpload', () => {
  const mockProps = {
    mode: 'creation' as const,
    onUploadComplete: jest.fn(),
    onUploadError: jest.fn(),
    disabled: false
  };

  it('should render upload interface', () => {
    render(<ClubPhotoUpload {...mockProps} />);
    expect(screen.getByText('Upload club photo')).toBeInTheDocument();
  });

  it('should handle file selection', async () => {
    render(<ClubPhotoUpload {...mockProps} />);

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByRole('button');

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockProps.onUploadComplete).toHaveBeenCalled();
    });
  });

  it('should validate file size', async () => {
    render(<ClubPhotoUpload {...mockProps} />);

    // Test with oversized file
    const largeFile = new File(['x'.repeat(4 * 1024 * 1024)], 'large.jpg', {
      type: 'image/jpeg'
    });

    // Test file size validation
  });
});
```

### Integration Tests

**File:** `src/components/bookclubs/__tests__/clubPhotoIntegration.test.tsx`

```typescript
describe('Club Photo Integration', () => {
  it('should create club with photo', async () => {
    // Test complete club creation workflow with photo
  });

  it('should display photos in discovery cards', async () => {
    // Test photo display in club discovery
  });

  it('should update member count in real-time', async () => {
    // Test real-time member count updates
  });

  it('should handle photo management permissions', async () => {
    // Test club lead photo management
  });
});
```

### Performance Tests

**File:** `src/lib/services/__tests__/performance.test.ts`

```typescript
describe('Performance Tests', () => {
  it('should compress images within target ratio', async () => {
    // Test 3MB → ~500KB compression
  });

  it('should load club list within time limit', async () => {
    // Test page load performance impact
  });

  it('should handle multiple concurrent uploads', async () => {
    // Test concurrent upload performance
  });
});
```

---

*This implementation details document provides comprehensive specifications for all phases of the Book Club Photo Management feature development, based on our 91% confidence architect mode analysis.*
