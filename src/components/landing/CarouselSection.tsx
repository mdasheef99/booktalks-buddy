import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { BookCarousel } from './carousel/BookCarousel';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookOpen } from 'lucide-react';

interface CarouselItem {
  id: string;
  position: number;
  book_title: string;
  book_author: string;
  book_isbn?: string;
  custom_description?: string;
  featured_badge?: 'new_arrival' | 'staff_pick' | 'bestseller' | 'on_sale' | 'featured' | 'none';
  overlay_text?: string;
  book_image_url?: string;
  book_image_alt?: string;
  click_destination_url?: string;
  is_active: boolean;
}

interface CarouselSectionProps {
  storeId?: string;
}

/**
 * Featured Books Carousel Section for Store Landing Page
 * Displays up to 6 featured books in a responsive carousel
 * Position 1 - Above HeroSection
 */
export const CarouselSection: React.FC<CarouselSectionProps> = ({ storeId }) => {
  const [isVisible, setIsVisible] = useState(false);

  // Fetch carousel items for the store
  const {
    data: carouselItems,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['store-carousel', storeId],
    queryFn: async () => {
      if (!storeId) return [];

      const { data, error } = await supabase
        .from('store_carousel_items')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('position', { ascending: true })
        .limit(6);

      if (error) {
        console.error('Error fetching carousel items:', error);
        throw new Error('Failed to load featured books');
      }

      return data as CarouselItem[];
    },
    enabled: !!storeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  // Check if carousel should be visible
  useEffect(() => {
    const hasActiveItems = carouselItems && carouselItems.length > 0;
    setIsVisible(hasActiveItems);
  }, [carouselItems]);

  // Don't render if no store ID provided
  if (!storeId) {
    return null;
  }

  // Don't render if no active carousel items
  if (!isVisible && !isLoading) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <section className="py-8 bg-gradient-to-br from-bookconnect-sage/5 to-bookconnect-cream/10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-sm text-gray-600">Loading featured books...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="py-8 bg-gradient-to-br from-bookconnect-sage/5 to-bookconnect-cream/10">
        <div className="container mx-auto px-4">
          <Alert variant="destructive" className="max-w-md mx-auto">
            <BookOpen className="h-4 w-4" />
            <AlertDescription>
              Unable to load featured books. Please try refreshing the page.
            </AlertDescription>
          </Alert>
        </div>
      </section>
    );
  }

  // Main carousel section
  return (
    <section className="py-12 bg-gradient-to-br from-bookconnect-sage/5 to-bookconnect-cream/10 border-b border-bookconnect-sage/10">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-bookconnect-terracotta/10 text-bookconnect-terracotta text-sm font-medium mb-4">
            <BookOpen className="h-4 w-4" />
            Featured Books
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4">
            Discover Our Favorites
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Handpicked selections from our collection, curated just for you
          </p>
        </div>

        {/* Carousel Component */}
        <BookCarousel 
          items={carouselItems || []} 
          onItemClick={(item) => {
            if (item.click_destination_url) {
              window.open(item.click_destination_url, '_blank', 'noopener,noreferrer');
            }
          }}
        />
      </div>
    </section>
  );
};

export default CarouselSection;
