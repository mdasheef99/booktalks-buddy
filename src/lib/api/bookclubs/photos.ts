/**
 * Club Photos API
 *
 * API functions for club photo management operations.
 * Handles photo upload, update, delete, and retrieval operations.
 */

import { supabase } from '@/lib/supabase';
import { ClubPhotoService, ClubPhotoData } from '@/lib/services/clubPhotoService';

// =====================================================
// API Functions
// =====================================================

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

/**
 * Get club photo data only
 */
export async function getClubPhoto(clubId: string): Promise<ClubPhotoData | null> {
  try {
    return await ClubPhotoService.getClubPhoto(clubId);
  } catch (error) {
    console.error('Get club photo API error:', error);
    throw error;
  }
}
