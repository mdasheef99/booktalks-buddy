import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { BookContentFormProps } from '../types/bookFormTypes';
import {
  FEATURED_BADGE_OPTIONS,
  IMAGE_UPLOAD_CONFIG,
  getDescriptionCharacterCount
} from '../utils';

/**
 * Form component for book content and media
 * Handles description, featured badge, overlay text, and image upload
 */
export const BookContentForm: React.FC<BookContentFormProps> = ({
  formData,
  errors,
  imageUrl,
  storeId,
  onUpdate,
  onImageUploadComplete,
  onImageUploadError
}) => {
  return (
    <>
      {/* Custom Description */}
      <div className="space-y-2">
        <Label htmlFor="custom_description">Custom Description (optional)</Label>
        <Textarea
          id="custom_description"
          value={formData.custom_description}
          onChange={(e) => onUpdate({ custom_description: e.target.value })}
          placeholder="Add a custom description for this book"
          maxLength={300}
          rows={3}
        />
        <p className="text-xs text-gray-500">
          {getDescriptionCharacterCount(formData.custom_description)}
        </p>
        {errors.custom_description && (
          <p className="text-sm text-red-600">{errors.custom_description}</p>
        )}
      </div>

      {/* Featured Badge */}
      <div className="space-y-2">
        <Label htmlFor="featured_badge">Featured Badge</Label>
        <Select
          value={formData.featured_badge}
          onValueChange={(value: any) => onUpdate({ featured_badge: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FEATURED_BADGE_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Overlay Text */}
      <div className="space-y-2">
        <Label htmlFor="overlay_text">Overlay Text (optional)</Label>
        <Input
          id="overlay_text"
          value={formData.overlay_text}
          onChange={(e) => onUpdate({ overlay_text: e.target.value })}
          placeholder="Text to display over the book cover"
          maxLength={100}
        />
        {errors.overlay_text && (
          <p className="text-sm text-red-600">{errors.overlay_text}</p>
        )}
      </div>

      {/* Book Cover Image */}
      <div className="space-y-2">
        <Label>Book Cover Image</Label>
        <ImageUpload
          onUploadComplete={onImageUploadComplete}
          onUploadError={onImageUploadError}
          uploadOptions={{
            bucket: IMAGE_UPLOAD_CONFIG.BUCKET,
            folder: storeId,
            maxSizeBytes: IMAGE_UPLOAD_CONFIG.MAX_SIZE_BYTES,
            allowedTypes: IMAGE_UPLOAD_CONFIG.ALLOWED_TYPES
          }}
          currentImageUrl={imageUrl || undefined}
          placeholder="Upload book cover image"
        />
      </div>
    </>
  );
};
