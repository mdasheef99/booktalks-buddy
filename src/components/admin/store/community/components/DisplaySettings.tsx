/**
 * Display Settings Component
 * Settings configuration interface for community showcase features
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { BarChart3 } from 'lucide-react';
import type { DisplaySettingsProps, SettingsSectionProps, NumberInputProps } from '../types/metricsConfigTypes';
import { UI_TEXT, CSS_CLASSES, VALIDATION_LIMITS } from '../constants/metricsConfigConstants';

export const DisplaySettings: React.FC<DisplaySettingsProps> = ({
  settings,
  onSettingsUpdate,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {UI_TEXT.HEADERS.DISPLAY_SETTINGS}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Activity Feed Settings */}
        <SettingsSection
          settingKey="show_activity_feed"
          label="Activity Feed"
          description="Show recent community activity on landing page"
          checked={settings.show_activity_feed}
          onToggle={(checked) => onSettingsUpdate({ show_activity_feed: checked })}
        >
          {settings.show_activity_feed && (
            <div className={CSS_CLASSES.SUB_SETTINGS}>
              <NumberInput
                label="Number of activities to display"
                value={settings.activity_feed_limit}
                min={VALIDATION_LIMITS.ACTIVITY_FEED_MIN}
                max={VALIDATION_LIMITS.ACTIVITY_FEED_MAX}
                onChange={(value) => onSettingsUpdate({ activity_feed_limit: value })}
                className="w-24"
              />
            </div>
          )}
        </SettingsSection>

        {/* Community Metrics Settings */}
        <SettingsSection
          settingKey="show_community_metrics"
          label="Community Metrics"
          description="Display community statistics and growth"
          checked={settings.show_community_metrics}
          onToggle={(checked) => onSettingsUpdate({ show_community_metrics: checked })}
        />

        {/* Member Spotlights Settings */}
        <SettingsSection
          settingKey="show_member_spotlights"
          label="Member Spotlights"
          description="Feature active community members"
          checked={settings.show_member_spotlights}
          onToggle={(checked) => onSettingsUpdate({ show_member_spotlights: checked })}
        >
          {settings.show_member_spotlights && (
            <div className={CSS_CLASSES.SUB_SETTINGS}>
              <NumberInput
                label="Maximum spotlights to display"
                value={settings.max_spotlights_display}
                min={VALIDATION_LIMITS.SPOTLIGHTS_MIN}
                max={VALIDATION_LIMITS.SPOTLIGHTS_MAX}
                onChange={(value) => onSettingsUpdate({ max_spotlights_display: value })}
                className="w-24"
              />
            </div>
          )}
        </SettingsSection>
      </CardContent>
    </Card>
  );
};

/**
 * Settings Section Component
 * Individual setting with toggle and optional sub-settings
 */
export const SettingsSection: React.FC<SettingsSectionProps> = ({
  settingKey,
  label,
  description,
  checked,
  onToggle,
  children,
}) => {
  return (
    <div className={CSS_CLASSES.SETTINGS_SECTION}>
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-medium">{label}</Label>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        <Switch
          checked={checked}
          onCheckedChange={onToggle}
        />
      </div>
      {children}
    </div>
  );
};

/**
 * Number Input Component
 * Controlled number input with validation
 */
export const NumberInput: React.FC<NumberInputProps> = ({
  label,
  value,
  min,
  max,
  onChange,
  className = '',
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value) || min;
    const clampedValue = Math.max(min, Math.min(max, newValue));
    onChange(clampedValue);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={handleChange}
        className={className}
      />
    </div>
  );
};
