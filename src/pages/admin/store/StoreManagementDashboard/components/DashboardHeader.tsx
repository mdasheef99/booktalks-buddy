/**
 * Dashboard Header Component
 * 
 * Header section with title, description, and action buttons
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { DashboardHeaderProps } from '../types';

/**
 * Dashboard Header Component
 */
export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title = 'Store Management Dashboard',
  description = 'Manage your landing page customization and content',
  showViewLandingPage = true,
  showViewAnalytics = true
}) => {
  return (
    <div className="flex items-center justify-between">
      {/* Title and Description */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        {description && (
          <p className="text-gray-600 mt-2">{description}</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {showViewLandingPage && (
          <Button
            asChild
            variant="outline"
            className="flex items-center gap-2"
          >
            <Link to="/">
              <Eye className="h-4 w-4" />
              View Landing Page
            </Link>
          </Button>
        )}

        {showViewAnalytics && (
          <Button
            asChild
            className="flex items-center gap-2"
          >
            <Link to="/admin/store-management/analytics">
              <BarChart3 className="h-4 w-4" />
              View Analytics
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
};
