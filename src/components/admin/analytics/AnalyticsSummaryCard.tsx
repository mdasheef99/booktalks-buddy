import React, { memo, ReactNode } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface AnalyticsSummaryCardProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}

/**
 * Reusable card component for displaying analytics summaries
 */
const AnalyticsSummaryCard: React.FC<AnalyticsSummaryCardProps> = ({
  title,
  icon,
  children
}) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(AnalyticsSummaryCard);
