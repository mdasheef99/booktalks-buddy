import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Info } from 'lucide-react';

interface AnalyticsDataNoticeProps {
  title: string;
  description: string;
  variant?: 'blue' | 'green' | 'yellow' | 'gray';
}

/**
 * Reusable data notice component for analytics pages
 * Provides consistent styling for data collection and privacy notices
 */
export const AnalyticsDataNotice: React.FC<AnalyticsDataNoticeProps> = ({
  title,
  description,
  variant = 'blue'
}) => {
  const variantStyles = {
    blue: {
      cardClass: 'bg-blue-50 border-blue-200',
      iconClass: 'text-blue-600',
      titleClass: 'text-blue-900',
      descClass: 'text-blue-800'
    },
    green: {
      cardClass: 'bg-green-50 border-green-200',
      iconClass: 'text-green-600',
      titleClass: 'text-green-900',
      descClass: 'text-green-800'
    },
    yellow: {
      cardClass: 'bg-yellow-50 border-yellow-200',
      iconClass: 'text-yellow-600',
      titleClass: 'text-yellow-900',
      descClass: 'text-yellow-800'
    },
    gray: {
      cardClass: 'bg-gray-50 border-gray-200',
      iconClass: 'text-gray-600',
      titleClass: 'text-gray-900',
      descClass: 'text-gray-700'
    }
  };

  const styles = variantStyles[variant];

  return (
    <Card className={styles.cardClass}>
      <CardContent className="p-6">
        <div className="flex items-start gap-3">
          <Info className={`h-5 w-5 ${styles.iconClass} flex-shrink-0 mt-0.5`} />
          <div>
            <h4 className={`font-medium ${styles.titleClass} mb-1`}>{title}</h4>
            <p className={`text-sm ${styles.descClass}`}>{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
