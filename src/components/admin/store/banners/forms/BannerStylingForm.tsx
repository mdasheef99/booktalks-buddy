import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ANIMATION_OPTIONS,
  BannerStylingFormProps
} from '../utils';

/**
 * Form component for banner styling options
 * Handles background color, text color, and animation settings
 */
export const BannerStylingForm: React.FC<BannerStylingFormProps> = ({
  formData,
  errors,
  onUpdate
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Background Color */}
        <div className="space-y-2">
          <Label htmlFor="background_color">Background Color</Label>
          <div className="flex gap-2">
            <Input
              id="background_color"
              type="color"
              value={formData.background_color}
              onChange={(e) => onUpdate({ background_color: e.target.value })}
              className="w-16 h-10 p-1 border rounded"
            />
            <Input
              value={formData.background_color}
              onChange={(e) => onUpdate({ background_color: e.target.value })}
              placeholder="#ffffff"
              className="flex-1"
            />
          </div>
        </div>

        {/* Text Color */}
        <div className="space-y-2">
          <Label htmlFor="text_color">Text Color</Label>
          <div className="flex gap-2">
            <Input
              id="text_color"
              type="color"
              value={formData.text_color}
              onChange={(e) => onUpdate({ text_color: e.target.value })}
              className="w-16 h-10 p-1 border rounded"
            />
            <Input
              value={formData.text_color}
              onChange={(e) => onUpdate({ text_color: e.target.value })}
              placeholder="#000000"
              className="flex-1"
            />
          </div>
        </div>

        {/* Animation */}
        <div className="space-y-2">
          <Label htmlFor="animation_type">Animation</Label>
          <Select
            value={formData.animation_type}
            onValueChange={(value: any) => onUpdate({ animation_type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ANIMATION_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
