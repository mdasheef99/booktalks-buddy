// Import types and interfaces from dedicated files
export type {
  MemberSpotlight,
  Testimonial,
  CommunityMetrics,
  ActivityFeedItem,
  CommunityShowcaseData,
  TestimonialFormData,
  MemberSpotlightFormData,
  ShowcaseSettings,
  SpotlightType,
  TestimonialSourceType,
  TestimonialApprovalStatus,
  ActivityFeedType,
  UserData,
  StoreUser,
  ShowcaseSettingsUpdate
} from './types/communityShowcaseTypes';

// Import constants
export {
  DEFAULT_SHOWCASE_SETTINGS,
  SPOTLIGHT_TYPES,
  TESTIMONIAL_SOURCE_TYPES,
  APPROVAL_STATUSES,
  ACTIVITY_FEED_TYPES,
  QUERY_LIMITS
} from './constants/communityShowcaseConstants';

// Import API modules
import { MemberSpotlightAPI } from './modules/memberSpotlightAPI';
import { TestimonialAPI } from './modules/testimonialAPI';
import { MetricsActivityAPI } from './modules/metricsActivityAPI';
import { SettingsAPI } from './modules/settingsAPI';

// Import types for the main interface
import type { CommunityShowcaseData } from './types/communityShowcaseTypes';

/**
 * Community Showcase API for Store Owners
 * Provides read-only integration with existing systems and CRUD for showcase data
 */
export class CommunityShowcaseAPI {
  /**
   * Get complete community showcase data for landing page (OPTIMIZED with error isolation)
   */
  static async getCommunityShowcaseData(storeId: string): Promise<CommunityShowcaseData> {
    // Use Promise.allSettled for error isolation - partial data is better than no data
    const results = await Promise.allSettled([
      MemberSpotlightAPI.getActiveSpotlights(storeId),
      TestimonialAPI.getApprovedTestimonials(storeId),
      MetricsActivityAPI.getCommunityMetrics(storeId),
      MetricsActivityAPI.getRecentActivity(storeId),
      SettingsAPI.getShowcaseSettings(storeId)
    ]);

    // Extract data with fallbacks for failed promises
    const memberSpotlights = results[0].status === 'fulfilled' ? results[0].value : [];
    const testimonials = results[1].status === 'fulfilled' ? results[1].value : [];
    const communityMetrics = results[2].status === 'fulfilled' ? results[2].value : {
      active_members: 0,
      total_clubs: 0,
      recent_discussions: 0,
      books_discussed_this_month: 0,
      new_members_this_month: 0,
    };
    const activityFeed = results[3].status === 'fulfilled' ? results[3].value : [];
    const showcaseSettings = results[4].status === 'fulfilled' ? results[4].value : {
      show_member_spotlights: false,
      show_testimonials: false,
      show_activity_feed: false,
      show_community_metrics: false,
      max_spotlights_display: 3,
      activity_feed_limit: 5,
    };

    // Log any failures for monitoring
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const componentNames = ['memberSpotlights', 'testimonials', 'communityMetrics', 'activityFeed', 'showcaseSettings'];
        console.warn(`Community showcase component ${componentNames[index]} failed:`, result.reason);
      }
    });

    return {
      memberSpotlights,
      testimonials,
      communityMetrics,
      activityFeed,
      showcaseSettings
    };
  }

  // ===== MEMBER SPOTLIGHT METHODS =====

  /**
   * Get active member spotlights with user data
   */
  static async getActiveSpotlights(storeId: string) {
    return MemberSpotlightAPI.getActiveSpotlights(storeId);
  }

  /**
   * Create a new member spotlight
   */
  static async createMemberSpotlight(storeId: string, spotlightData: MemberSpotlightFormData) {
    return MemberSpotlightAPI.createMemberSpotlight(storeId, spotlightData);
  }

  /**
   * Update member spotlight
   */
  static async updateMemberSpotlight(storeId: string, spotlightId: string, updates: Partial<MemberSpotlightFormData>) {
    return MemberSpotlightAPI.updateMemberSpotlight(storeId, spotlightId, updates);
  }

  /**
   * Delete member spotlight
   */
  static async deleteMemberSpotlight(storeId: string, spotlightId: string) {
    return MemberSpotlightAPI.deleteMemberSpotlight(storeId, spotlightId);
  }

  /**
   * Search store members for spotlight selection
   */
  static async searchStoreMembers(storeId: string, searchTerm?: string) {
    return MemberSpotlightAPI.searchStoreMembers(storeId, searchTerm);
  }

  // ===== TESTIMONIAL METHODS =====

  /**
   * Get approved testimonials for display
   */
  static async getApprovedTestimonials(storeId: string, limit?: number) {
    return TestimonialAPI.getApprovedTestimonials(storeId, limit);
  }

  /**
   * Get all testimonials for admin management
   */
  static async getAllTestimonials(storeId: string) {
    return TestimonialAPI.getAllTestimonials(storeId);
  }

  /**
   * Create a new testimonial
   */
  static async createTestimonial(storeId: string, testimonialData: TestimonialFormData) {
    return TestimonialAPI.createTestimonial(storeId, testimonialData);
  }

  /**
   * Update testimonial
   */
  static async updateTestimonial(storeId: string, testimonialId: string, updates: Partial<TestimonialFormData>) {
    return TestimonialAPI.updateTestimonial(storeId, testimonialId, updates);
  }

  /**
   * Delete testimonial
   */
  static async deleteTestimonial(storeId: string, testimonialId: string) {
    return TestimonialAPI.deleteTestimonial(storeId, testimonialId);
  }

  /**
   * Update testimonial approval status
   */
  static async updateTestimonialApproval(storeId: string, testimonialId: string, status: TestimonialApprovalStatus) {
    return TestimonialAPI.updateTestimonialApproval(storeId, testimonialId, status);
  }

  /**
   * Reorder testimonials
   */
  static async reorderTestimonials(storeId: string, testimonialIds: string[]) {
    return TestimonialAPI.reorderTestimonials(storeId, testimonialIds);
  }

  // ===== METRICS AND ACTIVITY METHODS =====

  /**
   * Calculate community metrics from existing data
   */
  static async getCommunityMetrics(storeId: string) {
    return MetricsActivityAPI.getCommunityMetrics(storeId);
  }

  /**
   * Get recent community activity feed
   */
  static async getRecentActivity(storeId: string, limit?: number) {
    return MetricsActivityAPI.getRecentActivity(storeId, limit);
  }

  // ===== SETTINGS METHODS =====

  /**
   * Get showcase settings
   */
  static async getShowcaseSettings(storeId: string) {
    return SettingsAPI.getShowcaseSettings(storeId);
  }

  /**
   * Update showcase settings
   */
  static async updateShowcaseSettings(storeId: string, settings: Partial<ShowcaseSettingsUpdate>) {
    return SettingsAPI.updateShowcaseSettings(storeId, settings);
  }

}
