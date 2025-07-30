import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BannerTrackingAPI, SessionManager, DeviceDetector } from '@/lib/api/store/analytics/bannerTracking';

interface BannerItem {
  id: string;
  store_id: string;
  title: string;
  subtitle?: string;
  content_type: 'text' | 'image' | 'mixed';
  text_content?: string;
  cta_text?: string;
  cta_url?: string;
  banner_image_url?: string;
  banner_image_alt?: string;
  background_color?: string;
  text_color?: string;
  animation_type?: 'none' | 'fade' | 'slide' | 'bounce' | 'pulse';
  priority_order: number;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
}

interface PromotionalBannerProps {
  banner: BannerItem;
  index: number;
  onBannerClick?: (bannerId: string) => void;
  className?: string;
  storeId?: string; // Added for analytics tracking
  totalBannersVisible?: number; // Added for context tracking
}

const animationClasses = {
  none: '',
  fade: 'animate-fade-in',
  slide: 'animate-slide-in-left',
  bounce: 'animate-bounce-in',
  pulse: 'animate-pulse-slow'
};

/**
 * Individual promotional banner component
 * Supports text, image, and mixed content types with animations
 */
export const PromotionalBanner: React.FC<PromotionalBannerProps> = ({
  banner,
  index,
  onBannerClick,
  className,
  storeId,
  totalBannersVisible
}) => {
  // Refs and state for analytics tracking
  const bannerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [viewStartTime, setViewStartTime] = useState<number | null>(null);
  const [hasBeenTracked, setHasBeenTracked] = useState(false);
  const [scrollBehavior, setScrollBehavior] = useState({
    scrollDirection: 'none' as 'up' | 'down' | 'none',
    scrollSpeed: 0,
    lastScrollY: 0,
    scrollEvents: 0
  });

  const animationClass = banner.animation_type ? animationClasses[banner.animation_type] : '';
  const hasClickAction = banner.cta_url || onBannerClick;

  // Determine banner style based on content type
  const getBannerStyle = () => {
    const baseStyle: React.CSSProperties = {};
    
    if (banner.background_color) {
      baseStyle.backgroundColor = banner.background_color;
    }
    
    if (banner.text_color) {
      baseStyle.color = banner.text_color;
    }

    if (banner.content_type === 'image' && banner.banner_image_url) {
      baseStyle.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${banner.banner_image_url})`;
      baseStyle.backgroundSize = 'cover';
      baseStyle.backgroundPosition = 'center';
      baseStyle.color = banner.text_color || '#ffffff';
    }

    return baseStyle;
  };

  const handleBannerClick = (event?: React.MouseEvent) => {
    // Capture click position if event is available
    let clickPosition: { x: number; y: number } | undefined;
    if (event && bannerRef.current) {
      const rect = bannerRef.current.getBoundingClientRect();
      clickPosition = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
    }

    // Track click with position data if storeId is available
    if (storeId && clickPosition) {
      const sessionId = SessionManager.getSessionId();
      BannerTrackingAPI.trackBannerClick(
        storeId,
        banner.id,
        sessionId,
        {
          bannerPosition: index + 1,
          totalBannersVisible: totalBannersVisible || 1,
          bannerTitle: banner.title,
          bannerType: banner.content_type,
          clickPosition,
          deviceType: DeviceDetector.getDeviceType(),
          clickSource: 'banner_component',
          timestamp: new Date().toISOString()
        }
      );
    }

    if (onBannerClick) {
      onBannerClick(banner.id);
    }
  };

  // Intersection Observer for banner view tracking
  useEffect(() => {
    if (!storeId || !bannerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasBeenTracked) {
            // Banner became visible
            setIsVisible(true);
            setViewStartTime(Date.now());
            setHasBeenTracked(true);

            // Track banner view
            const sessionId = SessionManager.getSessionId();
            BannerTrackingAPI.trackBannerView(
              storeId,
              banner.id,
              sessionId,
              {
                bannerPosition: index + 1,
                totalBannersVisible: totalBannersVisible || 1,
                bannerTitle: banner.title,
                bannerType: banner.content_type,
                deviceType: DeviceDetector.getDeviceType(),
                viewportHeight: window.innerHeight,
                viewportWidth: window.innerWidth,
                scrollPosition: window.scrollY
              }
            );
          } else if (!entry.isIntersecting && isVisible && viewStartTime) {
            // Banner became invisible - track view duration
            const viewDuration = Date.now() - viewStartTime;
            setIsVisible(false);

            // Track view duration if it was visible for more than 1 second
            if (viewDuration > 1000) {
              const sessionId = SessionManager.getSessionId();
              BannerTrackingAPI.trackBannerView(
                storeId,
                banner.id,
                sessionId,
                {
                  bannerPosition: index + 1,
                  totalBannersVisible: totalBannersVisible || 1,
                  bannerTitle: banner.title,
                  bannerType: banner.content_type,
                  viewDuration: viewDuration,
                  deviceType: DeviceDetector.getDeviceType(),
                  eventSubType: 'view_duration'
                }
              );
            }
          }
        });
      },
      {
        threshold: 0.5, // Trigger when 50% of banner is visible
        rootMargin: '0px 0px -50px 0px' // Slight offset to ensure meaningful visibility
      }
    );

    observer.observe(bannerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [storeId, banner.id, index, totalBannersVisible, banner.title, banner.content_type, hasBeenTracked, isVisible, viewStartTime]);

  // Scroll behavior tracking
  useEffect(() => {
    if (!storeId || !isVisible) return;

    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - scrollBehavior.lastScrollY;
      const scrollDirection = scrollDelta > 0 ? 'down' : scrollDelta < 0 ? 'up' : 'none';
      const scrollSpeed = Math.abs(scrollDelta);

      setScrollBehavior(prev => ({
        scrollDirection,
        scrollSpeed,
        lastScrollY: currentScrollY,
        scrollEvents: prev.scrollEvents + 1
      }));

      // Debounce scroll tracking - track significant scroll behavior
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        if (scrollBehavior.scrollEvents > 5) { // Only track if user scrolled significantly
          const sessionId = SessionManager.getSessionId();
          BannerTrackingAPI.trackBannerView(
            storeId,
            banner.id,
            sessionId,
            {
              bannerPosition: index + 1,
              totalBannersVisible: totalBannersVisible || 1,
              bannerTitle: banner.title,
              bannerType: banner.content_type,
              scrollDirection: scrollBehavior.scrollDirection,
              scrollSpeed: scrollBehavior.scrollSpeed,
              scrollEvents: scrollBehavior.scrollEvents,
              deviceType: DeviceDetector.getDeviceType(),
              eventSubType: 'scroll_behavior'
            }
          );

          // Reset scroll tracking
          setScrollBehavior(prev => ({ ...prev, scrollEvents: 0 }));
        }
      }, 1000); // Track scroll behavior every 1 second of activity
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [storeId, banner.id, index, totalBannersVisible, banner.title, banner.content_type, isVisible, scrollBehavior]);

  // Text-only banner
  if (banner.content_type === 'text') {
    return (
      <Card
        ref={bannerRef}
        className={cn(
          "overflow-hidden transition-all duration-300 hover:shadow-lg border-0",
          hasClickAction && "cursor-pointer hover:scale-[1.02]",
          animationClass,
          className
        )}
        style={getBannerStyle()}
        onClick={hasClickAction ? (e) => handleBannerClick(e) : undefined}
      >
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl md:text-2xl font-bold mb-2">
                {banner.title}
              </h3>
              
              {banner.subtitle && (
                <p className="text-lg opacity-90 mb-3">
                  {banner.subtitle}
                </p>
              )}
              
              {banner.text_content && (
                <p className="text-sm md:text-base opacity-80 leading-relaxed">
                  {banner.text_content}
                </p>
              )}
            </div>

            {banner.cta_text && banner.cta_url && (
              <div className="flex-shrink-0">
                <Button
                  variant="secondary"
                  size="lg"
                  className="bg-white/20 hover:bg-white/30 text-inherit border-white/30"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBannerClick();
                  }}
                >
                  {banner.cta_text}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Image-only banner
  if (banner.content_type === 'image') {
    return (
      <Card
        ref={bannerRef}
        className={cn(
          "overflow-hidden transition-all duration-300 hover:shadow-lg border-0 min-h-[200px] md:min-h-[250px]",
          hasClickAction && "cursor-pointer hover:scale-[1.02]",
          animationClass,
          className
        )}
        style={getBannerStyle()}
        onClick={hasClickAction ? (e) => handleBannerClick(e) : undefined}
      >
        <CardContent className="p-6 md:p-8 h-full flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-2xl md:text-3xl font-bold mb-4 text-white drop-shadow-lg">
              {banner.title}
            </h3>
            
            {banner.subtitle && (
              <p className="text-lg md:text-xl text-white/90 drop-shadow mb-6">
                {banner.subtitle}
              </p>
            )}

            {banner.cta_text && banner.cta_url && (
              <Button
                variant="secondary"
                size="lg"
                className="bg-white/90 hover:bg-white text-gray-900 shadow-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  handleBannerClick();
                }}
              >
                {banner.cta_text}
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Mixed content banner (image + text)
  return (
    <Card
      ref={bannerRef}
      className={cn(
        "overflow-hidden transition-all duration-300 hover:shadow-lg border-0",
        hasClickAction && "cursor-pointer hover:scale-[1.02]",
        animationClass,
        className
      )}
      onClick={hasClickAction ? (e) => handleBannerClick(e) : undefined}
    >
      <CardContent className="p-0">
        <div className="grid md:grid-cols-2 gap-0 min-h-[200px]">
          {/* Image Section */}
          {banner.banner_image_url && (
            <div 
              className="bg-cover bg-center min-h-[200px] md:min-h-[250px]"
              style={{
                backgroundImage: `url(${banner.banner_image_url})`,
              }}
            />
          )}

          {/* Content Section */}
          <div 
            className="p-6 md:p-8 flex flex-col justify-center"
            style={{
              backgroundColor: banner.background_color || '#ffffff',
              color: banner.text_color || '#000000'
            }}
          >
            <h3 className="text-xl md:text-2xl font-bold mb-3">
              {banner.title}
            </h3>
            
            {banner.subtitle && (
              <p className="text-lg opacity-90 mb-4">
                {banner.subtitle}
              </p>
            )}
            
            {banner.text_content && (
              <p className="text-sm md:text-base opacity-80 leading-relaxed mb-6">
                {banner.text_content}
              </p>
            )}

            {banner.cta_text && banner.cta_url && (
              <Button
                variant="default"
                size="lg"
                className="w-fit"
                onClick={(e) => {
                  e.stopPropagation();
                  handleBannerClick();
                }}
              >
                {banner.cta_text}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
