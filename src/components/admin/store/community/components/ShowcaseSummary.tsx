/**
 * Showcase Summary Component
 * Summary display of enabled community showcase features
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ShowcaseSummaryProps } from '../types/metricsConfigTypes';
import { generateFeatureSummary } from '../utils/metricsConfigUtils';
import { 
  UI_TEXT, 
  CSS_CLASSES, 
  GRID_CONFIGS 
} from '../constants/metricsConfigConstants';

export const ShowcaseSummary: React.FC<ShowcaseSummaryProps> = ({
  settings,
}) => {
  const features = generateFeatureSummary(settings);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{UI_TEXT.HEADERS.SHOWCASE_SUMMARY}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`grid gap-4 text-center ${GRID_CONFIGS.SUMMARY}`}>
          {features.map((feature) => (
            <FeatureSummaryItem
              key={feature.key}
              label={feature.label}
              enabled={feature.enabled}
              icon={feature.icon}
            />
          ))}
        </div>
        
        <ShowcaseTip />
      </CardContent>
    </Card>
  );
};

/**
 * Individual Feature Summary Item Component
 */
interface FeatureSummaryItemProps {
  label: string;
  enabled: boolean;
  icon: '✓' | '✗';
}

export const FeatureSummaryItem: React.FC<FeatureSummaryItemProps> = ({
  label,
  enabled,
  icon,
}) => {
  return (
    <div>
      <div className={CSS_CLASSES.SUMMARY_FEATURE}>
        {icon}
      </div>
      <div className={CSS_CLASSES.SUMMARY_LABEL}>{label}</div>
    </div>
  );
};

/**
 * Showcase Tip Component
 */
export const ShowcaseTip: React.FC = () => {
  return (
    <div className={CSS_CLASSES.TIP_CONTAINER}>
      <p className={CSS_CLASSES.TIP_TEXT}>
        <strong>{UI_TEXT.TIP.TITLE}</strong> {UI_TEXT.TIP.MESSAGE}
      </p>
    </div>
  );
};

/**
 * Compact Showcase Summary Component
 * Simplified version for smaller spaces
 */
interface CompactShowcaseSummaryProps {
  settings: any;
}

export const CompactShowcaseSummary: React.FC<CompactShowcaseSummaryProps> = ({
  settings,
}) => {
  const features = generateFeatureSummary(settings);
  const enabledCount = features.filter(f => f.enabled).length;

  return (
    <div className="p-4 border rounded-lg">
      <div className="text-center mb-3">
        <div className="text-2xl font-bold text-bookconnect-brown">
          {enabledCount}/{features.length}
        </div>
        <div className="text-sm text-gray-600">Features Enabled</div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs">
        {features.map((feature) => (
          <div key={feature.key} className="flex items-center space-x-1">
            <span className={feature.enabled ? 'text-green-600' : 'text-gray-400'}>
              {feature.icon}
            </span>
            <span className={feature.enabled ? 'text-gray-900' : 'text-gray-500'}>
              {feature.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
