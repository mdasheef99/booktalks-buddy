/**
 * Testimonial Actions Component
 * Action buttons for testimonial management
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Edit, 
  Trash2, 
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import type { TestimonialActionsProps } from '../types/testimonialTypes';
import { CSS_CLASSES } from '../constants/testimonialConstants';
import { canChangeApproval } from '../utils/testimonialUtils';

export const TestimonialActions: React.FC<TestimonialActionsProps> = ({
  testimonial,
  onEdit,
  onDelete,
  onApprovalChange,
}) => {
  const showApprovalButtons = canChangeApproval(testimonial);

  return (
    <div className="flex items-center space-x-2">
      {/* Approval Buttons - Only for pending testimonials */}
      {showApprovalButtons && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onApprovalChange(testimonial.id, 'approved')}
            className={CSS_CLASSES.APPROVAL_BUTTON_APPROVE}
            title="Approve testimonial"
          >
            <ThumbsUp className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onApprovalChange(testimonial.id, 'rejected')}
            className={CSS_CLASSES.APPROVAL_BUTTON_REJECT}
            title="Reject testimonial"
          >
            <ThumbsDown className="h-4 w-4" />
          </Button>
        </>
      )}

      {/* Edit Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onEdit(testimonial)}
        title="Edit testimonial"
      >
        <Edit className="h-4 w-4" />
      </Button>

      {/* Delete Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onDelete(testimonial.id)}
        className={CSS_CLASSES.DELETE_BUTTON}
        title="Delete testimonial"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

/**
 * Compact Testimonial Actions Component
 * Simplified version with fewer buttons
 */
interface CompactTestimonialActionsProps {
  testimonial: any;
  onEdit: (testimonial: any) => void;
  onDelete: (testimonialId: string) => void;
  showApproval?: boolean;
  onApprovalChange?: (testimonialId: string, status: 'approved' | 'rejected') => void;
}

export const CompactTestimonialActions: React.FC<CompactTestimonialActionsProps> = ({
  testimonial,
  onEdit,
  onDelete,
  showApproval = false,
  onApprovalChange,
}) => {
  return (
    <div className="flex items-center space-x-1">
      {showApproval && onApprovalChange && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onApprovalChange(testimonial.id, 'approved')}
          className="text-green-600 hover:text-green-700 px-2"
        >
          <ThumbsUp className="h-3 w-3" />
        </Button>
      )}
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onEdit(testimonial)}
        className="px-2"
      >
        <Edit className="h-3 w-3" />
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onDelete(testimonial.id)}
        className="text-red-600 hover:text-red-700 px-2"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
};
