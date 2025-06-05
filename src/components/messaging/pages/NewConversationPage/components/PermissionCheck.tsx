/**
 * Permission Check Component
 * 
 * Displays permission status and upgrade prompts for conversation creation
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { PermissionCheckProps } from '../types';

/**
 * Permission Check Component
 */
export const PermissionCheck: React.FC<PermissionCheckProps> = ({
  permissions,
  onUpgradeClick
}) => {
  const handleUpgradeClick = () => {
    if (onUpgradeClick) {
      onUpgradeClick();
    } else {
      // TODO: Navigate to upgrade page
      toast.info('Upgrade feature coming soon');
    }
  };

  // Show loading state
  if (permissions.isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  // Show upgrade required message
  if (!permissions.canInitiate) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <p className="text-sm text-amber-800 font-medium mb-1">
              Upgrade Required
            </p>
            <p className="text-xs text-amber-700 leading-relaxed">
              Only Privileged and Privileged+ members can start new conversations.
              You can still reply to messages sent to you.
            </p>
            <Button
              variant="link"
              size="sm"
              className="text-amber-700 p-0 h-auto text-xs mt-2"
              onClick={handleUpgradeClick}
            >
              Learn about upgrading →
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if there's an error
  if (permissions.error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <p className="text-sm text-red-800 font-medium mb-1">
              Permission Check Failed
            </p>
            <p className="text-xs text-red-700 leading-relaxed">
              {permissions.error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Don't render anything if permissions are granted
  return null;
};
