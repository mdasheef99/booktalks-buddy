import React, { useState, useEffect } from 'react';
import { useCarousel } from '@/components/ui/carousel';
import { cn } from '@/lib/utils';

interface CarouselControlsProps {
  totalItems: number;
  visibleItems: number;
  className?: string;
}

/**
 * Carousel dot indicators and controls
 * Shows current position and allows direct navigation
 * Optimized for single-slide carousel display
 */
export const CarouselControls: React.FC<CarouselControlsProps> = ({
  totalItems,
  visibleItems,
  className
}) => {
  const { api } = useCarousel();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  // For single-slide carousel, each item gets its own dot
  const totalSlides = visibleItems === 1 ? totalItems : Math.ceil(totalItems / visibleItems);

  // Don't show controls if only one slide
  if (totalSlides <= 1) {
    return null;
  }

  const handleDotClick = (index: number) => {
    if (api) {
      api.scrollTo(index);
    }
  };

  return (
    <div className={cn("flex items-center justify-center space-x-2", className)}>
      {Array.from({ length: count }, (_, index) => (
        <button
          key={index}
          onClick={() => handleDotClick(index)}
          className={cn(
            "w-2 h-2 rounded-full transition-all duration-200 hover:scale-125",
            current === index + 1
              ? "bg-bookconnect-terracotta scale-125"
              : "bg-gray-300 hover:bg-gray-400"
          )}
          aria-label={`Go to slide ${index + 1}`}
        />
      ))}
    </div>
  );
};
