/**
 * Landing Page Analytics Tracking Hook
 * 
 * Provides easy-to-use analytics tracking for landing page components
 * Handles session management, automatic page load tracking, and error handling
 */

import { useCallback, useEffect, useRef } from 'react';
import { LandingPageTrackingAPI, SessionManager } from '@/lib/api/store/analytics/landingPageTracking';

interface UseLandingPageTrackingOptions {
  storeId?: string;
  enabled?: boolean;
}

interface UseLandingPageTrackingReturn {
  trackPageLoad: (metadata?: any) => void;
  trackChatButtonClick: (metadata?: any) => void;
  trackCarouselClick: (bookId: string, metadata?: any) => void;
  trackSectionView: (sectionName: 'hero' | 'carousel' | 'community' | 'quote', metadata?: any) => void;
  trackCommunityInteraction: (elementId: string, interactionType: string, metadata?: any) => void;
  trackSectionScroll: (sectionName: string, metadata?: any) => void;
  sessionId: string;
  isEnabled: boolean;
}

/**
 * Hook for tracking landing page analytics events
 * 
 * Features:
 * - Automatic page load tracking on first use
 * - Session management integration
 * - Easy-to-use tracking methods
 * - Error handling and logging
 * - Conditional tracking based on storeId availability
 */
export const useLandingPageTracking = ({
  storeId,
  enabled = true
}: UseLandingPageTrackingOptions): UseLandingPageTrackingReturn => {
  const sessionId = SessionManager.getSessionId();
  const hasTrackedPageLoad = useRef(false);
  const isEnabled = enabled && !!storeId;

  // Track page load automatically when hook is first used with valid storeId
  useEffect(() => {
    if (isEnabled && !hasTrackedPageLoad.current) {
      hasTrackedPageLoad.current = true;
      
      // Track page load with initial metadata
      LandingPageTrackingAPI.trackPageLoad(storeId!, sessionId, {
        referrer: document.referrer,
        userAgent: navigator.userAgent,
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth,
        timestamp: new Date().toISOString(),
        loadTime: performance.now()
      });

      console.log('🚀 Landing page analytics initialized for store:', storeId);
    }
  }, [storeId, isEnabled, sessionId]);

  // Manual page load tracking (for testing or re-tracking)
  const trackPageLoad = useCallback((metadata?: any) => {
    if (!isEnabled) {
      console.warn('Landing page tracking disabled - no storeId provided');
      return;
    }
    
    LandingPageTrackingAPI.trackPageLoad(storeId!, sessionId, metadata);
  }, [storeId, sessionId, isEnabled]);

  // Track chat button clicks in hero section
  const trackChatButtonClick = useCallback((metadata?: any) => {
    if (!isEnabled) {
      console.warn('Landing page tracking disabled - no storeId provided');
      return;
    }
    
    LandingPageTrackingAPI.trackChatButtonClick(storeId!, sessionId, {
      clickTime: new Date().toISOString(),
      ...metadata
    });
  }, [storeId, sessionId, isEnabled]);

  // Track carousel book clicks
  const trackCarouselClick = useCallback((bookId: string, metadata?: any) => {
    if (!isEnabled) {
      console.warn('Landing page tracking disabled - no storeId provided');
      return;
    }
    
    if (!bookId) {
      console.warn('Cannot track carousel click - no bookId provided');
      return;
    }
    
    LandingPageTrackingAPI.trackCarouselClick(storeId!, bookId, sessionId, {
      clickTime: new Date().toISOString(),
      ...metadata
    });
  }, [storeId, sessionId, isEnabled]);

  // Track section views (when sections become visible)
  const trackSectionView = useCallback((
    sectionName: 'hero' | 'carousel' | 'community' | 'quote', 
    metadata?: any
  ) => {
    if (!isEnabled) {
      console.warn('Landing page tracking disabled - no storeId provided');
      return;
    }
    
    LandingPageTrackingAPI.trackSectionView(storeId!, sectionName, sessionId, {
      viewTime: new Date().toISOString(),
      sectionName,
      ...metadata
    });
  }, [storeId, sessionId, isEnabled]);

  // Track community section interactions
  const trackCommunityInteraction = useCallback((
    elementId: string, 
    interactionType: string, 
    metadata?: any
  ) => {
    if (!isEnabled) {
      console.warn('Landing page tracking disabled - no storeId provided');
      return;
    }
    
    if (!elementId || !interactionType) {
      console.warn('Cannot track community interaction - missing elementId or interactionType');
      return;
    }
    
    LandingPageTrackingAPI.trackCommunityInteraction(
      storeId!, 
      elementId, 
      interactionType as any, 
      sessionId, 
      {
        interactionTime: new Date().toISOString(),
        ...metadata
      }
    );
  }, [storeId, sessionId, isEnabled]);

  // Track section scrolling behavior
  const trackSectionScroll = useCallback((sectionName: string, metadata?: any) => {
    if (!isEnabled) {
      console.warn('Landing page tracking disabled - no storeId provided');
      return;
    }
    
    LandingPageTrackingAPI.trackSectionScroll(storeId!, sectionName, sessionId, {
      scrollTime: new Date().toISOString(),
      ...metadata
    });
  }, [storeId, sessionId, isEnabled]);

  return {
    trackPageLoad,
    trackChatButtonClick,
    trackCarouselClick,
    trackSectionView,
    trackCommunityInteraction,
    trackSectionScroll,
    sessionId,
    isEnabled
  };
};

/**
 * Hook for tracking section visibility using Intersection Observer
 * 
 * This is a utility hook that can be used by components to automatically
 * track when they become visible to users
 */
export const useSectionVisibilityTracking = (
  sectionName: 'hero' | 'carousel' | 'community' | 'quote',
  analytics: UseLandingPageTrackingReturn,
  options: {
    threshold?: number;
    rootMargin?: string;
    triggerOnce?: boolean;
  } = {}
) => {
  const elementRef = useRef<HTMLElement>(null);
  const hasTriggered = useRef(false);
  const { threshold = 0.5, rootMargin = '0px', triggerOnce = true } = options;

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !analytics.isEnabled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && (!triggerOnce || !hasTriggered.current)) {
            hasTriggered.current = true;
            
            analytics.trackSectionView(sectionName, {
              intersectionRatio: entry.intersectionRatio,
              boundingClientRect: entry.boundingClientRect,
              rootBounds: entry.rootBounds,
              threshold,
              rootMargin
            });
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [sectionName, analytics, threshold, rootMargin, triggerOnce]);

  return elementRef;
};
