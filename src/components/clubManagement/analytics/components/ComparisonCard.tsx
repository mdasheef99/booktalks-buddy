/**
 * Comparison Card Component
 *
 * Displays individual metric comparisons with trend indicators.
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ComparisonData {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
}

interface ComparisonCardProps {
  title: string;
  current: number;
  previous: number;
  unit?: string;
}

const ComparisonCard: React.FC<ComparisonCardProps> = ({
  title,
  current,
  previous,
  unit = ''
}) => {
  const calculateComparison = (current: number, previous: number): ComparisonData => {
    const change = current - previous;
    const changePercent = previous > 0 ? Math.round((change / previous) * 100) : 0;
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (Math.abs(changePercent) >= 5) {
      trend = changePercent > 0 ? 'up' : 'down';
    }

    return {
      current,
      previous,
      change,
      changePercent,
      trend
    };
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-green-600 bg-green-50';
      case 'down':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const comparison = calculateComparison(current, previous);
  
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div>
        <div className="font-medium text-gray-900">{title}</div>
        <div className="text-sm text-gray-600">
          {comparison.current}{unit} vs {comparison.previous}{unit}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {getTrendIcon(comparison.trend)}
        <Badge variant="outline" className={getTrendColor(comparison.trend)}>
          {comparison.changePercent > 0 ? '+' : ''}{comparison.changePercent}%
        </Badge>
      </div>
    </div>
  );
};

export default ComparisonCard;
