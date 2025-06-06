/**
 * Testimonial Form Component
 * Form for creating and editing testimonials
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Star } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { TestimonialFormProps } from '../types/testimonialTypes';
import { 
  SOURCE_TYPES, 
  VALIDATION_LIMITS, 
  UI_TEXT, 
  RATING_OPTIONS 
} from '../constants/testimonialConstants';

export const TestimonialForm: React.FC<TestimonialFormProps> = ({
  formData,
  onFormDataChange,
  isEditing,
  isLoading,
  onSubmit,
  onCancel,
}) => {
  const updateField = <K extends keyof typeof formData>(field: K, value: typeof formData[K]) => {
    onFormDataChange({ ...formData, [field]: value });
  };

  const renderStarRating = (rating: number) => (
    <div className="flex items-center space-x-2">
      <span>{rating}</span>
      <div className="flex">
        {RATING_OPTIONS.map(star => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= rating 
                ? 'text-yellow-400 fill-current' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Anonymous Toggle */}
      <div className="flex items-center space-x-2">
        <Switch
          id="is_anonymous"
          checked={formData.is_anonymous}
          onCheckedChange={(checked) => updateField('is_anonymous', checked)}
        />
        <Label htmlFor="is_anonymous">{UI_TEXT.LABELS.ANONYMOUS_TESTIMONIAL}</Label>
      </div>

      {/* Customer Name */}
      {!formData.is_anonymous && (
        <div className="space-y-2">
          <Label>{UI_TEXT.LABELS.CUSTOMER_NAME} *</Label>
          <Input
            value={formData.customer_name}
            onChange={(e) => updateField('customer_name', e.target.value)}
            placeholder={UI_TEXT.PLACEHOLDERS.CUSTOMER_NAME}
            maxLength={VALIDATION_LIMITS.CUSTOMER_NAME_MAX_LENGTH}
          />
        </div>
      )}

      {/* Testimonial Text */}
      <div className="space-y-2">
        <Label>{UI_TEXT.LABELS.TESTIMONIAL_TEXT} *</Label>
        <Textarea
          value={formData.testimonial_text}
          onChange={(e) => updateField('testimonial_text', e.target.value)}
          placeholder={UI_TEXT.PLACEHOLDERS.TESTIMONIAL_TEXT}
          className="min-h-[120px]"
          maxLength={VALIDATION_LIMITS.TESTIMONIAL_TEXT_MAX_LENGTH}
        />
        <div className="text-sm text-gray-500 text-right">
          {formData.testimonial_text.length}/{VALIDATION_LIMITS.TESTIMONIAL_TEXT_MAX_LENGTH} characters
        </div>
      </div>

      {/* Rating */}
      <div className="space-y-2">
        <Label>{UI_TEXT.LABELS.RATING}</Label>
        <Select
          value={formData.rating?.toString() || ''}
          onValueChange={(value) => updateField('rating', value ? parseInt(value) : undefined)}
        >
          <SelectTrigger>
            <SelectValue placeholder={UI_TEXT.PLACEHOLDERS.RATING} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">No rating</SelectItem>
            {RATING_OPTIONS.map(rating => (
              <SelectItem key={rating} value={rating.toString()}>
                {renderStarRating(rating)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Source Type */}
      <div className="space-y-2">
        <Label>{UI_TEXT.LABELS.SOURCE_TYPE}</Label>
        <Select
          value={formData.source_type}
          onValueChange={(value: any) => updateField('source_type', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SOURCE_TYPES.map(type => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Source URL */}
      <div className="space-y-2">
        <Label>{UI_TEXT.LABELS.SOURCE_URL}</Label>
        <Input
          value={formData.source_url}
          onChange={(e) => updateField('source_url', e.target.value)}
          placeholder={UI_TEXT.PLACEHOLDERS.SOURCE_URL}
          type="url"
        />
      </div>

      {/* Featured Toggle */}
      <div className="flex items-center space-x-2">
        <Switch
          id="is_featured"
          checked={formData.is_featured}
          onCheckedChange={(checked) => updateField('is_featured', checked)}
        />
        <Label htmlFor="is_featured">{UI_TEXT.LABELS.FEATURED_TESTIMONIAL}</Label>
      </div>
    </div>
  );
};

/**
 * Testimonial Form Dialog Component
 */
interface TestimonialFormDialogProps extends TestimonialFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TestimonialFormDialog: React.FC<TestimonialFormDialogProps> = ({
  isOpen,
  onClose,
  isEditing,
  isLoading,
  onSubmit,
  ...formProps
}) => {
  const handleSubmit = () => {
    onSubmit();
  };

  const isSubmitDisabled = isLoading || !formProps.formData.testimonial_text.trim();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? UI_TEXT.DIALOG_TITLES.EDIT : UI_TEXT.DIALOG_TITLES.CREATE}
          </DialogTitle>
          <DialogDescription>
            {UI_TEXT.DIALOG_DESCRIPTIONS.CREATE}
          </DialogDescription>
        </DialogHeader>

        <TestimonialForm
          {...formProps}
          isEditing={isEditing}
          isLoading={isLoading}
          onSubmit={onSubmit}
          onCancel={onClose}
        />

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {UI_TEXT.BUTTONS.CANCEL}
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
          >
            {isLoading ? UI_TEXT.BUTTONS.SAVING : 
             isEditing ? UI_TEXT.BUTTONS.UPDATE_TESTIMONIAL : UI_TEXT.BUTTONS.CREATE_TESTIMONIAL}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
