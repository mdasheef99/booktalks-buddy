import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { BookSettingsFormProps } from '../types/bookFormTypes';

/**
 * Form component for book settings and configuration
 * Handles click destination URL, active status, and image alt text
 */
export const BookSettingsForm: React.FC<BookSettingsFormProps> = ({
  formData,
  errors,
  imageUrl,
  onUpdate
}) => {
  return (
    <>
      {/* Image Alt Text (only when image is present) */}
      {imageUrl && (
        <div className="space-y-2">
          <Label htmlFor="book_image_alt">Image Alt Text</Label>
          <Input
            id="book_image_alt"
            value={formData.book_image_alt}
            onChange={(e) => onUpdate({ book_image_alt: e.target.value })}
            placeholder="Describe the image for accessibility"
            maxLength={200}
          />
          {errors.book_image_alt && (
            <p className="text-sm text-red-600">{errors.book_image_alt}</p>
          )}
        </div>
      )}

      {/* Click Destination URL */}
      <div className="space-y-2">
        <Label htmlFor="click_destination_url">Click Destination URL (optional)</Label>
        <Input
          id="click_destination_url"
          type="url"
          value={formData.click_destination_url}
          onChange={(e) => onUpdate({ click_destination_url: e.target.value })}
          placeholder="https://example.com/book-page"
        />
        {errors.click_destination_url && (
          <p className="text-sm text-red-600">{errors.click_destination_url}</p>
        )}
      </div>

      {/* Active Status */}
      <div className="flex items-center space-x-2">
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => onUpdate({ is_active: checked })}
        />
        <Label htmlFor="is_active">
          Active (visible on landing page)
        </Label>
      </div>
    </>
  );
};
