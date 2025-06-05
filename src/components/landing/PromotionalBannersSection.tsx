import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { PromotionalBanner } from './banners/PromotionalBanner';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Megaphone } from 'lucide-react';

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
  created_at: string;
  updated_at: string;
}

interface PromotionalBannersSectionProps {
  storeId?: string;
}

/**
 * Promotional Banners Section for Store Landing Page
 * Displays scheduled marketing banners with animations
 * Position 3 - Between Hero and Community sections
 */
export const PromotionalBannersSection: React.FC<PromotionalBannersSectionProps> = ({ storeId }) => {
  const [isVisible, setIsVisible] = useState(false);

  // Fetch active promotional banners for the store
  const {
    data: bannerItems,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['store-promotional-banners', storeId],
    queryFn: async () => {
      if (!storeId) return [];

      const { data, error } = await supabase
        .from('store_promotional_banners')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .or(`start_date.is.null,start_date.lte.${new Date().toISOString()}`)
        .or(`end_date.is.null,end_date.gt.${new Date().toISOString()}`)
        .order('priority_order', { ascending: true })
        .limit(5); // Max 5 banners at once

      if (error) {
        console.error('Error fetching promotional banners:', error);
        throw new Error('Failed to load promotional banners');
      }

      return data as BannerItem[];
    },
    enabled: !!storeId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });

  // Check if banners should be visible
  useEffect(() => {
    const hasActiveBanners = bannerItems && bannerItems.length > 0;
    setIsVisible(hasActiveBanners);
  }, [bannerItems]);

  // Don't render if no store ID provided
  if (!storeId) {
    return null;
  }

  // Don't render if no active banners
  if (!isVisible && !isLoading) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <section className="py-6 bg-gradient-to-r from-bookconnect-terracotta/5 to-bookconnect-sage/5">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center min-h-[120px]">
            <LoadingSpinner size="md" text="Loading promotions..." />
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="py-6 bg-gradient-to-r from-bookconnect-terracotta/5 to-bookconnect-sage/5">
        <div className="container mx-auto px-4">
          <Alert variant="destructive" className="max-w-md mx-auto">
            <Megaphone className="h-4 w-4" />
            <AlertDescription>
              Unable to load promotional banners. Please try refreshing the page.
            </AlertDescription>
          </Alert>
        </div>
      </section>
    );
  }

  // Main banners section
  return (
    <section className="py-16 md:py-20 bg-gradient-to-br from-bookconnect-sage/5 to-bookconnect-sage/10 border-y border-bookconnect-sage/20">
      <div className="container mx-auto px-4">
        {/* Section Header (optional, can be hidden for seamless banners) */}
        {bannerItems && bannerItems.length > 1 && (
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-bookconnect-terracotta/10 text-bookconnect-terracotta text-sm font-medium">
              <Megaphone className="h-3 w-3" />
              Special Offers
            </div>
          </div>
        )}

        {/* Banners Display */}
        <div className="space-y-4">
          {bannerItems?.map((banner, index) => (
            <PromotionalBanner
              key={banner.id}
              banner={banner}
              index={index}
              onBannerClick={(bannerId) => {
                // Track banner click analytics
                if (banner.cta_url) {
                  // Analytics tracking would go here
                  console.log('Banner clicked:', bannerId);
                  window.open(banner.cta_url, '_blank', 'noopener,noreferrer');
                }
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PromotionalBannersSection;
