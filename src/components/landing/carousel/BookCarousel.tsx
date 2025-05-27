import React, { useEffect, useRef } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { BookCard } from './BookCard';
import { CarouselControls } from './CarouselControls';
import Autoplay from 'embla-carousel-autoplay';

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

interface BookCarouselProps {
  items: CarouselItem[];
  onItemClick?: (item: CarouselItem) => void;
  autoSlide?: boolean;
  autoSlideDelay?: number;
}

/**
 * Responsive book carousel component
 * - Mobile: 2-3 books visible
 * - Desktop: 6 books visible
 * - Auto-slide functionality
 * - Touch/swipe support via Embla
 */
export const BookCarousel: React.FC<BookCarouselProps> = ({
  items,
  onItemClick,
  autoSlide = true,
  autoSlideDelay = 5000
}) => {
  const autoplayRef = useRef(
    autoSlide ? Autoplay({ delay: autoSlideDelay, stopOnInteraction: true }) : null
  );

  // Don't render if no items
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No featured books available at this time.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <Carousel
        opts={{
          align: "start",
          loop: items.length > 3,
          skipSnaps: false,
        }}
        plugins={autoplayRef.current ? [autoplayRef.current] : []}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {items.map((item) => (
            <CarouselItem
              key={item.id}
              className="pl-2 md:pl-4 basis-1/2 sm:basis-1/3 lg:basis-1/4 xl:basis-1/6"
            >
              <BookCard
                item={item}
                onClick={() => onItemClick?.(item)}
              />
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Navigation Controls - Only show if more than visible items */}
        {items.length > 3 && (
          <>
            <CarouselPrevious className="hidden md:flex -left-12 bg-white/90 hover:bg-white border-gray-200 shadow-lg" />
            <CarouselNext className="hidden md:flex -right-12 bg-white/90 hover:bg-white border-gray-200 shadow-lg" />
          </>
        )}

        {/* Carousel Controls (dots indicator) - Must be inside Carousel context */}
        <CarouselControls
          totalItems={items.length}
          visibleItems={6} // Desktop view
          className="mt-6"
        />
      </Carousel>
    </div>
  );
};
