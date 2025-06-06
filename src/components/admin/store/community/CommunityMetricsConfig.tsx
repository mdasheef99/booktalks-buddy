/**
 * Community Metrics Config Component
 * Refactored main component using focused sub-components and custom hooks
 */

import React from 'react';
import type { CommunityMetricsConfigProps } from './types/metricsConfigTypes';
import { DisplaySettings } from './components/DisplaySettings';
import { MetricsDisplay } from './components/MetricsDisplay';
import { ActivityPreview } from './components/ActivityPreview';
import { ShowcaseSummary } from './components/ShowcaseSummary';

export const CommunityMetricsConfig: React.FC<CommunityMetricsConfigProps> = ({
  metrics,
  activities,
  settings,
  onSettingsUpdate,
  onRefresh
}) => {

  return (
    <div className="space-y-6">
      {/* Display Settings */}
      <DisplaySettings
        settings={settings}
        onSettingsUpdate={onSettingsUpdate}
      />

      {/* Current Metrics Display */}
      <MetricsDisplay
        metrics={metrics}
        onRefresh={onRefresh}
      />

      {/* Recent Activity Preview */}
      <ActivityPreview
        activities={activities}
        settings={settings}
      />

      {/* Community Showcase Summary */}
      <ShowcaseSummary
        settings={settings}
      />
    </div>
  );
};
