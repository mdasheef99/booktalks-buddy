import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { CarouselAPI } from '@/lib/api/store/carousel';
import { getUserEntitlements, hasContextualEntitlement } from '@/lib/entitlements/backend/entitlements';

/**
 * API endpoint for reordering carousel items
 *
 * POST /api/store/[storeId]/carousel/reorder
 * - Reorders carousel items based on drag-and-drop
 * - Requires Store Owner access
 * - Expects array of { id, position } objects
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { storeId } = req.query;

  if (!storeId || typeof storeId !== 'string') {
    return res.status(400).json({ error: 'Store ID is required' });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Items array is required' });
    }

    // Validate each item in the array
    for (const item of items) {
      if (!item.id || typeof item.id !== 'string') {
        return res.status(400).json({ error: 'Each item must have a valid ID' });
      }
      if (!item.position || typeof item.position !== 'number') {
        return res.status(400).json({ error: 'Each item must have a valid position' });
      }
      if (item.position < 1 || item.position > 6) {
        return res.status(400).json({ error: 'Position must be between 1 and 6' });
      }
    }

    // Check for duplicate positions
    const positions = items.map(item => item.position);
    const uniquePositions = new Set(positions);
    if (positions.length !== uniquePositions.size) {
      return res.status(400).json({ error: 'Duplicate positions are not allowed' });
    }

    // Verify all items belong to the store
    const itemIds = items.map(item => item.id);
    const { data: existingItems, error: fetchError } = await supabase
      .from('store_carousel_items')
      .select('id, store_id')
      .in('id', itemIds);

    if (fetchError) {
      console.error('Error fetching carousel items for validation:', fetchError);
      return res.status(500).json({ error: 'Failed to validate carousel items' });
    }

    // Check that all items exist and belong to the store
    if (!existingItems || existingItems.length !== itemIds.length) {
      return res.status(400).json({ error: 'Some carousel items were not found' });
    }

    for (const existingItem of existingItems) {
      if (existingItem.store_id !== storeId) {
        return res.status(400).json({ error: 'Some carousel items do not belong to this store' });
      }
    }

    // Perform the reordering
    await CarouselAPI.reorderCarouselItems(storeId, items);

    // Fetch and return the updated items
    const updatedItems = await CarouselAPI.getCarouselItems(storeId);
    
    return res.status(200).json({ 
      message: 'Carousel items reordered successfully',
      items: updatedItems
    });

  } catch (error) {
    console.error('Carousel reorder API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
