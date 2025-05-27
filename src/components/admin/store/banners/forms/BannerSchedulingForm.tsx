import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  BannerSchedulingFormProps
} from '../utils';

/**
 * Form component for banner scheduling and settings
 * Handles start/end dates, priority order, and active status
 */
export const BannerSchedulingForm: React.FC<BannerSchedulingFormProps> = ({
  formData,
  errors,
  editingBanner,
  onUpdate
}) => {
  return (
    <div className="space-y-4">
      {/* Scheduling */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date">Start Date (optional)</Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={(e) => onUpdate({ start_date: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_date">End Date (optional)</Label>
          <Input
            id="end_date"
            type="date"
            value={formData.end_date}
            onChange={(e) => onUpdate({ end_date: e.target.value })}
          />
          {errors.end_date && (
            <p className="text-sm text-red-600">{errors.end_date}</p>
          )}
        </div>
      </div>

      {/* Priority Order (only for new banners) */}
      {!editingBanner && (
        <div className="space-y-2">
          <Label htmlFor="priority_order">Priority Order (optional)</Label>
          <Input
            id="priority_order"
            type="number"
            min="1"
            value={formData.priority_order}
            onChange={(e) => onUpdate({ priority_order: e.target.value })}
            placeholder="Leave empty for automatic ordering"
          />
          {errors.priority_order && (
            <p className="text-sm text-red-600">{errors.priority_order}</p>
          )}
        </div>
      )}

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
    </div>
  );
};
