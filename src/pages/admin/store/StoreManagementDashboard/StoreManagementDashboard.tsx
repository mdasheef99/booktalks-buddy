/**
 * Store Management Dashboard - Main Component
 * 
 * Central hub for Store Owners to manage their landing page
 */

import React from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { DashboardHeader } from './components/DashboardHeader';
import { OverviewStatistics } from './components/OverviewStatistics';
import { QuickActions } from './components/QuickActions';
import { ManagementSections } from './components/ManagementSections';
import { LandingPageStatus } from './components/LandingPageStatus';
import { QuickTips } from './components/QuickTips';
import { useDashboardData } from './hooks/useDashboardData';
import { useDashboardStats } from './hooks/useDashboardStats';
import { createQuickActions, createManagementSections } from './utils/dashboardUtils';
import type { DashboardProps } from './types';

/**
 * Store Management Dashboard Component
 */
export const StoreManagementDashboard: React.FC<DashboardProps> = ({ 
  className = '' 
}) => {
  // Fetch dashboard data
  const { data, isLoading } = useDashboardData();
  
  // Calculate statistics
  const stats = useDashboardStats(data);
  
  // Create dynamic content
  const quickActions = createQuickActions(stats);
  const managementSections = createManagementSections(stats);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className={`container mx-auto px-4 py-8 space-y-8 ${className}`}>
      {/* Dashboard Header */}
      <DashboardHeader 
        title="Store Management Dashboard"
        description="Manage your landing page customization and content"
        showViewLandingPage={true}
        showViewAnalytics={true}
      />

      {/* Overview Statistics */}
      <OverviewStatistics 
        stats={stats}
        analyticsMetrics={data.analyticsMetrics}
      />

      {/* Quick Actions */}
      <QuickActions actions={quickActions} />

      {/* Management Sections and Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Management Sections */}
        <div className="lg:col-span-2">
          <ManagementSections sections={managementSections} />
        </div>

        {/* Sidebar with Status and Tips */}
        <div className="space-y-6">
          <LandingPageStatus stats={stats} />
          <QuickTips stats={stats} />
        </div>
      </div>
    </div>
  );
};
