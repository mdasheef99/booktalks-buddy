/**
 * Testimonial List Component
 * List display for testimonials with empty state
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, Plus } from 'lucide-react';
import type { TestimonialListProps } from '../types/testimonialTypes';
import { TestimonialItem } from './TestimonialItem';
import { TestimonialStats } from './TestimonialStats';
import { UI_TEXT } from '../constants/testimonialConstants';

export const TestimonialList: React.FC<TestimonialListProps> = ({
  testimonials,
  onEdit,
  onDelete,
  onApprovalChange,
  onCreateNew,
  isLoading = false,
}) => {
  if (testimonials.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header with Add Button */}
        <div className="flex justify-between items-center">
          <TestimonialStats testimonials={[]} />
          <Button onClick={onCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            {UI_TEXT.BUTTONS.ADD_TESTIMONIAL}
          </Button>
        </div>

        {/* Empty State */}
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageCircle className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {UI_TEXT.EMPTY_STATE.TITLE}
            </h3>
            <p className="text-gray-500 text-center mb-4">
              {UI_TEXT.EMPTY_STATE.DESCRIPTION}
            </p>
            <Button onClick={onCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              {UI_TEXT.BUTTONS.ADD_FIRST_TESTIMONIAL}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <TestimonialStats testimonials={testimonials} />
        <Button onClick={onCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          {UI_TEXT.BUTTONS.ADD_TESTIMONIAL}
        </Button>
      </div>

      {/* Testimonials List */}
      <div className="space-y-4">
        {testimonials.map((testimonial) => (
          <TestimonialItem
            key={testimonial.id}
            testimonial={testimonial}
            onEdit={onEdit}
            onDelete={onDelete}
            onApprovalChange={onApprovalChange}
          />
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="text-gray-500">Loading testimonials...</div>
        </div>
      )}
    </div>
  );
};

/**
 * Compact Testimonial List Component
 * Simplified version for smaller spaces
 */
interface CompactTestimonialListProps {
  testimonials: any[];
  onEdit: (testimonial: any) => void;
  onDelete: (testimonialId: string) => void;
  onCreateNew: () => void;
  maxItems?: number;
}

export const CompactTestimonialList: React.FC<CompactTestimonialListProps> = ({
  testimonials,
  onEdit,
  onDelete,
  onCreateNew,
  maxItems = 5,
}) => {
  const displayTestimonials = testimonials.slice(0, maxItems);
  const hasMore = testimonials.length > maxItems;

  if (testimonials.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <MessageCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500 mb-3">No testimonials yet</p>
          <Button size="sm" onClick={onCreateNew}>
            <Plus className="h-3 w-3 mr-1" />
            Add First
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">
          {testimonials.length} testimonial{testimonials.length !== 1 ? 's' : ''}
        </span>
        <Button size="sm" onClick={onCreateNew}>
          <Plus className="h-3 w-3 mr-1" />
          Add
        </Button>
      </div>

      <div className="space-y-2">
        {displayTestimonials.map((testimonial) => (
          <div
            key={testimonial.id}
            className="p-3 border rounded-lg hover:bg-gray-50 flex justify-between items-start"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 truncate">
                "{testimonial.testimonial_text}"
              </p>
              <p className="text-xs text-gray-500 mt-1">
                — {testimonial.is_anonymous ? 'Anonymous' : testimonial.customer_name}
              </p>
            </div>
            <div className="ml-2 flex space-x-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(testimonial)}
                className="px-2 py-1 h-auto"
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDelete(testimonial.id)}
                className="px-2 py-1 h-auto text-red-600 hover:text-red-700"
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <p className="text-xs text-gray-500 text-center">
          And {testimonials.length - maxItems} more...
        </p>
      )}
    </div>
  );
};
