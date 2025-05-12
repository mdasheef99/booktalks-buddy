import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { RecentActivityCardProps } from '../types';

/**
 * Component for displaying recent activity
 */
const RecentActivityCard: React.FC<RecentActivityCardProps> = ({ recentActivity }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          This section will display recent activity across all book clubs.
        </p>
      </CardContent>
    </Card>
  );
};

export default RecentActivityCard;
