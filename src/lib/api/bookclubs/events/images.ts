import { supabase } from '@/lib/supabase';
import { hasContextualEntitlement } from '@/lib/entitlements';
import { getUserEntitlements } from '@/lib/entitlements/cache';
import { uploadEventImage as processEventImage, deleteEventImages } from '@/lib/utils/image-processing';
import { ImageUploadResponse } from '@/types/event-images';
import { getEvent } from './queries';

/**
 * Upload an image for an event
 * @param userId - The ID of the user uploading the image
 * @param eventId - The ID of the event
 * @param file - The image file to upload
 * @param altText - Optional alt text for the image
 * @param onProgress - Optional progress callback
 * @returns The uploaded image URLs and metadata
 */
export async function uploadEventImage(
  userId: string,
  eventId: string,
  file: File,
  altText: string = '',
  onProgress?: (progress: number) => void
): Promise<ImageUploadResponse> {
  // Get the event to check permissions
  const event = await getEvent(eventId);

  // Get the user's entitlements
  const entitlements = await getUserEntitlements(userId);

  // Check if the user has permission to update this event
  const isCreator = event.created_by === userId;
  const hasStorePermission = event.store_id ?
    hasContextualEntitlement(entitlements, 'STORE_OWNER', event.store_id) ||
    hasContextualEntitlement(entitlements, 'STORE_MANAGER', event.store_id) :
    false;

  if (!isCreator && !hasStorePermission) {
    throw new Error('Unauthorized: Only the event creator or store owners/managers can upload images');
  }

  try {
    // Upload the image and get URLs
    const imageData = await processEventImage(file, eventId, userId, altText, onProgress);

    // Update the event with the image URLs
    const { error } = await supabase
      .from('events')
      .update({
        image_url: imageData.imageUrl,
        thumbnail_url: imageData.thumbnailUrl,
        medium_url: imageData.mediumUrl,
        image_alt_text: altText,
        image_metadata: imageData.metadata
      })
      .eq('id', eventId)
      .select()
      .single();

    if (error) {
      console.error('Error updating event with image URLs:', error);
      throw error;
    }

    return imageData;
  } catch (error) {
    console.error('Error in uploadEventImage:', error);
    throw error;
  }
}

/**
 * Remove an image from an event
 * @param userId - The ID of the user removing the image
 * @param eventId - The ID of the event
 * @returns Success status
 */
export async function removeEventImage(
  userId: string,
  eventId: string
): Promise<{ success: boolean }> {
  // Get the event to check permissions
  const event = await getEvent(eventId);

  // Get the user's entitlements
  const entitlements = await getUserEntitlements(userId);

  // Check if the user has permission to update this event
  const isCreator = event.created_by === userId;
  const hasStorePermission = event.store_id ?
    hasContextualEntitlement(entitlements, 'STORE_OWNER', event.store_id) ||
    hasContextualEntitlement(entitlements, 'STORE_MANAGER', event.store_id) :
    false;

  if (!isCreator && !hasStorePermission) {
    throw new Error('Unauthorized: Only the event creator or store owners/managers can remove images');
  }

  try {
    // Delete the images from storage
    if (event.image_url) {
      await deleteEventImages(eventId, userId);
    }

    // Update the event to remove image references
    const { error } = await supabase
      .from('events')
      .update({
        image_url: null,
        thumbnail_url: null,
        medium_url: null,
        image_alt_text: null,
        image_metadata: null
      })
      .eq('id', eventId)
      .select()
      .single();

    if (error) {
      console.error('Error updating event to remove image references:', error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error in removeEventImage:', error);
    throw error;
  }
}
