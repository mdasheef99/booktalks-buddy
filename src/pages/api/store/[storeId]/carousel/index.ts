import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { CarouselAPI, CreateCarouselItemData } from '@/lib/api/store/carousel';
import { getUserEntitlements, hasContextualEntitlement } from '@/lib/entitlements/backend/entitlements';

/**
 * API endpoint for managing store carousel items
 *
 * GET /api/store/[storeId]/carousel
 * - Gets all carousel items for a store
 * - Public endpoint for active items, authenticated for all items
 *
 * POST /api/store/[storeId]/carousel
 * - Creates a new carousel item
 * - Requires Store Owner access
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { storeId } = req.query;

  if (!storeId || typeof storeId !== 'string') {
    return res.status(400).json({ error: 'Store ID is required' });
  }

  try {
    if (req.method === 'GET') {
      // Get authenticated user for access control
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user;

      if (currentUser) {
        // Authenticated request - check if user can manage this store
        const entitlements = await getUserEntitlements(currentUser.id);
        const canManageStore = hasContextualEntitlement(entitlements, 'STORE_OWNER', storeId) ||
                              entitlements.includes('CAN_MANAGE_ALL_STORES') ||
                              entitlements.includes('CAN_MANAGE_STORE_SETTINGS');

        if (canManageStore) {
          // Return all items for store management
          const items = await CarouselAPI.getCarouselItems(storeId);
          return res.status(200).json({ items });
        }
      }

      // Public request or non-store-owner - return only active items
      const activeItems = await CarouselAPI.getActiveCarouselItems(storeId);
      return res.status(200).json({ items: activeItems });

    } else if (req.method === 'POST') {
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

      if (!book_title || !book_author) {
        return res.status(400).json({ error: 'Book title and author are required' });
      }

      if (position && (position < 1 || position > 6)) {
        return res.status(400).json({ error: 'Position must be between 1 and 6' });
      }

      // Check if position is available (if specified)
      let finalPosition = position;
      if (finalPosition) {
        const isAvailable = await CarouselAPI.isPositionAvailable(storeId, finalPosition);
        if (!isAvailable) {
          return res.status(400).json({ error: 'Position is already occupied' });
        }
      } else {
        // Get next available position
        finalPosition = await CarouselAPI.getNextPosition(storeId);
        if (finalPosition > 6) {
          return res.status(400).json({ error: 'Maximum 6 carousel items allowed' });
        }
      }

      // Create carousel item data
      const itemData: CreateCarouselItemData = {
        store_id: storeId,
        position: finalPosition,
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
      };

      // Create the item
      const newItem = await CarouselAPI.createCarouselItem(itemData);
      return res.status(201).json({ item: newItem });

    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Carousel API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
