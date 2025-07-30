/**
 * Banner Analytics Tracking Module
 * Handles banner-specific event tracking and data collection for multiple banners
 * 
 * This module provides the core infrastructure for tracking banner interactions
 * including views, clicks, and detail page visits across multiple banners simultaneously.
 */

import { supabase } from '@/lib/supabase';

// Banner tracking event interface with multi-banner support
export interface BannerTrackingEvent {
  bannerId: string;
  bannerTitle?: string;
  bannerType?: 'text' | 'image' | 'mixed';
  eventType: 'impression' | 'click' | 'detail_view';
  sessionId: string;
  userId?: string;
  metadata?: {
    bannerPosition?: number;
    totalBannersVisible?: number;
    viewDuration?: number;
    clickPosition?: { x: number; y: number };
    deviceType?: 'mobile' | 'desktop' | 'tablet';
    referrer?: string;
    userAgent?: string;
  };
}

// Session management for consistent tracking
export class SessionManager {
  private static sessionId: string | null = null;

  /**
   * Get or create a session ID for tracking
   */
  static getSessionId(): string {
    if (!this.sessionId) {
      this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    return this.sessionId;
  }

  /**
   * Reset session (useful for testing)
   */
  static resetSession(): void {
    this.sessionId = null;
  }
}

// Device detection utility
export class DeviceDetector {
  /**
   * Detect device type based on user agent and screen size
   */
  static getDeviceType(): 'mobile' | 'desktop' | 'tablet' {
    if (typeof window === 'undefined') return 'desktop';
    
    const userAgent = navigator.userAgent.toLowerCase();
    const screenWidth = window.innerWidth;
    
    if (userAgent.includes('mobile') || screenWidth < 768) {
      return 'mobile';
    } else if (userAgent.includes('tablet') || (screenWidth >= 768 && screenWidth < 1024)) {
      return 'tablet';
    }
    return 'desktop';
  }
}

/**
 * Banner Tracking API - Core tracking functionality
 */
export class BannerTrackingAPI {
  /**
   * Track banner impression (view)
   * Called when a banner becomes visible to the user
   */
  static async trackBannerView(
    storeId: string,
    bannerId: string,
    sessionId: string,
    metadata?: Partial<BannerTrackingEvent['metadata']>
  ): Promise<void> {
    try {
      const trackingData = {
        store_id: storeId,
        event_type: 'banner_view',
        section_name: 'banners',
        element_id: bannerId,
        element_type: 'promotional_banner',
        session_id: sessionId,
        user_agent: navigator.userAgent,
        interaction_data: {
          deviceType: DeviceDetector.getDeviceType(),
          timestamp: new Date().toISOString(),
          ...metadata
        },
        timestamp: new Date().toISOString()
      };

      const { error } = await supabase
        .from('store_landing_analytics')
        .insert(trackingData);

      if (error) {
        console.error('Banner view tracking error:', error);
      } else {
        console.log('Banner view tracked:', bannerId);
      }
    } catch (error) {
      console.error('Banner view tracking failed:', error);
    }
  }

  /**
   * Track banner click
   * Called when a user clicks on a banner
   */
  static async trackBannerClick(
    storeId: string,
    bannerId: string,
    sessionId: string,
    metadata?: Partial<BannerTrackingEvent['metadata']>
  ): Promise<void> {
    try {
      const trackingData = {
        store_id: storeId,
        event_type: 'banner_click',
        section_name: 'banners',
        element_id: bannerId,
        element_type: 'promotional_banner',
        session_id: sessionId,
        user_agent: navigator.userAgent,
        interaction_data: {
          deviceType: DeviceDetector.getDeviceType(),
          timestamp: new Date().toISOString(),
          ...metadata
        },
        timestamp: new Date().toISOString()
      };

      const { error } = await supabase
        .from('store_landing_analytics')
        .insert(trackingData);

      if (error) {
        console.error('Banner click tracking error:', error);
      } else {
        console.log('Banner click tracked:', bannerId);
      }
    } catch (error) {
      console.error('Banner click tracking failed:', error);
    }
  }

  /**
   * Track banner detail page view
   * Called when a user visits a banner detail page
   */
  static async trackBannerDetailView(
    storeId: string,
    bannerId: string,
    sessionId: string,
    metadata?: Partial<BannerTrackingEvent['metadata']>
  ): Promise<void> {
    try {
      const trackingData = {
        store_id: storeId,
        event_type: 'banner_detail_view',
        section_name: 'banners',
        element_id: bannerId,
        element_type: 'promotional_banner',
        session_id: sessionId,
        user_agent: navigator.userAgent,
        interaction_data: {
          deviceType: DeviceDetector.getDeviceType(),
          timestamp: new Date().toISOString(),
          ...metadata
        },
        timestamp: new Date().toISOString()
      };

      const { error } = await supabase
        .from('store_landing_analytics')
        .insert(trackingData);

      if (error) {
        console.error('Banner detail view tracking error:', error);
      } else {
        console.log('Banner detail view tracked:', bannerId);
      }
    } catch (error) {
      console.error('Banner detail view tracking failed:', error);
    }
  }

  /**
   * Batch track multiple banner events
   * Useful for tracking multiple banner impressions simultaneously
   */
  static async trackMultipleBannerEvents(
    storeId: string,
    events: Array<{
      bannerId: string;
      eventType: 'impression' | 'click' | 'detail_view';
      metadata?: Partial<BannerTrackingEvent['metadata']>;
    }>,
    sessionId: string
  ): Promise<void> {
    try {
      const trackingData = events.map(event => ({
        store_id: storeId,
        event_type: `banner_${event.eventType}`,
        section_name: 'banners',
        element_id: event.bannerId,
        element_type: 'promotional_banner',
        session_id: sessionId,
        user_agent: navigator.userAgent,
        interaction_data: {
          deviceType: DeviceDetector.getDeviceType(),
          timestamp: new Date().toISOString(),
          ...event.metadata
        },
        timestamp: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('store_landing_analytics')
        .insert(trackingData);

      if (error) {
        console.error('Batch banner tracking error:', error);
      } else {
        console.log('Batch banner events tracked:', events.length);
      }
    } catch (error) {
      console.error('Batch banner tracking failed:', error);
    }
  }

  /**
   * Get current session analytics summary (for debugging)
   */
  static async getSessionAnalytics(
    storeId: string,
    sessionId: string
  ): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('store_landing_analytics')
        .select('*')
        .eq('store_id', storeId)
        .eq('session_id', sessionId)
        .eq('section_name', 'banners')
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Session analytics error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Session analytics failed:', error);
      return null;
    }
  }
}

// Export utilities for easy access
export { SessionManager, DeviceDetector };
export default BannerTrackingAPI;
