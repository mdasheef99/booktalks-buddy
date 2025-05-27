import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Testimonial } from '@/lib/api/store/communityShowcase';

interface TestimonialCarouselProps {
  testimonials: Testimonial[];
}

const SOURCE_TYPE_LABELS = {
  manual: 'Customer Review',
  review_import: 'Imported Review',
  survey: 'Survey Response',
  social_media: 'Social Media'
};

export const TestimonialCarousel: React.FC<TestimonialCarouselProps> = ({ testimonials }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-rotate testimonials every 8 seconds
  useEffect(() => {
    if (testimonials.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % testimonials.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [testimonials.length]);

  const goToPrevious = () => {
    setCurrentIndex(prev => 
      prev === 0 ? testimonials.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex(prev => (prev + 1) % testimonials.length);
  };

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    
    return (
      <div className="flex items-center space-x-1 mb-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating 
                ? 'text-yellow-400 fill-current' 
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-bookconnect-brown/60 ml-2">
          {rating}/5
        </span>
      </div>
    );
  };

  if (testimonials.length === 0) {
    return (
      <div className="text-center py-8 text-bookconnect-brown/60">
        <Quote className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <p>No testimonials available</p>
      </div>
    );
  }

  const currentTestimonial = testimonials[currentIndex];

  return (
    <div className="relative">
      {/* Main Testimonial Display */}
      <div className="bg-gradient-to-br from-bookconnect-sage/10 to-bookconnect-cream/20 rounded-lg p-6 min-h-[200px] flex flex-col justify-between">
        {/* Quote Icon */}
        <div className="flex justify-center mb-4">
          <Quote className="h-8 w-8 text-bookconnect-terracotta/40" />
        </div>

        {/* Rating */}
        {currentTestimonial.rating && (
          <div className="flex justify-center">
            {renderStars(currentTestimonial.rating)}
          </div>
        )}

        {/* Testimonial Text */}
        <div className="flex-1 flex items-center justify-center">
          <blockquote className="text-center">
            <p className="text-lg font-medium text-bookconnect-brown leading-relaxed italic">
              "{currentTestimonial.testimonial_text}"
            </p>
          </blockquote>
        </div>

        {/* Attribution */}
        <div className="text-center mt-4 pt-4 border-t border-bookconnect-sage/20">
          <div className="flex items-center justify-center space-x-2">
            {!currentTestimonial.is_anonymous && currentTestimonial.customer_name && (
              <span className="font-medium text-bookconnect-brown">
                — {currentTestimonial.customer_name}
              </span>
            )}
            {currentTestimonial.is_anonymous && (
              <span className="font-medium text-bookconnect-brown/70">
                — Anonymous Customer
              </span>
            )}
            
            {currentTestimonial.is_featured && (
              <Badge variant="secondary" className="bg-bookconnect-terracotta/10 text-bookconnect-terracotta text-xs">
                Featured
              </Badge>
            )}
          </div>
          
          {/* Source Type */}
          <div className="mt-1">
            <Badge variant="outline" className="text-xs">
              {SOURCE_TYPE_LABELS[currentTestimonial.source_type]}
            </Badge>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      {testimonials.length > 1 && (
        <>
          {/* Previous/Next Buttons */}
          <div className="flex justify-between items-center mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevious}
              className="flex items-center space-x-1 hover:bg-bookconnect-sage/10"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>

            {/* Dots Indicator */}
            <div className="flex space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    index === currentIndex
                      ? 'bg-bookconnect-terracotta w-6'
                      : 'bg-bookconnect-brown/30 hover:bg-bookconnect-brown/50'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={goToNext}
              className="flex items-center space-x-1 hover:bg-bookconnect-sage/10"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Counter */}
          <div className="text-center mt-2 text-sm text-bookconnect-brown/60">
            {currentIndex + 1} of {testimonials.length}
          </div>
        </>
      )}
    </div>
  );
};
