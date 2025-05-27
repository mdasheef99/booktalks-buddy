/**
 * Testimonial Item Component
 * Individual testimonial display card
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import type { TestimonialItemProps } from '../types/testimonialTypes';
import { TestimonialActions } from './TestimonialActions';
import { 
  APPROVAL_STATUS_COLORS, 
  CSS_CLASSES 
} from '../constants/testimonialConstants';
import { 
  getCustomerDisplayName, 
  formatTestimonialDate, 
  getSourceTypeLabel,
  hasSourceUrl
} from '../utils/testimonialUtils';

export const TestimonialItem: React.FC<TestimonialItemProps> = ({
  testimonial,
  onEdit,
  onDelete,
  onApprovalChange,
}) => {
  const renderStars = (rating?: number) => {
    if (!rating) return null;
    
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating 
                ? CSS_CLASSES.STAR_FILLED
                : CSS_CLASSES.STAR_EMPTY
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge className={APPROVAL_STATUS_COLORS[testimonial.approval_status]}>
                  {testimonial.approval_status}
                </Badge>
                {testimonial.is_featured && (
                  <Badge variant="secondary" className={CSS_CLASSES.FEATURED_BADGE}>
                    Featured
                  </Badge>
                )}
                <Badge variant="outline">
                  {getSourceTypeLabel(testimonial.source_type)}
                </Badge>
              </div>
              {testimonial.rating && renderStars(testimonial.rating)}
            </div>

            {/* Testimonial Text */}
            <blockquote className="text-gray-900 italic leading-relaxed">
              "{testimonial.testimonial_text}"
            </blockquote>

            {/* Attribution */}
            <div className="text-sm text-gray-600">
              — {getCustomerDisplayName(testimonial)}
            </div>

            {/* Metadata */}
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>Order: {testimonial.display_order}</span>
              <span>Created: {formatTestimonialDate(testimonial.created_at)}</span>
              {hasSourceUrl(testimonial) && (
                <a 
                  href={testimonial.source_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={CSS_CLASSES.SOURCE_LINK}
                >
                  View Source
                </a>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="ml-4">
            <TestimonialActions
              testimonial={testimonial}
              onEdit={onEdit}
              onDelete={onDelete}
              onApprovalChange={onApprovalChange}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Compact Testimonial Item Component
 * Simplified version for lists
 */
interface CompactTestimonialItemProps {
  testimonial: any;
  onEdit: (testimonial: any) => void;
  onDelete: (testimonialId: string) => void;
  onApprovalChange?: (testimonialId: string, status: 'approved' | 'rejected') => void;
}

export const CompactTestimonialItem: React.FC<CompactTestimonialItemProps> = ({
  testimonial,
  onEdit,
  onDelete,
  onApprovalChange,
}) => {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-2">
          <Badge className={APPROVAL_STATUS_COLORS[testimonial.approval_status]} size="sm">
            {testimonial.approval_status}
          </Badge>
          {testimonial.is_featured && (
            <Badge variant="secondary" size="sm">Featured</Badge>
          )}
        </div>
        <p className="text-sm text-gray-900 truncate">
          "{testimonial.testimonial_text}"
        </p>
        <p className="text-xs text-gray-500 mt-1">
          — {getCustomerDisplayName(testimonial)}
        </p>
      </div>
      
      <div className="ml-4">
        <TestimonialActions
          testimonial={testimonial}
          onEdit={onEdit}
          onDelete={onDelete}
          onApprovalChange={onApprovalChange || (() => {})}
        />
      </div>
    </div>
  );
};
