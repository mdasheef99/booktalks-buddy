import React from 'react';
import { useCommunityShowcase } from '@/hooks/useCommunityShowcase';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { MemberSpotlight } from './community/MemberSpotlight';
import { TestimonialCarousel } from './community/TestimonialCarousel';
import { CommunityMetrics } from './community/CommunityMetrics';
import { ActivityFeed } from './community/ActivityFeed';
import { Users, Star, MessageCircle, TrendingUp } from 'lucide-react';
import { useSectionAnimation, useStaggeredAnimation } from '../../hooks/useScrollAnimation';
import { useSectionVisibilityTracking } from '@/hooks/useLandingPageTracking';
import { cn } from '@/lib/utils';

interface CommunityShowcaseSectionProps {
  storeId?: string;
  analytics?: any;
}

export const CommunityShowcaseSection: React.FC<CommunityShowcaseSectionProps> = ({ storeId, analytics }) => {
  const { showcaseData, loading, error } = useCommunityShowcase(storeId);
  const { elementRef: headerRef, animationClass: headerAnimation } = useSectionAnimation('fade-up');
  const { elementRef: gridRef, getStaggerClass } = useStaggeredAnimation(4);

  // Track community section visibility
  const communitySectionRef = useSectionVisibilityTracking('community', analytics || {
    trackSectionView: () => {},
    isEnabled: false
  });






  // Show skeleton loading state briefly
  if (loading) {
    return (
      <div className="py-16 md:py-20 px-4 bg-gradient-to-br from-bookconnect-sage/5 to-bookconnect-sage/15 relative">
        <div className="max-w-6xl mx-auto">
          {/* Skeleton Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <div className="h-8 w-8 bg-bookconnect-sage/20 rounded mr-3 animate-pulse"></div>
              <div className="h-8 w-48 bg-bookconnect-sage/20 rounded animate-pulse"></div>
            </div>
            <div className="h-4 w-96 bg-bookconnect-sage/20 rounded mx-auto animate-pulse"></div>
          </div>

          {/* Skeleton Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Left Column Skeletons */}
            <div className="space-y-8">
              <div className="bg-white/90 rounded-xl p-6 border border-gray-100">
                <div className="h-6 w-40 bg-bookconnect-sage/20 rounded mb-6 animate-pulse"></div>
                <div className="space-y-3">
                  <div className="h-4 w-full bg-bookconnect-sage/20 rounded animate-pulse"></div>
                  <div className="h-4 w-3/4 bg-bookconnect-sage/20 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="bg-white/90 rounded-xl p-6 border border-gray-100">
                <div className="h-6 w-32 bg-bookconnect-sage/20 rounded mb-6 animate-pulse"></div>
                <div className="grid grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="text-center p-4 bg-bookconnect-sage/10 rounded-lg">
                      <div className="h-6 w-12 bg-bookconnect-sage/20 rounded mx-auto mb-2 animate-pulse"></div>
                      <div className="h-3 w-16 bg-bookconnect-sage/20 rounded mx-auto animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column Skeletons */}
            <div className="space-y-8">
              <div className="bg-white/90 rounded-xl p-6 border border-gray-100">
                <div className="h-6 w-36 bg-bookconnect-sage/20 rounded mb-6 animate-pulse"></div>
                <div className="space-y-3">
                  <div className="h-4 w-full bg-bookconnect-sage/20 rounded animate-pulse"></div>
                  <div className="h-4 w-5/6 bg-bookconnect-sage/20 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if we have any content to display
  const hasSpotlights = showcaseData?.showcaseSettings.show_member_spotlights &&
                       showcaseData.memberSpotlights.length > 0;
  const hasTestimonials = showcaseData?.showcaseSettings.show_testimonials &&
                         showcaseData.testimonials.length > 0;
  const hasActivityFeed = showcaseData?.showcaseSettings.show_activity_feed &&
                         showcaseData.activityFeed.length > 0;
  const hasMetrics = showcaseData?.showcaseSettings.show_community_metrics;

  // Determine if we should show demo content
  const shouldShowDemo = !storeId || !showcaseData || (!hasSpotlights && !hasTestimonials && !hasActivityFeed && !hasMetrics);

  // Always show the section with either real content or demo content
  const showDemoMetrics = shouldShowDemo;

  // Community interaction tracking
  const trackCommunityClick = (elementType: string, elementId: string) => {
    if (analytics && analytics.isEnabled) {
      analytics.trackCommunityInteraction(elementId, elementType, {
        sectionType: elementType,
        isDemo: shouldShowDemo,
        hasSpotlights,
        hasTestimonials,
        hasActivityFeed,
        hasMetrics
      });
    }
  };

  return (
    <section
      ref={communitySectionRef}
      className="py-16 md:py-20 px-4 bg-gradient-to-br from-bookconnect-sage/5 to-bookconnect-sage/15 relative"
    >
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div ref={headerRef} className={cn("text-center mb-12", headerAnimation)}>
          <div className="flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-bookconnect-terracotta mr-3" />
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-bookconnect-brown leading-tight">
              Our Community
            </h2>
          </div>
          <p className="text-base md:text-lg text-bookconnect-brown/70 max-w-2xl mx-auto leading-relaxed">
            Join thousands of passionate readers who share recommendations, celebrate literary discoveries,
            and build lasting friendships through the power of books.
          </p>
        </div>

        {shouldShowDemo && (
          <div className="mb-8 text-center">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-bookconnect-sage/20 text-bookconnect-brown">
              Demo Content - Configure your store to show real community data
            </span>
          </div>
        )}

        {/* Content Grid */}
        <div ref={gridRef} className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Member Spotlights or Demo */}
            {(hasSpotlights || shouldShowDemo) && (
              <div className={cn("bg-white/90 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 p-6", getStaggerClass(0))}>
                <div className="flex items-center mb-6">
                  <Star className="h-6 w-6 text-bookconnect-terracotta mr-2" />
                  <h3 className="text-xl font-serif font-semibold text-bookconnect-brown leading-tight">
                    Featured Members
                  </h3>
                </div>
                <div className="grid gap-4">
                  {hasSpotlights ? (
                    showcaseData.memberSpotlights
                      .slice(0, showcaseData.showcaseSettings.max_spotlights_display)
                      .map((spotlight) => (
                        <div
                          key={spotlight.id}
                          onClick={() => trackCommunityClick('member_spotlight', spotlight.id)}
                          className="cursor-pointer"
                        >
                          <MemberSpotlight spotlight={spotlight} />
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-4 text-bookconnect-brown/60">
                      <p className="text-sm">Featured community members will appear here</p>
                      <p className="text-xs mt-1">Configure member spotlights in your store settings</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Community Metrics */}
            {(hasMetrics || shouldShowDemo) && (
              <div
                className={cn("bg-white/90 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 p-6 cursor-pointer", getStaggerClass(1))}
                onClick={() => trackCommunityClick('metrics', 'community_metrics')}
              >
                <div className="flex items-center mb-6">
                  <TrendingUp className="h-6 w-6 text-bookconnect-terracotta mr-2" />
                  <h3 className="text-xl font-serif font-semibold text-bookconnect-brown leading-tight">
                    Community Stats
                  </h3>
                </div>
                {hasMetrics ? (
                  <CommunityMetrics metrics={showcaseData.communityMetrics} />
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-bookconnect-sage/10 rounded-lg">
                      <div className="text-2xl font-bold text-bookconnect-brown">150+</div>
                      <div className="text-sm text-bookconnect-brown/70">Active Members</div>
                    </div>
                    <div className="text-center p-4 bg-bookconnect-terracotta/10 rounded-lg">
                      <div className="text-2xl font-bold text-bookconnect-brown">25</div>
                      <div className="text-sm text-bookconnect-brown/70">Book Clubs</div>
                    </div>
                    <div className="text-center p-4 bg-bookconnect-olive/10 rounded-lg">
                      <div className="text-2xl font-bold text-bookconnect-brown">500+</div>
                      <div className="text-sm text-bookconnect-brown/70">Books Read</div>
                    </div>
                    <div className="text-center p-4 bg-bookconnect-cream/50 rounded-lg">
                      <div className="text-2xl font-bold text-bookconnect-brown">12</div>
                      <div className="text-sm text-bookconnect-brown/70">Events This Month</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Testimonials */}
            {hasTestimonials && (
              <div className={cn("bg-white/90 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 p-6", getStaggerClass(2))}>
                <div className="flex items-center mb-6">
                  <MessageCircle className="h-6 w-6 text-bookconnect-terracotta mr-2" />
                  <h3 className="text-xl font-serif font-semibold text-bookconnect-brown leading-tight">
                    What Our Customers Say
                  </h3>
                </div>
                <TestimonialCarousel testimonials={showcaseData.testimonials} />
              </div>
            )}

            {/* Activity Feed */}
            {hasActivityFeed && (
              <div className={cn("bg-white/90 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 p-6", getStaggerClass(3))}>
                <div className="flex items-center mb-6">
                  <Users className="h-6 w-6 text-bookconnect-terracotta mr-2" />
                  <h3 className="text-xl font-serif font-semibold text-bookconnect-brown leading-tight">
                    Recent Activity
                  </h3>
                </div>
                <ActivityFeed 
                  activities={showcaseData.activityFeed} 
                  limit={showcaseData.showcaseSettings.activity_feed_limit}
                />
              </div>
            )}
          </div>
        </div>

        {/* Error State */}
        {error && !showcaseData && (
          <div className="text-center py-8">
            <div className="text-bookconnect-brown/60 mb-2">
              Unable to load community showcase
            </div>
            <div className="text-sm text-bookconnect-brown/40">
              Please try refreshing the page
            </div>
          </div>
        )}


      </div>
    </section>
  );
};
