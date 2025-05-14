import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { StatsCardProps, TrendDirection } from '../types';
import { ArrowUp, ArrowDown, Minus, TrendingUp } from 'lucide-react';

/**
 * Enhanced card component for displaying statistics with trends and visualizations
 */
const EnhancedStatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  secondaryText,
  className = '',
  trend,
  progressBar,
  sparkline
}) => {
  // Render trend indicator if provided
  const renderTrendIndicator = () => {
    if (!trend) return null;

    const { direction, value, label } = trend;
    
    // Determine icon and color based on trend direction
    const getTrendIcon = (direction: TrendDirection) => {
      switch (direction) {
        case 'up':
          return <ArrowUp className="h-4 w-4 text-green-500" />;
        case 'down':
          return <ArrowDown className="h-4 w-4 text-red-500" />;
        case 'neutral':
        default:
          return <Minus className="h-4 w-4 text-gray-500" />;
      }
    };

    // Determine text color based on trend direction
    const getTrendColor = (direction: TrendDirection) => {
      switch (direction) {
        case 'up':
          return 'text-green-500';
        case 'down':
          return 'text-red-500';
        case 'neutral':
        default:
          return 'text-gray-500';
      }
    };

    return (
      <div className={`flex items-center mt-1 text-sm ${getTrendColor(direction)}`}>
        {getTrendIcon(direction)}
        <span className="ml-1">{value}</span>
        {label && <span className="ml-1 text-muted-foreground">{label}</span>}
      </div>
    );
  };

  // Render progress bar if provided
  const renderProgressBar = () => {
    if (!progressBar) return null;

    const { value, max, label } = progressBar;
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100); // Ensure between 0-100%
    
    return (
      <div className="mt-3">
        {label && <div className="text-xs text-muted-foreground mb-1">{label}</div>}
        <div className="w-full bg-gray-100 rounded-full h-2.5">
          <div 
            className="bg-bookconnect-sage h-2.5 rounded-full" 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <div className="text-xs text-muted-foreground mt-1">{percentage.toFixed(1)}%</div>
      </div>
    );
  };

  // Render sparkline chart if provided
  const renderSparkline = () => {
    if (!sparkline || sparkline.length < 2) return null;
    
    // Simple SVG sparkline implementation
    const values = [...sparkline];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1; // Avoid division by zero
    
    // Normalize values to 0-30 range for height
    const normalizedValues = values.map(v => 30 - ((v - min) / range) * 30);
    
    // Create path data
    const width = 60;
    const pointWidth = width / (values.length - 1);
    const points = normalizedValues.map((v, i) => `${i * pointWidth},${v}`).join(' ');
    
    return (
      <div className="mt-3 flex items-center">
        <TrendingUp className="h-4 w-4 text-bookconnect-sage mr-2" />
        <svg width={width} height="30" className="overflow-visible">
          <polyline
            points={points}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-bookconnect-sage"
          />
        </svg>
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold">
              {value !== undefined && value !== null ? value : 'N/A'}
            </div>
            {renderTrendIndicator()}
          </div>
          {icon && <div className="text-bookconnect-terracotta opacity-80">{icon}</div>}
        </div>
        
        {secondaryText && (
          <div className="text-sm text-muted-foreground mt-2">
            {secondaryText}
          </div>
        )}
        
        {renderProgressBar()}
        {renderSparkline()}
      </CardContent>
    </Card>
  );
};

export default EnhancedStatsCard;
