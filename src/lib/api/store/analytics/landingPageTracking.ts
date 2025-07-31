/**
 * Landing Page Analytics Tracking API
 * 
 * Handles tracking of all landing page interactions and events
 * Follows the same pattern as BannerTrackingAPI for consistency
 */

import { supabase } from '@/lib/supabase';
import { SessionManager, DeviceDetector } from './bannerTracking';

// Landing page tracking event interface
interface LandingPageTrackingEvent {
  metadata?: {
    deviceType?: 'mobile' | 'desktop' | 'tablet';
    timestamp?: string;
    viewportHeight?: number;
    viewportWidth?: number;
    scrollPosition?: number;
    elementPosition?: number;
    sectionName?: string;
    elementTitle?: string;
    clickPosition?: { x: number; y: number };
    duration?: number;
    referrer?: string;
    userAgent?: string;
    buttonText?: string;
    buttonPosition?: string;
    buttonSize?: string;
    bookTitle?: string;
    bookAuthor?: string;
    position?: number;
    hasDestinationUrl?: boolean;
    isDemo?: boolean;
    totalBooks?: number;
    hasCustomBooks?: boolean;
    hasSpotlights?: boolean;
    hasTestimonials?: boolean;
    hasActivityFeed?: boolean;
    hasMetrics?: boolean;
    showingDemo?: boolean;
    interactionType?: string;
    [key: string]: any;
  };
}

/**
 * Landing Page Tracking API - Core tracking functionality
 */
export class LandingPageTrackingAPI {
  /**
   * Track page load event
   * Called when the landing page is loaded
   */
  static async trackPageLoad(
    storeId: string,
    sessionId: string,
    metadata?: Partial<LandingPageTrackingEvent['metadata']>
  ): Promise<void> {
    return this.trackEvent(storeId, 'page_load', 'hero', sessionId, undefined, 'page', metadata);
  }

  /**
   * Track chat button click
   * Called when user clicks the hero section chat button
   */
  static async trackChatButtonClick(
    storeId: string,
    sessionId: string,
    metadata?: Partial<LandingPageTrackingEvent['metadata']>
  ): Promise<void> {
    return this.trackEvent(storeId, 'chat_button_click', 'hero', sessionId, undefined, 'button', metadata);
  }

  /**
   * Track carousel book click
   * Called when user clicks on a book in the carousel
   */
  static async trackCarouselClick(
    storeId: string,
    bookId: string,
    sessionId: string,
    metadata?: Partial<LandingPageTrackingEvent['metadata']>
  ): Promise<void> {
    return this.trackEvent(storeId, 'carousel_click', 'carousel', sessionId, bookId, 'book', metadata);
  }

  /**
   * Track section view (hero, carousel, community, quote)
   * Called when a section becomes visible to the user
   */
  static async trackSectionView(
    storeId: string,
    sectionName: 'hero' | 'carousel' | 'community' | 'quote',
    sessionId: string,
    metadata?: Partial<LandingPageTrackingEvent['metadata']>
  ): Promise<void> {
    const eventType = `${sectionName}_view`;
    return this.trackEvent(storeId, eventType, sectionName, sessionId, undefined, 'section', metadata);
  }

  /**
   * Track community interaction
   * Called when user interacts with community section elements
   */
  static async trackCommunityInteraction(
    storeId: string,
    elementId: string,
    interactionType: 'member_spotlight' | 'testimonial' | 'metrics' | 'activity_feed',
    sessionId: string,
    metadata?: Partial<LandingPageTrackingEvent['metadata']>
  ): Promise<void> {
    return this.trackEvent(storeId, 'community_interaction', 'community', sessionId, elementId, interactionType, {
      ...metadata,
      interactionType
    });
  }

  /**
   * Track section scroll behavior
   * Called when user scrolls through sections
   */
  static async trackSectionScroll(
    storeId: string,
    sectionName: string,
    sessionId: string,
    metadata?: Partial<LandingPageTrackingEvent['metadata']>
  ): Promise<void> {
    return this.trackEvent(storeId, 'section_scroll', sectionName, sessionId, `${sectionName}_scroll`, 'scroll', metadata);
  }

  /**
   * Core event tracking method
   * Handles the actual insertion of tracking data into the database
   */
  private static async trackEvent(
    storeId: string,
    eventType: string,
    sectionName: string,
    sessionId: string,
    elementId?: string,
    elementType?: string,
    metadata?: Partial<LandingPageTrackingEvent['metadata']>
  ): Promise<void> {
    try {
      const trackingData = {
        store_id: storeId,
        event_type: eventType,
        section_name: sectionName,
        element_id: elementId,
        element_type: elementType,
        session_id: sessionId,
        user_agent: navigator.userAgent,
        interaction_data: {
          deviceType: DeviceDetector.getDeviceType(),
          timestamp: new Date().toISOString(),
          viewportHeight: window.innerHeight,
          viewportWidth: window.innerWidth,
          scrollPosition: window.scrollY,
          ...metadata
        },
        timestamp: new Date().toISOString()
      };

      const { error } = await supabase
        .from('store_landing_analytics')
        .insert(trackingData);

      if (error) {
        console.error(`Error tracking ${eventType}:`, error);
      } else {
        console.log(`✅ Tracked ${eventType} for section ${sectionName}`);
      }
    } catch (error) {
      console.error(`Error tracking ${eventType}:`, error);
    }
  }

  /**
   * Batch track multiple landing page events
   * Useful for tracking multiple events simultaneously
   */
  static async trackMultipleEvents(
    storeId: string,
    events: Array<{
      eventType: string;
      sectionName: string;
      elementId?: string;
      elementType?: string;
      metadata?: Partial<LandingPageTrackingEvent['metadata']>;
    }>,
    sessionId: string
  ): Promise<void> {
    try {
      const trackingData = events.map(event => ({
        store_id: storeId,
        event_type: event.eventType,
        section_name: event.sectionName,
        element_id: event.elementId,
        element_type: event.elementType,
        session_id: sessionId,
        user_agent: navigator.userAgent,
        interaction_data: {
          deviceType: DeviceDetector.getDeviceType(),
          timestamp: new Date().toISOString(),
          viewportHeight: window.innerHeight,
          viewportWidth: window.innerWidth,
          scrollPosition: window.scrollY,
          ...event.metadata
        },
        timestamp: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('store_landing_analytics')
        .insert(trackingData);

      if (error) {
        console.error('Error batch tracking events:', error);
      } else {
        console.log(`✅ Batch tracked ${events.length} events`);
      }
    } catch (error) {
      console.error('Error batch tracking events:', error);
    }
  }
}

// Export utilities for consistency
export { SessionManager, DeviceDetector } from './bannerTracking';
