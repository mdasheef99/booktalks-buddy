/**
 * Metrics Display Component
 * Display current community metrics with refresh functionality
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, RefreshCw, BarChart3 } from 'lucide-react';
import type { MetricsDisplayProps, MetricCardProps } from '../types/metricsConfigTypes';
import type { CommunityMetrics } from '@/lib/api/store/types/communityShowcaseTypes';
import { useMetricsFormatting } from '../hooks/useMetricsFormatting';
import { 
  METRIC_CARDS, 
  UI_TEXT, 
  CSS_CLASSES, 
  GRID_CONFIGS 
} from '../constants/metricsConfigConstants';

export const MetricsDisplay: React.FC<MetricsDisplayProps> = ({
  metrics,
  onRefresh,
}) => {
  const { formatValue } = useMetricsFormatting();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {UI_TEXT.HEADERS.CURRENT_METRICS}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {UI_TEXT.BUTTONS.REFRESH}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {metrics ? (
          <div className={`grid gap-4 ${GRID_CONFIGS.METRICS}`}>
            {METRIC_CARDS.map((card) => {
              const value = (metrics as any)[card.key] || 0;
              
              return (
                <MetricCard
                  key={card.key}
                  metricKey={card.key}
                  value={value}
                  icon={card.icon}
                  label={card.label}
                  description={card.description}
                  color={card.color}
                />
              );
            })}
          </div>
        ) : (
          <MetricsLoadingState />
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Individual Metric Card Component
 */
export const MetricCard: React.FC<MetricCardProps> = ({
  metricKey,
  value,
  icon: IconComponent,
  label,
  description,
  color,
}) => {
  const { formatValue } = useMetricsFormatting();

  return (
    <div className={CSS_CLASSES.METRIC_CARD}>
      <div className="flex items-center justify-between mb-3">
        <div className={`${CSS_CLASSES.METRIC_ICON_CONTAINER} ${color}`}>
          <IconComponent className="h-5 w-5 text-white" />
        </div>
        <div className="text-right">
          <div className={CSS_CLASSES.METRIC_VALUE}>
            {formatValue(value)}
          </div>
        </div>
      </div>
      <div>
        <h4 className={CSS_CLASSES.METRIC_LABEL}>
          {label}
        </h4>
        <p className={CSS_CLASSES.METRIC_DESCRIPTION}>
          {description}
        </p>
      </div>
    </div>
  );
};

/**
 * Metrics Loading State Component
 */
export const MetricsLoadingState: React.FC = () => {
  return (
    <div className="text-center py-8 text-gray-500">
      <BarChart3 className={`${CSS_CLASSES.EMPTY_STATE_ICON} text-gray-400`} />
      <p>{UI_TEXT.LOADING_STATES.METRICS}</p>
    </div>
  );
};

/**
 * Compact Metrics Display Component
 * Simplified version for smaller spaces
 */
interface CompactMetricsDisplayProps {
  metrics?: CommunityMetrics;
  maxItems?: number;
}

export const CompactMetricsDisplay: React.FC<CompactMetricsDisplayProps> = ({
  metrics,
  maxItems = 3,
}) => {
  const { formatValue } = useMetricsFormatting();

  if (!metrics) {
    return (
      <div className="text-center py-4 text-gray-500">
        <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">Loading metrics...</p>
      </div>
    );
  }

  const displayCards = METRIC_CARDS.slice(0, maxItems);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {displayCards.map((card) => {
        const value = (metrics as any)[card.key] || 0;
        const IconComponent = card.icon;
        
        return (
          <div key={card.key} className="p-3 border rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <div className={`p-1 rounded ${card.color}`}>
                <IconComponent className="h-3 w-3 text-white" />
              </div>
              <span className="text-lg font-bold text-bookconnect-brown">
                {formatValue(value)}
              </span>
            </div>
            <p className="text-xs text-gray-600">{card.label}</p>
          </div>
        );
      })}
    </div>
  );
};
