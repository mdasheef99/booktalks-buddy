/**
 * Club Analytics Service
 *
 * Handles all analytics-related operations for club management.
 * Provides caching, error handling, and data transformation for analytics data.
 */

import {
  getClubAnalyticsSummary,
  createDailyAnalyticsSnapshot,
  getClubAnalyticsSnapshots,
  BasicClubAnalytics,
  ClubAnalyticsSnapshot,
  ClubManagementAPIError
} from '@/lib/api/clubManagement';
import { clubCacheService, CacheKeys, CacheExpiry, withCache } from './clubCacheService';

// =====================================================
// Analytics Service Class
// =====================================================

export class ClubAnalyticsService {
  private static instance: ClubAnalyticsService;

  static getInstance(): ClubAnalyticsService {
    if (!ClubAnalyticsService.instance) {
      ClubAnalyticsService.instance = new ClubAnalyticsService();
    }
    return ClubAnalyticsService.instance;
  }

  // =====================================================
  // Core Analytics Methods
  // =====================================================

  /**
   * Get club analytics with caching
   */
  async getAnalytics(clubId: string, useCache: boolean = true): Promise<BasicClubAnalytics> {
    const cacheKey = CacheKeys.analytics(clubId);

    return withCache(
      cacheKey,
      () => this.fetchAnalytics(clubId),
      CacheExpiry.MEDIUM,
      useCache
    );
  }

  /**
   * Refresh analytics data (bypass cache)
   */
  async refreshAnalytics(clubId: string): Promise<BasicClubAnalytics> {
    // Invalidate cache and fetch fresh data
    clubCacheService.invalidate(CacheKeys.analytics(clubId));
    return this.getAnalytics(clubId, false);
  }

  /**
   * Get analytics snapshots with caching
   */
  async getAnalyticsHistory(
    clubId: string,
    startDate?: string,
    endDate?: string,
    limit: number = 30
  ): Promise<ClubAnalyticsSnapshot[]> {
    const cacheKey = CacheKeys.analyticsHistory(clubId, startDate, endDate, limit);

    return withCache(
      cacheKey,
      () => this.fetchAnalyticsHistory(clubId, startDate, endDate, limit),
      CacheExpiry.HOUR, // Snapshots don't change frequently
      true
    );
  }

  /**
   * Create daily snapshot and invalidate cache
   */
  async createSnapshot(clubId: string): Promise<void> {
    try {
      await createDailyAnalyticsSnapshot(clubId);

      // Invalidate related caches
      clubCacheService.invalidateClub(clubId);
    } catch (error) {
      throw new ClubManagementAPIError(
        'Failed to create analytics snapshot',
        'SNAPSHOT_CREATE_ERROR',
        error
      );
    }
  }

  /**
   * Get analytics summary with error handling (safe mode)
   */
  async getAnalyticsSafe(clubId: string): Promise<BasicClubAnalytics | null> {
    try {
      return await this.getAnalytics(clubId);
    } catch (error) {
      console.error('Error fetching analytics (safe mode):', error);
      return null;
    }
  }

  /**
   * Batch create snapshots for multiple clubs
   */
  async batchCreateSnapshots(clubIds: string[]): Promise<{ success: string[]; failed: string[] }> {
    const results = { success: [], failed: [] };

    for (const clubId of clubIds) {
      try {
        await this.createSnapshot(clubId);
        results.success.push(clubId);
      } catch (error) {
        console.error(`Failed to create snapshot for club ${clubId}:`, error);
        results.failed.push(clubId);
      }
    }

    return results;
  }

  // =====================================================
  // Permission Checking Methods
  // =====================================================

  /**
   * Check if user has analytics access for a club
   * Note: This method depends on moderators service, so it's kept minimal
   */
  async hasAnalyticsAccess(clubId: string, userId: string): Promise<boolean> {
    try {
      // Import here to avoid circular dependency
      const { clubModeratorsService } = await import('./clubModeratorsService');
      const moderators = await clubModeratorsService.getModerators(clubId);
      const userModerator = moderators.find(mod => mod.user_id === userId);

      return userModerator?.analytics_access || false;
    } catch (error) {
      console.error('Error checking analytics access:', error);
      return false;
    }
  }

  // =====================================================
  // Private Helper Methods
  // =====================================================

  /**
   * Fetch analytics data from API
   */
  private async fetchAnalytics(clubId: string): Promise<BasicClubAnalytics> {
    try {
      return await getClubAnalyticsSummary(clubId);
    } catch (error) {
      throw new ClubManagementAPIError(
        'Failed to fetch club analytics',
        'ANALYTICS_FETCH_ERROR',
        error
      );
    }
  }

  /**
   * Fetch analytics history from API
   */
  private async fetchAnalyticsHistory(
    clubId: string,
    startDate?: string,
    endDate?: string,
    limit: number = 30
  ): Promise<ClubAnalyticsSnapshot[]> {
    try {
      return await getClubAnalyticsSnapshots(clubId, startDate, endDate, limit);
    } catch (error) {
      throw new ClubManagementAPIError(
        'Failed to fetch analytics history',
        'ANALYTICS_HISTORY_ERROR',
        error
      );
    }
  }

  // =====================================================
  // Cache Management
  // =====================================================

  /**
   * Clear analytics cache for a specific club
   */
  clearAnalyticsCache(clubId: string): void {
    clubCacheService.invalidate(CacheKeys.analytics(clubId));
    clubCacheService.invalidate(`snapshots:${clubId}`);
  }

  /**
   * Clear all analytics cache
   */
  clearAllAnalyticsCache(): void {
    clubCacheService.invalidate('analytics:');
    clubCacheService.invalidate('snapshots:');
  }
}

// =====================================================
// Export singleton instance
// =====================================================

export const clubAnalyticsService = ClubAnalyticsService.getInstance();

// =====================================================
// Export types for external use
// =====================================================

export type { BasicClubAnalytics, ClubAnalyticsSnapshot };
