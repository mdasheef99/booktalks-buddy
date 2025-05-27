import React from 'react';
import { useCommunityShowcase } from '@/hooks/useCommunityShowcase';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { MemberSpotlight } from './community/MemberSpotlight';
import { TestimonialCarousel } from './community/TestimonialCarousel';
import { CommunityMetrics } from './community/CommunityMetrics';
import { ActivityFeed } from './community/ActivityFeed';
import { Users, Star, MessageCircle, TrendingUp } from 'lucide-react';

interface CommunityShowcaseSectionProps {
  storeId?: string;
}

export const CommunityShowcaseSection: React.FC<CommunityShowcaseSectionProps> = ({ storeId }) => {
  const { showcaseData, loading, error } = useCommunityShowcase(storeId);

  // Show loading state briefly
  if (loading) {
    return (
      <div className="py-16 px-4 bg-bookconnect-cream/10 relative">
        <div className="max-w-7xl mx-auto text-center">
          <LoadingSpinner size="md" text="Loading community showcase..." />
        </div>
      </div>
    );
  }

  // Hide entire section if no data and no error
  if (!loading && !showcaseData && !error) {
    return null;
  }

  // Hide section if all features are disabled
  if (showcaseData && !showcaseData.showcaseSettings.show_member_spotlights && 
      !showcaseData.showcaseSettings.show_testimonials && 
      !showcaseData.showcaseSettings.show_activity_feed && 
      !showcaseData.showcaseSettings.show_community_metrics) {
    return null;
  }

  // Check if we have any content to display
  const hasSpotlights = showcaseData?.showcaseSettings.show_member_spotlights && 
                       showcaseData.memberSpotlights.length > 0;
  const hasTestimonials = showcaseData?.showcaseSettings.show_testimonials && 
                         showcaseData.testimonials.length > 0;
  const hasActivityFeed = showcaseData?.showcaseSettings.show_activity_feed && 
                         showcaseData.activityFeed.length > 0;
  const hasMetrics = showcaseData?.showcaseSettings.show_community_metrics;

  // Hide section if no actual content
  if (!hasSpotlights && !hasTestimonials && !hasActivityFeed && !hasMetrics) {
    return null;
  }

  return (
    <div className="py-16 px-4 bg-bookconnect-cream/10 relative">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-bookconnect-terracotta mr-3" />
            <h2 className="text-3xl md:text-4xl font-bold text-bookconnect-brown">
              Our Community
            </h2>
          </div>
          <p className="text-lg text-bookconnect-brown/70 max-w-2xl mx-auto">
            Discover the vibrant community of readers, book lovers, and literary enthusiasts 
            who make our bookstore a special place.
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Member Spotlights */}
            {hasSpotlights && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center mb-6">
                  <Star className="h-6 w-6 text-bookconnect-terracotta mr-2" />
                  <h3 className="text-xl font-semibold text-bookconnect-brown">
                    Featured Members
                  </h3>
                </div>
                <div className="grid gap-4">
                  {showcaseData.memberSpotlights
                    .slice(0, showcaseData.showcaseSettings.max_spotlights_display)
                    .map((spotlight) => (
                      <MemberSpotlight key={spotlight.id} spotlight={spotlight} />
                    ))}
                </div>
              </div>
            )}

            {/* Community Metrics */}
            {hasMetrics && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center mb-6">
                  <TrendingUp className="h-6 w-6 text-bookconnect-terracotta mr-2" />
                  <h3 className="text-xl font-semibold text-bookconnect-brown">
                    Community Stats
                  </h3>
                </div>
                <CommunityMetrics metrics={showcaseData.communityMetrics} />
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Testimonials */}
            {hasTestimonials && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center mb-6">
                  <MessageCircle className="h-6 w-6 text-bookconnect-terracotta mr-2" />
                  <h3 className="text-xl font-semibold text-bookconnect-brown">
                    What Our Customers Say
                  </h3>
                </div>
                <TestimonialCarousel testimonials={showcaseData.testimonials} />
              </div>
            )}

            {/* Activity Feed */}
            {hasActivityFeed && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center mb-6">
                  <Users className="h-6 w-6 text-bookconnect-terracotta mr-2" />
                  <h3 className="text-xl font-semibold text-bookconnect-brown">
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

        {/* Call to Action */}
        {(hasSpotlights || hasTestimonials || hasActivityFeed || hasMetrics) && (
          <div className="text-center bg-gradient-to-r from-bookconnect-sage/20 to-bookconnect-cream/20 rounded-xl p-8">
            <h3 className="text-2xl font-semibold text-bookconnect-brown mb-4">
              Join Our Community
            </h3>
            <p className="text-bookconnect-brown/70 mb-6 max-w-2xl mx-auto">
              Become part of our growing community of book lovers. Share your thoughts, 
              discover new reads, and connect with fellow readers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-6 py-3 bg-bookconnect-terracotta text-white rounded-lg hover:bg-bookconnect-terracotta/90 transition-colors font-medium">
                Browse Book Clubs
              </button>
              <button className="px-6 py-3 border border-bookconnect-terracotta text-bookconnect-terracotta rounded-lg hover:bg-bookconnect-terracotta/5 transition-colors font-medium">
                Start Reading
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
