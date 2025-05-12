import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { StatsCardProps } from '../types';

/**
 * Reusable card component for displaying statistics
 */
const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  secondaryText,
  className = ''
}) => {
  console.log('StatsCard rendering:', { title, value, secondaryText });

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-3xl font-bold">
            {value !== undefined && value !== null ? value : 'N/A'}
          </div>
          {icon && <div className="text-bookconnect-terracotta opacity-80">{icon}</div>}
        </div>
        {secondaryText && (
          <div className="text-sm text-muted-foreground mt-2">
            {secondaryText}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;
