import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { CarouselAPI, UpdateCarouselItemData } from '@/lib/api/store/carousel';
import { getUserEntitlements, hasContextualEntitlement } from '@/lib/entitlements/backend/entitlements';

/**
 * API endpoint for managing individual carousel items
 *
 * GET /api/store/[storeId]/carousel/[itemId]
 * - Gets a specific carousel item
 * - Public endpoint for active items, authenticated for all items
 *
 * PUT /api/store/[storeId]/carousel/[itemId]
 * - Updates a carousel item
 * - Requires Store Owner access
 *
 * DELETE /api/store/[storeId]/carousel/[itemId]
 * - Deletes a carousel item
 * - Requires Store Owner access
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { storeId, itemId } = req.query;

  if (!storeId || typeof storeId !== 'string') {
    return res.status(400).json({ error: 'Store ID is required' });
  }

  if (!itemId || typeof itemId !== 'string') {
    return res.status(400).json({ error: 'Item ID is required' });
  }

  try {
    if (req.method === 'GET') {
      // Get the carousel item
      const item = await CarouselAPI.getCarouselItem(itemId);
      
      if (!item) {
        return res.status(404).json({ error: 'Carousel item not found' });
      }

      // Verify item belongs to the specified store
      if (item.store_id !== storeId) {
        return res.status(404).json({ error: 'Carousel item not found' });
      }

      // Check if user can access this item
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user;

      if (currentUser) {
        // Authenticated request - check if user can manage this store
        const entitlements = await getUserEntitlements(currentUser.id);
        const canManageStore = hasContextualEntitlement(entitlements, 'STORE_OWNER', storeId) ||
                              entitlements.includes('CAN_MANAGE_ALL_STORES') ||
                              entitlements.includes('CAN_MANAGE_STORE_SETTINGS');

        if (canManageStore) {
          // Return item for store management
          return res.status(200).json({ item });
        }
      }

      // Public request or non-store-owner - only return if active
      if (item.is_active) {
        return res.status(200).json({ item });
      } else {
        return res.status(404).json({ error: 'Carousel item not found' });
      }

    } else if (req.method === 'PUT') {
      // Authenticate user
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user;

      if (!currentUser) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check Store Owner permissions
      const entitlements = await getUserEntitlements(currentUser.id);
      const canManageStore = hasContextualEntitlement(entitlements, 'STORE_OWNER', storeId) ||
                            entitlements.includes('CAN_MANAGE_ALL_STORES') ||
                            entitlements.includes('CAN_MANAGE_STORE_SETTINGS');

      if (!canManageStore) {
        return res.status(403).json({ error: 'Store Owner access required' });
      }

      // Verify item exists and belongs to store
      const existingItem = await CarouselAPI.getCarouselItem(itemId);
      if (!existingItem || existingItem.store_id !== storeId) {
        return res.status(404).json({ error: 'Carousel item not found' });
      }

      // Validate request body
      const {
        position,
        book_title,
        book_author,
        book_isbn,
        custom_description,
        featured_badge,
        overlay_text,
        book_image_url,
        book_image_alt,
        click_destination_url,
        is_active
      } = req.body;

      if (position && (position < 1 || position > 6)) {
        return res.status(400).json({ error: 'Position must be between 1 and 6' });
      }

      // Check if new position is available (if changing position)
      if (position && position !== existingItem.position) {
        const isAvailable = await CarouselAPI.isPositionAvailable(storeId, position);
        if (!isAvailable) {
          return res.status(400).json({ error: 'Position is already occupied' });
        }
      }

      // Create update data
      const updateData: UpdateCarouselItemData = {};
      if (position !== undefined) updateData.position = position;
      if (book_title !== undefined) updateData.book_title = book_title;
      if (book_author !== undefined) updateData.book_author = book_author;
      if (book_isbn !== undefined) updateData.book_isbn = book_isbn;
      if (custom_description !== undefined) updateData.custom_description = custom_description;
      if (featured_badge !== undefined) updateData.featured_badge = featured_badge;
      if (overlay_text !== undefined) updateData.overlay_text = overlay_text;
      if (book_image_url !== undefined) updateData.book_image_url = book_image_url;
      if (book_image_alt !== undefined) updateData.book_image_alt = book_image_alt;
      if (click_destination_url !== undefined) updateData.click_destination_url = click_destination_url;
      if (is_active !== undefined) updateData.is_active = is_active;

      // Update the item
      const updatedItem = await CarouselAPI.updateCarouselItem(itemId, updateData);
      return res.status(200).json({ item: updatedItem });

    } else if (req.method === 'DELETE') {
      // Authenticate user
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user;

      if (!currentUser) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check Store Owner permissions
      const entitlements = await getUserEntitlements(currentUser.id);
      const canManageStore = hasContextualEntitlement(entitlements, 'STORE_OWNER', storeId) ||
                            entitlements.includes('CAN_MANAGE_ALL_STORES') ||
                            entitlements.includes('CAN_MANAGE_STORE_SETTINGS');

      if (!canManageStore) {
        return res.status(403).json({ error: 'Store Owner access required' });
      }

      // Verify item exists and belongs to store
      const existingItem = await CarouselAPI.getCarouselItem(itemId);
      if (!existingItem || existingItem.store_id !== storeId) {
        return res.status(404).json({ error: 'Carousel item not found' });
      }

      // Delete the item
      await CarouselAPI.deleteCarouselItem(itemId);
      return res.status(204).end();

    } else {
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Carousel item API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
