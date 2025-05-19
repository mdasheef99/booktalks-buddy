import React, { useState, useRef, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SkeletonBookCoverProps {
  /**
   * URL of the image to load
   */
  src?: string | null;
  /**
   * Alt text for the image
   */
  alt: string;
  /**
   * Width of the cover container
   */
  width?: string;
  /**
   * Height of the cover container
   */
  height?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Whether this is a grid view (larger) or list view (smaller)
   */
  viewType?: 'grid' | 'list';
}

/**
 * A component that displays a book cover with a skeleton loading state and blur-up effect
 */
const SkeletonBookCover: React.FC<SkeletonBookCoverProps> = ({
  src,
  alt,
  width = 'w-full',
  height = 'h-48',
  className,
  viewType = 'grid'
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isFirstRender, setIsFirstRender] = useState(true);
  const imageRef = useRef<HTMLImageElement>(null);
  const prevSrcRef = useRef<string | null | undefined>(src);

  // Handle image loading on mount and src changes
  useEffect(() => {
    // Skip the first render to prevent unnecessary flicker
    if (isFirstRender) {
      setIsFirstRender(false);
      return;
    }

    // Only reset states if src actually changed
    if (prevSrcRef.current !== src) {
      setImageLoaded(false);
      setImageError(false);
      prevSrcRef.current = src;
    }

    // Check if the image is already cached
    if (src && imageRef.current?.complete && !imageRef.current?.currentSrc.endsWith('svg')) {
      setImageLoaded(true);
    }
  }, [src, isFirstRender]);

  // If no image or error loading image
  if (!src || imageError) {
    return (
      <div
        className={cn(
          "bg-gray-100 rounded flex items-center justify-center",
          width,
          height,
          className
        )}
      >
        <BookOpen
          className={cn(
            "text-gray-400",
            viewType === 'grid' ? "h-12 w-12" : "h-8 w-8"
          )}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded",
        width,
        height,
        className
      )}
    >
      {/* Static color placeholder - always visible until image loads */}
      <div
        className={cn(
          "absolute inset-0 bg-gray-200",
          imageLoaded ? "opacity-0" : "opacity-100",
          "transition-opacity duration-300"
        )}
      />

      {/* Pulsing effect - separate from the background */}
      {!imageLoaded && (
        <div className="absolute inset-0 bg-white/10 animate-pulse-subtle z-10" />
      )}

      {/* Actual image - preload with opacity 0 */}
      <img
        ref={imageRef}
        src={src}
        alt={alt}
        className={cn(
          "absolute inset-0 w-full h-full object-cover z-20",
          imageLoaded ? "opacity-100" : "opacity-0",
          "transition-opacity duration-500 ease-in-out"
        )}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
};

export default SkeletonBookCover;
