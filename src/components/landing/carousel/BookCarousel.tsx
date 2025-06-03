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
 * Single-book carousel component with prominent display
 * - Shows one book at a time across all screen sizes
 * - Auto-slide functionality (4-5 second intervals)
 * - Touch/swipe support via Embla
 * - Smooth transitions and navigation controls
 */
export const BookCarousel: React.FC<BookCarouselProps> = ({
  items,
  onItemClick,
  autoSlide = true,
  autoSlideDelay = 4000
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
          align: "center",
          loop: items.length > 1,
          skipSnaps: false,
          slidesToScroll: 1,
        }}
        plugins={autoplayRef.current ? [autoplayRef.current] : []}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {items.map((item) => (
            <CarouselItem
              key={item.id}
              className="pl-4 basis-full"
            >
              <BookCard
                item={item}
                onClick={() => onItemClick?.(item)}
              />
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Navigation Controls - Show if more than one item */}
        {items.length > 1 && (
          <>
            <CarouselPrevious className="hidden md:flex -left-12 bg-white/90 hover:bg-white border-gray-200 shadow-lg" />
            <CarouselNext className="hidden md:flex -right-12 bg-white/90 hover:bg-white border-gray-200 shadow-lg" />
          </>
        )}

        {/* Carousel Controls (dots indicator) - Must be inside Carousel context */}
        <CarouselControls
          totalItems={items.length}
          visibleItems={1} // Single book view
          className="mt-6"
        />
      </Carousel>
    </div>
  );
};
