import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { BannersAPI, UpdateBannerData } from '@/lib/api/store/banners';
import { getUserEntitlements, hasContextualEntitlement } from '@/lib/entitlements/backend/entitlements';

/**
 * API endpoint for managing individual promotional banners
 *
 * GET /api/store/[storeId]/banners/[bannerId]
 * - Gets a specific promotional banner
 * - Public endpoint for active banners, authenticated for all banners
 *
 * PUT /api/store/[storeId]/banners/[bannerId]
 * - Updates a promotional banner
 * - Requires Store Owner access
 *
 * DELETE /api/store/[storeId]/banners/[bannerId]
 * - Deletes a promotional banner
 * - Requires Store Owner access
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { storeId, bannerId } = req.query;

  if (!storeId || typeof storeId !== 'string') {
    return res.status(400).json({ error: 'Store ID is required' });
  }

  if (!bannerId || typeof bannerId !== 'string') {
    return res.status(400).json({ error: 'Banner ID is required' });
  }

  try {
    if (req.method === 'GET') {
      // Get the promotional banner
      const banner = await BannersAPI.getBanner(bannerId);
      
      if (!banner) {
        return res.status(404).json({ error: 'Promotional banner not found' });
      }

      // Verify banner belongs to the specified store
      if (banner.store_id !== storeId) {
        return res.status(404).json({ error: 'Promotional banner not found' });
      }

      // Check if user can access this banner
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user;

      if (currentUser) {
        // Authenticated request - check if user can manage this store
        const entitlements = await getUserEntitlements(currentUser.id);
        const canManageStore = hasContextualEntitlement(entitlements, 'STORE_OWNER', storeId) ||
                              entitlements.includes('CAN_MANAGE_ALL_STORES') ||
                              entitlements.includes('CAN_MANAGE_STORE_SETTINGS');

        if (canManageStore) {
          // Return banner for store management
          return res.status(200).json({ banner });
        }
      }

      // Public request or non-store-owner - only return if active and within schedule
      const now = new Date();
      const startDate = banner.start_date ? new Date(banner.start_date) : null;
      const endDate = banner.end_date ? new Date(banner.end_date) : null;
      
      const isScheduleActive = (!startDate || startDate <= now) && (!endDate || endDate > now);
      
      if (banner.is_active && isScheduleActive) {
        return res.status(200).json({ banner });
      } else {
        return res.status(404).json({ error: 'Promotional banner not found' });
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

      // Verify banner exists and belongs to store
      const existingBanner = await BannersAPI.getBanner(bannerId);
      if (!existingBanner || existingBanner.store_id !== storeId) {
        return res.status(404).json({ error: 'Promotional banner not found' });
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

      // Validate content type if provided
      if (content_type && !['text', 'image', 'mixed'].includes(content_type)) {
        return res.status(400).json({ error: 'Valid content type is required (text, image, or mixed)' });
      }

      // Validate dates if provided
      if (start_date && end_date && new Date(start_date) >= new Date(end_date)) {
        return res.status(400).json({ error: 'End date must be after start date' });
      }

      // Check if new priority order is available (if changing priority)
      if (priority_order && priority_order !== existingBanner.priority_order) {
        const isAvailable = await BannersAPI.isPriorityOrderAvailable(storeId, priority_order);
        if (!isAvailable) {
          return res.status(400).json({ error: 'Priority order is already in use' });
        }
      }

      // Create update data
      const updateData: UpdateBannerData = {};
      if (title !== undefined) updateData.title = title;
      if (subtitle !== undefined) updateData.subtitle = subtitle;
      if (content_type !== undefined) updateData.content_type = content_type;
      if (text_content !== undefined) updateData.text_content = text_content;
      if (cta_text !== undefined) updateData.cta_text = cta_text;
      if (cta_url !== undefined) updateData.cta_url = cta_url;
      if (banner_image_url !== undefined) updateData.banner_image_url = banner_image_url;
      if (banner_image_alt !== undefined) updateData.banner_image_alt = banner_image_alt;
      if (background_color !== undefined) updateData.background_color = background_color;
      if (text_color !== undefined) updateData.text_color = text_color;
      if (animation_type !== undefined) updateData.animation_type = animation_type;
      if (priority_order !== undefined) updateData.priority_order = priority_order;
      if (start_date !== undefined) updateData.start_date = start_date;
      if (end_date !== undefined) updateData.end_date = end_date;
      if (is_active !== undefined) updateData.is_active = is_active;

      // Update the banner
      const updatedBanner = await BannersAPI.updateBanner(bannerId, updateData);
      return res.status(200).json({ banner: updatedBanner });

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

      // Verify banner exists and belongs to store
      const existingBanner = await BannersAPI.getBanner(bannerId);
      if (!existingBanner || existingBanner.store_id !== storeId) {
        return res.status(404).json({ error: 'Promotional banner not found' });
      }

      // Delete the banner
      await BannersAPI.deleteBanner(bannerId);
      return res.status(204).end();

    } else {
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Banner API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
