import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { BannersAPI, CreateBannerData } from '@/lib/api/store/banners';
import { getUserEntitlements, hasContextualEntitlement } from '@/lib/entitlements/backend/entitlements';

/**
 * API endpoint for managing store promotional banners
 *
 * GET /api/store/[storeId]/banners
 * - Gets all promotional banners for a store
 * - Public endpoint for active banners, authenticated for all banners
 *
 * POST /api/store/[storeId]/banners
 * - Creates a new promotional banner
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
          // Return all banners for store management
          const banners = await BannersAPI.getBanners(storeId);
          return res.status(200).json({ banners });
        }
      }

      // Public request or non-store-owner - return only active banners
      const activeBanners = await BannersAPI.getActiveBanners(storeId);
      return res.status(200).json({ banners: activeBanners });

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
        title,
        subtitle,
        content_type,
        text_content,
        cta_text,
        cta_url,
        banner_image_url,
        banner_image_alt,
        background_color,
        text_color,
        animation_type,
        priority_order,
        start_date,
        end_date,
        is_active
      } = req.body;

      if (!title) {
        return res.status(400).json({ error: 'Banner title is required' });
      }

      if (!content_type || !['text', 'image', 'mixed'].includes(content_type)) {
        return res.status(400).json({ error: 'Valid content type is required (text, image, or mixed)' });
      }

      // Validate content based on type
      if (content_type === 'image' && !banner_image_url) {
        return res.status(400).json({ error: 'Image URL is required for image banners' });
      }

      if (content_type === 'text' && !text_content && !subtitle) {
        return res.status(400).json({ error: 'Text content or subtitle is required for text banners' });
      }

      // Validate dates
      if (start_date && end_date && new Date(start_date) >= new Date(end_date)) {
        return res.status(400).json({ error: 'End date must be after start date' });
      }

      // Check if priority order is available (if specified)
      if (priority_order) {
        const isAvailable = await BannersAPI.isPriorityOrderAvailable(storeId, priority_order);
        if (!isAvailable) {
          return res.status(400).json({ error: 'Priority order is already in use' });
        }
      }

      // Create banner data
      const bannerData: CreateBannerData = {
        store_id: storeId,
        title,
        subtitle,
        content_type,
        text_content,
        cta_text,
        cta_url,
        banner_image_url,
        banner_image_alt,
        background_color,
        text_color,
        animation_type,
        priority_order,
        start_date,
        end_date,
        is_active
      };

      // Create the banner
      const newBanner = await BannersAPI.createBanner(bannerData);
      return res.status(201).json({ banner: newBanner });

    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Banners API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
