import React from 'react';
import { CarouselItem } from '@/lib/api/store/carousel';
import { BookCarousel } from '@/components/landing/carousel/BookCarousel';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookOpen, Eye } from 'lucide-react';

interface CarouselPreviewProps {
  items: CarouselItem[];
}

/**
 * Live preview of how the carousel will appear on the landing page
 */
export const CarouselPreview: React.FC<CarouselPreviewProps> = ({ items }) => {
  // Filter to only active items for preview
  const activeItems = items.filter(item => item.is_active);

  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Books Added</h3>
        <p className="text-gray-600 mb-4">
          Add some books to see how your carousel will look
        </p>
      </div>
    );
  }

  if (activeItems.length === 0) {
    return (
      <div className="space-y-4">
        <Alert>
          <Eye className="h-4 w-4" />
          <AlertDescription>
            You have {items.length} book(s) configured, but none are currently active. 
            The carousel will be hidden on your landing page until you activate at least one book.
          </AlertDescription>
        </Alert>
        
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Books</h3>
          <p className="text-gray-600">
            Activate some books to see the carousel preview
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Preview Info */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Live Preview</h3>
          <p className="text-sm text-gray-600">
            Showing {activeItems.length} active book(s) out of {items.length} total
          </p>
        </div>
        
        {items.length !== activeItems.length && (
          <Alert className="max-w-md">
            <Eye className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {items.length - activeItems.length} inactive book(s) are hidden in this preview
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Preview Container */}
      <div className="bg-gradient-to-br from-bookconnect-sage/5 to-bookconnect-cream/10 rounded-lg p-6 border">
        <div className="space-y-6">
          {/* Section Header (as it appears on landing page) */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-bookconnect-terracotta/10 text-bookconnect-terracotta text-sm font-medium mb-4">
              <BookOpen className="h-4 w-4" />
              Featured Books
            </div>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 mb-4">
              Discover Our Favorites
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Handpicked selections from our collection, curated just for you
            </p>
          </div>

          {/* Carousel Preview */}
          <div className="max-w-6xl mx-auto">
            <BookCarousel 
              items={activeItems}
              autoSlide={false} // Disable auto-slide in preview
              onItemClick={(item) => {
                // Show click action in preview
                if (item.click_destination_url) {
                  alert(`Would navigate to: ${item.click_destination_url}`);
                } else {
                  alert('No click action configured for this book');
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Preview Notes */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Preview Notes:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Auto-slide is disabled in this preview</li>
          <li>• Click actions will show an alert instead of navigating</li>
          <li>• Only active books are shown (inactive books are hidden)</li>
          <li>• The carousel appears above the hero section on your landing page</li>
          <li>• Mobile users will see 2-3 books, desktop users will see up to 6</li>
        </ul>
      </div>
    </div>
  );
};
