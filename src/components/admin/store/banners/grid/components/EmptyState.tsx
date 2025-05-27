import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { EmptyStateProps } from '../types/bannerGridTypes';
import { ACTION_ICONS, EMPTY_STATE_CONFIG } from '../utils';

/**
 * Empty state component for banner management grid
 * Displayed when no banners are created
 */
export const EmptyState: React.FC<EmptyStateProps> = ({ onAdd }) => {
  const MegaphoneIcon = ACTION_ICONS.MEGAPHONE;
  const PlusIcon = ACTION_ICONS.ADD;

  return (
    <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
      <CardContent className="p-8 text-center">
        <div className="space-y-4">
          <div className={cn(EMPTY_STATE_CONFIG.CONTAINER_SIZE, "mx-auto bg-gray-100 rounded-lg flex items-center justify-center")}>
            <MegaphoneIcon className={cn(EMPTY_STATE_CONFIG.ICON_SIZE, "text-gray-400")} />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{EMPTY_STATE_CONFIG.TITLE}</h3>
            <p className="text-sm text-gray-500 mb-4">
              {EMPTY_STATE_CONFIG.DESCRIPTION}
            </p>
          </div>
          <Button onClick={onAdd} className="w-full">
            <PlusIcon className="h-4 w-4 mr-2" />
            {EMPTY_STATE_CONFIG.BUTTON_TEXT}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
