import React from 'react';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  FORM_FIELD_LIMITS,
  IMAGE_UPLOAD_CONFIG,
  shouldShowImageUpload,
  shouldShowTextContent,
  BannerContentFormProps
} from '../utils';

/**
 * Form component for banner content
 * Handles text content, image upload, and image alt text
 */
export const BannerContentForm: React.FC<BannerContentFormProps> = ({
  formData,
  errors,
  imageUrl,
  storeId,
  onUpdate,
  onImageUploadComplete,
  onImageUploadError
}) => {
  return (
    <div className="space-y-4">
      {/* Text Content (for text and mixed types) */}
      {shouldShowTextContent(formData.content_type) && (
        <div className="space-y-2">
          <Label htmlFor="text_content">Text Content</Label>
          <Textarea
            id="text_content"
            value={formData.text_content}
            onChange={(e) => onUpdate({ text_content: e.target.value })}
            placeholder="Enter banner text content"
            maxLength={FORM_FIELD_LIMITS.TEXT_CONTENT_MAX_LENGTH}
            rows={3}
          />
          <p className="text-xs text-gray-500">
            {formData.text_content.length}/{FORM_FIELD_LIMITS.TEXT_CONTENT_MAX_LENGTH} characters
          </p>
          {errors.text_content && (
            <p className="text-sm text-red-600">{errors.text_content}</p>
          )}
        </div>
      )}

      {/* Banner Image (for image and mixed types) */}
      {shouldShowImageUpload(formData.content_type) && (
        <div className="space-y-2">
          <Label>Banner Image</Label>
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
            placeholder={`Upload banner image (recommended: ${IMAGE_UPLOAD_CONFIG.RECOMMENDED_DIMENSIONS})`}
          />
          {errors.banner_image && (
            <p className="text-sm text-red-600">{errors.banner_image}</p>
          )}
        </div>
      )}

      {/* Image Alt Text */}
      {imageUrl && (
        <div className="space-y-2">
          <Label htmlFor="banner_image_alt">Image Alt Text</Label>
          <Input
            id="banner_image_alt"
            value={formData.banner_image_alt}
            onChange={(e) => onUpdate({ banner_image_alt: e.target.value })}
            placeholder="Describe the image for accessibility"
            maxLength={FORM_FIELD_LIMITS.IMAGE_ALT_MAX_LENGTH}
          />
        </div>
      )}

      {/* Call to Action */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cta_text">CTA Button Text (optional)</Label>
          <Input
            id="cta_text"
            value={formData.cta_text}
            onChange={(e) => onUpdate({ cta_text: e.target.value })}
            placeholder="e.g., Shop Now, Learn More"
            maxLength={FORM_FIELD_LIMITS.CTA_TEXT_MAX_LENGTH}
          />
          {errors.cta_text && (
            <p className="text-sm text-red-600">{errors.cta_text}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cta_url">CTA URL (optional)</Label>
          <Input
            id="cta_url"
            type="url"
            value={formData.cta_url}
            onChange={(e) => onUpdate({ cta_url: e.target.value })}
            placeholder="https://example.com"
          />
          {errors.cta_url && (
            <p className="text-sm text-red-600">{errors.cta_url}</p>
          )}
        </div>
      </div>
    </div>
  );
};
