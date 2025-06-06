import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  CONTENT_TYPE_OPTIONS,
  FORM_FIELD_LIMITS,
  BannerBasicInfoFormProps
} from '../utils';

/**
 * Form component for banner basic information
 * Handles title, subtitle, and content type selection
 */
export const BannerBasicInfoForm: React.FC<BannerBasicInfoFormProps> = ({
  formData,
  errors,
  onUpdate
}) => {
  return (
    <div className="space-y-4">
      {/* Title and Subtitle Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Banner Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Enter banner title"
            maxLength={FORM_FIELD_LIMITS.TITLE_MAX_LENGTH}
          />
          {errors.title && (
            <p className="text-sm text-red-600">{errors.title}</p>
          )}
        </div>

        {/* Subtitle */}
        <div className="space-y-2">
          <Label htmlFor="subtitle">Subtitle (optional)</Label>
          <Input
            id="subtitle"
            value={formData.subtitle}
            onChange={(e) => onUpdate({ subtitle: e.target.value })}
            placeholder="Enter subtitle"
            maxLength={FORM_FIELD_LIMITS.SUBTITLE_MAX_LENGTH}
          />
          {errors.subtitle && (
            <p className="text-sm text-red-600">{errors.subtitle}</p>
          )}
        </div>
      </div>

      {/* Content Type */}
      <div className="space-y-2">
        <Label htmlFor="content_type">Content Type *</Label>
        <Select
          value={formData.content_type}
          onValueChange={(value: any) => onUpdate({ content_type: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CONTENT_TYPE_OPTIONS.map(option => {
              const Icon = option.icon;
              return (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {option.label}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
