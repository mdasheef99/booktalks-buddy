import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBgColor?: string;
  iconColor?: string;
  valueFormatter?: (value: string | number) => string;
}

/**
 * Reusable metric card component for analytics dashboards
 * Provides consistent styling and layout for metric displays
 */
export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconBgColor = "bg-blue-100",
  iconColor = "text-blue-600",
  valueFormatter
}) => {
  const formattedValue = valueFormatter ? valueFormatter(value) : value;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">
              {formattedValue}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-500">{subtitle}</p>
            )}
          </div>
          <div className={`h-12 w-12 ${iconBgColor} rounded-lg flex items-center justify-center`}>
            <div className={`h-6 w-6 ${iconColor}`}>
              {icon}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
