import React from 'react';
import { Button } from '@/components/ui/button';
import { BannerActionsProps } from '../types/bannerGridTypes';
import { ACTION_ICONS } from '../utils';

/**
 * Action buttons component for banner cards
 * Provides edit and delete functionality
 */
export const BannerActions: React.FC<BannerActionsProps> = ({ banner, onEdit, onDelete }) => {
  return (
    <div className="flex gap-2">
      <Button
        onClick={() => onEdit(banner)}
        variant="outline"
        size="sm"
        className="flex-1"
      >
        <ACTION_ICONS.EDIT className="h-3 w-3 mr-1" />
        Edit
      </Button>
      <Button
        onClick={() => onDelete(banner.id)}
        variant="outline"
        size="sm"
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <ACTION_ICONS.DELETE className="h-3 w-3" />
      </Button>
    </div>
  );
};
