import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, ExternalLink } from 'lucide-react';
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

interface BookCardProps {
  item: CarouselItem;
  onClick?: () => void;
  className?: string;
}

const badgeConfig = {
  new_arrival: { label: 'New Arrival', variant: 'default' as const, color: 'bg-green-500' },
  staff_pick: { label: 'Staff Pick', variant: 'secondary' as const, color: 'bg-bookconnect-terracotta' },
  bestseller: { label: 'Bestseller', variant: 'destructive' as const, color: 'bg-red-500' },
  on_sale: { label: 'On Sale', variant: 'outline' as const, color: 'bg-orange-500' },
  featured: { label: 'Featured', variant: 'default' as const, color: 'bg-bookconnect-sage' },
  none: null
};

/**
 * Individual book card component for full-width single-slide carousel display
 * Features:
 * - Full-width book cover image with fallback
 * - Title and author information
 * - Featured badges
 * - Overlay text support
 * - Click handling for external links
 * - Hover effects and animations
 * - Immersive full-screen book showcase experience
 */
export const BookCard: React.FC<BookCardProps> = ({
  item,
  onClick,
  className
}) => {
  const badgeInfo = item.featured_badge && item.featured_badge !== 'none' 
    ? badgeConfig[item.featured_badge] 
    : null;

  const hasClickAction = item.click_destination_url || onClick;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:shadow-lg border-0 bg-white/80 backdrop-blur-sm w-full",
        hasClickAction && "cursor-pointer hover:scale-[1.02]",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-0">
        {/* Full-width layout: Mobile vertical, Desktop horizontal */}
        <div className="flex flex-col md:flex-row md:min-h-[400px] lg:min-h-[500px]">
          {/* Book Cover Container */}
          <div className="relative aspect-[3/4] md:aspect-[3/4] md:w-1/3 lg:w-2/5 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0">
            {item.book_image_url ? (
              <img
                src={item.book_image_url}
                alt={item.book_image_alt || `Cover of ${item.book_title}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                loading="lazy"
              />
            ) : (
              // Fallback book cover
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-bookconnect-sage/20 to-bookconnect-cream/40">
                <BookOpen className="h-16 w-16 md:h-20 md:w-20 lg:h-24 lg:w-24 text-bookconnect-sage/60" />
              </div>
            )}

            {/* Featured Badge */}
            {badgeInfo && (
              <Badge
                variant={badgeInfo.variant}
                className={cn(
                  "absolute top-3 left-3 text-sm font-medium shadow-sm z-10",
                  badgeInfo.color && `${badgeInfo.color} text-white border-0`
                )}
              >
                {badgeInfo.label}
              </Badge>
            )}

            {/* External Link Indicator */}
            {item.click_destination_url && (
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                <div className="bg-white/90 rounded-full p-2 shadow-sm">
                  <ExternalLink className="h-4 w-4 text-gray-600" />
                </div>
              </div>
            )}

            {/* Overlay Text */}
            {item.overlay_text && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <p className="text-white text-base font-medium leading-tight">
                  {item.overlay_text}
                </p>
              </div>
            )}

            {/* Hover Overlay */}
            {hasClickAction && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
            )}
          </div>

          {/* Book Information */}
          <div className="flex-1 p-6 md:p-8 lg:p-12 flex flex-col justify-center space-y-4 md:space-y-6">
            <div className="space-y-3 md:space-y-4">
              <h3 className="font-bold text-gray-900 text-xl md:text-2xl lg:text-3xl xl:text-4xl leading-tight line-clamp-3 group-hover:text-bookconnect-terracotta transition-colors duration-200">
                {item.book_title}
              </h3>

              <p className="text-gray-600 text-lg md:text-xl lg:text-2xl font-medium line-clamp-2">
                by {item.book_author}
              </p>
            </div>

            {/* Custom Description */}
            {item.custom_description && (
              <p className="text-gray-500 text-base md:text-lg lg:text-xl leading-relaxed line-clamp-4 md:line-clamp-5 lg:line-clamp-6">
                {item.custom_description}
              </p>
            )}

            {/* ISBN (if available) */}
            {item.book_isbn && (
              <p className="text-gray-400 text-sm md:text-base font-mono mt-auto">
                ISBN: {item.book_isbn}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
