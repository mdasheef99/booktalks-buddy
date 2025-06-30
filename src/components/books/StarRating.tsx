/**
 * Star Rating Component
 * 
 * Interactive star rating component for book reviews
 * Follows BookConnect design system patterns
 */

import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating?: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating = 0,
  onRatingChange,
  readonly = false,
  size = 'md',
  showLabel = false,
  className
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const handleStarClick = (starRating: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(starRating);
    }
  };

  const handleStarHover = (starRating: number) => {
    if (!readonly) {
      setHoverRating(starRating);
      setIsHovering(true);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setIsHovering(false);
      setHoverRating(0);
    }
  };

  const displayRating = isHovering ? hoverRating : rating;

  const getRatingLabel = (rating: number): string => {
    const labels = {
      1: 'Poor',
      2: 'Fair',
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent'
    };
    return labels[rating as keyof typeof labels] || '';
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div 
        className="flex items-center gap-1"
        onMouseLeave={handleMouseLeave}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= displayRating;
          const isInteractive = !readonly && onRatingChange;
          
          return (
            <button
              key={star}
              type="button"
              disabled={readonly}
              className={cn(
                'transition-all duration-200',
                isInteractive && 'hover:scale-110 cursor-pointer',
                readonly && 'cursor-default'
              )}
              onClick={() => handleStarClick(star)}
              onMouseEnter={() => handleStarHover(star)}
              aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  'transition-colors duration-200',
                  isFilled 
                    ? 'fill-bookconnect-terracotta text-bookconnect-terracotta' 
                    : 'text-bookconnect-brown/30 hover:text-bookconnect-terracotta/50'
                )}
              />
            </button>
          );
        })}
      </div>

      {showLabel && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-bookconnect-brown">
            {displayRating > 0 ? displayRating : '—'}
          </span>
          {displayRating > 0 && (
            <span className="text-sm text-bookconnect-brown/70">
              {getRatingLabel(displayRating)}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default StarRating;
