import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { BookCarousel } from './carousel/BookCarousel';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookOpen } from 'lucide-react';
import { useSectionAnimation } from '../../hooks/useScrollAnimation';
import { cn } from '@/lib/utils';

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
  const { elementRef: headerRef, animationClass: headerAnimation } = useSectionAnimation('fade-up');
  const { elementRef: carouselRef, animationClass: carouselAnimation } = useSectionAnimation('fade-scale');

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

  // Create demo/fallback carousel items when no store data is available
  const demoCarouselItems = [
    {
      id: 'demo-1',
      position: 1,
      book_title: 'The Seven Husbands of Evelyn Hugo',
      book_author: 'Taylor Jenkins Reid',
      book_isbn: '9781501161933',
      custom_description: 'A captivating novel about a reclusive Hollywood icon who finally decides to tell her story.',
      featured_badge: 'bestseller' as const,
      book_image_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      book_image_alt: 'The Seven Husbands of Evelyn Hugo book cover',
      is_active: true
    },
    {
      id: 'demo-2',
      position: 2,
      book_title: 'Atomic Habits',
      book_author: 'James Clear',
      book_isbn: '9780735211292',
      custom_description: 'An easy & proven way to build good habits & break bad ones.',
      featured_badge: 'staff_pick' as const,
      book_image_url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      book_image_alt: 'Atomic Habits book cover',
      is_active: true
    },
    {
      id: 'demo-3',
      position: 3,
      book_title: 'The Midnight Library',
      book_author: 'Matt Haig',
      book_isbn: '9780525559474',
      custom_description: 'Between life and death there is a library, and within that library, the shelves go on forever.',
      featured_badge: 'new_arrival' as const,
      book_image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      book_image_alt: 'The Midnight Library book cover',
      is_active: true
    },
    {
      id: 'demo-4',
      position: 4,
      book_title: 'Educated',
      book_author: 'Tara Westover',
      book_isbn: '9780399590504',
      custom_description: 'A memoir about a young girl who, kept out of school, leaves her survivalist family and goes on to earn a PhD from Cambridge.',
      featured_badge: 'featured' as const,
      book_image_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      book_image_alt: 'Educated book cover',
      is_active: true
    },
    {
      id: 'demo-5',
      position: 5,
      book_title: 'The Silent Patient',
      book_author: 'Alex Michaelides',
      book_isbn: '9781250301697',
      custom_description: 'A woman\'s act of violence against her husband and her refusal to speak sends shockwaves through London.',
      featured_badge: 'on_sale' as const,
      book_image_url: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      book_image_alt: 'The Silent Patient book cover',
      is_active: true
    },
    {
      id: 'demo-6',
      position: 6,
      book_title: 'Where the Crawdads Sing',
      book_author: 'Delia Owens',
      book_isbn: '9780735219090',
      custom_description: 'A coming-of-age story that combines mystery and a celebration of nature.',
      featured_badge: 'bestseller' as const,
      book_image_url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      book_image_alt: 'Where the Crawdads Sing book cover',
      is_active: true
    }
  ];

  // Use demo items if no store data is available
  const displayItems = carouselItems && carouselItems.length > 0 ? carouselItems : demoCarouselItems;
  const shouldShowDemo = !storeId || (!carouselItems || carouselItems.length === 0);

  // Don't render only if there's an error and no fallback
  if (error && !shouldShowDemo) {
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

  // Loading state - only show if we don't have demo items to fall back to
  if (isLoading && !shouldShowDemo) {
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

  // Main carousel section
  return (
    <section className="py-16 md:py-20 bg-bookconnect-cream border-b border-bookconnect-sage/20 relative">
      {/* Decorative bottom border */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-0.5 bg-gradient-to-r from-transparent via-bookconnect-terracotta to-transparent"></div>
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div ref={headerRef} className={cn("text-center mb-12", headerAnimation)}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-bookconnect-terracotta/10 text-bookconnect-terracotta text-sm font-medium mb-4">
            <BookOpen className="h-4 w-4" />
            Featured Books
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4 leading-tight">
            Discover Our Favorites
          </h2>
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Handpicked selections from our collection, curated just for you
          </p>
        </div>

        {/* Carousel Component */}
        <div ref={carouselRef} className={carouselAnimation}>
          {shouldShowDemo && (
            <div className="mb-4 text-center">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-bookconnect-sage/20 text-bookconnect-brown">
                Demo Content - Configure your store to show custom books
              </span>
            </div>
          )}
          <BookCarousel
            items={displayItems}
            onItemClick={(item) => {
              if (item.click_destination_url) {
                window.open(item.click_destination_url, '_blank', 'noopener,noreferrer');
              } else if (shouldShowDemo) {
                // For demo items, show a helpful message
                alert('This is a demo book. Configure your store carousel to add real books with custom click actions.');
              }
            }}
          />
        </div>
      </div>
    </section>
  );
};

export default CarouselSection;
