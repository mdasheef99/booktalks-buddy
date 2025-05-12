import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BarChart, Bell } from 'lucide-react';
import { DashboardHeaderProps } from '../types';

/**
 * Header component for the admin dashboard
 */
const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  pendingRequests,
  onNavigateBack,
  onNavigateToAnalytics,
  onNavigateToRequests
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
      <h1 className="text-3xl font-serif text-bookconnect-brown">Dashboard</h1>

      <div className="flex gap-2 ml-auto">
        <Button
          onClick={onNavigateToAnalytics}
          variant="outline"
          className="flex items-center gap-2"
        >
          <BarChart className="h-4 w-4 text-bookconnect-brown" />
          View Analytics
        </Button>

        {pendingRequests > 0 && (
          <Button
            onClick={onNavigateToRequests}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4 text-bookconnect-terracotta" />
            Pending Requests
            <Badge className="ml-1 bg-bookconnect-terracotta">{pendingRequests}</Badge>
          </Button>
        )}
      </div>
    </div>
  );
};

export default DashboardHeader;
