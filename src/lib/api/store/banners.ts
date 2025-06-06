import {
  PromotionalBanner,
  CreateBannerData,
  UpdateBannerData,
  BannerPosition
} from './banners/types/bannerTypes';
import { BANNER_ERRORS, DB_ERROR_CODES } from './banners/constants/bannerConstants';
import {
  normalizeCreateBannerData,
  cleanUpdateData,
  validateBannerData,
  getCurrentTimestamp,
  calculateNextPriorityOrder,
  buildGetBannersQuery,
  buildGetActiveBannersQuery,
  buildGetBannerQuery,
  buildCreateBannerQuery,
  buildUpdateBannerQuery,
  buildDeleteBannerQuery,
  buildUpdatePriorityQuery,
  buildGetNextPriorityQuery,
  buildCheckPriorityQuery,
  buildGetBannersInDateRangeQuery,
  buildDeactivateExpiredQuery,
  buildActivateScheduledQuery
} from './banners/utils';

/**
 * Promotional Banners API service for managing store marketing banners
 */
export class BannersAPI {
  /**
   * Get all promotional banners for a store
   */
  static async getBanners(storeId: string): Promise<PromotionalBanner[]> {
    const { data, error } = await buildGetBannersQuery({
      storeId,
      includeInactive: true
    });

    if (error) {
      console.error('Error fetching promotional banners:', error);
      throw new Error(BANNER_ERRORS.FETCH_FAILED);
    }

    return data || [];
  }

  /**
   * Get active promotional banners for a store (for public display)
   */
  static async getActiveBanners(storeId: string): Promise<PromotionalBanner[]> {
    const { data, error } = await buildGetActiveBannersQuery({ storeId });

    if (error) {
      console.error('Error fetching active promotional banners:', error);
      throw new Error(BANNER_ERRORS.FETCH_FAILED);
    }

    return data || [];
  }

  /**
   * Get a single promotional banner by ID
   */
  static async getBanner(bannerId: string): Promise<PromotionalBanner | null> {
    const { data, error } = await buildGetBannerQuery(bannerId);

    if (error) {
      if (error.code === DB_ERROR_CODES.NOT_FOUND) {
        return null; // Banner not found
      }
      console.error('Error fetching promotional banner:', error);
      throw new Error(BANNER_ERRORS.FETCH_SINGLE_FAILED);
    }

    return data;
  }

  /**
   * Create a new promotional banner
   */
  static async createBanner(bannerData: CreateBannerData): Promise<PromotionalBanner> {
    // Validate input data
    const validation = validateBannerData(bannerData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Normalize data with defaults
    const normalizedData = normalizeCreateBannerData(bannerData);

    // Get next priority order if not specified
    let priorityOrder = normalizedData.priority_order;
    if (priorityOrder === undefined) {
      priorityOrder = await this.getNextPriorityOrder(normalizedData.store_id);
    }

    const { data, error } = await buildCreateBannerQuery({
      ...normalizedData,
      priority_order: priorityOrder
    });

    if (error) {
      console.error('Error creating promotional banner:', error);
      throw new Error(BANNER_ERRORS.CREATE_FAILED);
    }

    return data;
  }

  /**
   * Update a promotional banner
   */
  static async updateBanner(
    bannerId: string,
    updates: UpdateBannerData
  ): Promise<PromotionalBanner> {
    // Validate update data
    const validation = validateBannerData(updates);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Clean update data
    const cleanedUpdates = cleanUpdateData(updates);

    const { data, error } = await buildUpdateBannerQuery(bannerId, cleanedUpdates);

    if (error) {
      console.error('Error updating promotional banner:', error);
      throw new Error(BANNER_ERRORS.UPDATE_FAILED);
    }

    return data;
  }

  /**
   * Delete a promotional banner
   */
  static async deleteBanner(bannerId: string): Promise<void> {
    const { error } = await buildDeleteBannerQuery(bannerId);

    if (error) {
      console.error('Error deleting promotional banner:', error);
      throw new Error(BANNER_ERRORS.DELETE_FAILED);
    }
  }

  /**
   * Reorder promotional banners
   */
  static async reorderBanners(
    storeId: string,
    bannerPositions: BannerPosition[]
  ): Promise<void> {
    // Use a transaction to update all positions atomically
    for (const update of bannerPositions) {
      const { error } = await buildUpdatePriorityQuery(
        update.id,
        storeId,
        update.priority_order
      );

      if (error) {
        console.error('Error updating banner priority order:', error);
        throw new Error(BANNER_ERRORS.REORDER_FAILED);
      }
    }
  }

  /**
   * Get next available priority order for a store
   */
  static async getNextPriorityOrder(storeId: string): Promise<number> {
    const { data, error } = await buildGetNextPriorityQuery(storeId);

    if (error) {
      console.error('Error getting next priority order:', error);
      return 1;
    }

    if (!data || data.length === 0) {
      return 1;
    }

    return calculateNextPriorityOrder([data[0].priority_order]);
  }

  /**
   * Check if priority order is available
   */
  static async isPriorityOrderAvailable(storeId: string, priorityOrder: number): Promise<boolean> {
    const { data, error } = await buildCheckPriorityQuery(storeId, priorityOrder);

    if (error) {
      console.error('Error checking priority order availability:', error);
      return false;
    }

    return !data || data.length === 0;
  }

  /**
   * Get banners scheduled for a specific date range
   */
  static async getBannersInDateRange(
    storeId: string,
    startDate: string,
    endDate: string
  ): Promise<PromotionalBanner[]> {
    const { data, error } = await buildGetBannersInDateRangeQuery({
      storeId,
      dateRange: { startDate, endDate },
      includeInactive: true
    });

    if (error) {
      console.error('Error fetching banners in date range:', error);
      throw new Error(BANNER_ERRORS.DATE_RANGE_FAILED);
    }

    return data || [];
  }

  /**
   * Activate/deactivate banner based on schedule
   */
  static async updateBannerScheduleStatus(storeId: string): Promise<void> {
    const now = getCurrentTimestamp();

    // Deactivate expired banners
    const { error: deactivateError } = await buildDeactivateExpiredQuery(storeId, now);

    if (deactivateError) {
      console.error('Error deactivating expired banners:', deactivateError);
    }

    // Activate scheduled banners
    const { error: activateError } = await buildActivateScheduledQuery(storeId, now);

    if (activateError) {
      console.error('Error activating scheduled banners:', activateError);
    }
  }
}
