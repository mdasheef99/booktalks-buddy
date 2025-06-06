import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AddBannerCardProps } from '../types/bannerGridTypes';
import { ACTION_ICONS, GRID_MESSAGES } from '../utils';

/**
 * Add banner card component
 * Provides button to add new banners to the grid
 */
export const AddBannerCard: React.FC<AddBannerCardProps> = ({ onAdd }) => {
  return (
    <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
      <CardContent className="p-6 text-center">
        <Button onClick={onAdd} variant="outline" className="w-full">
          <ACTION_ICONS.ADD className="h-4 w-4 mr-2" />
          {GRID_MESSAGES.ADD_NEW_BANNER}
        </Button>
      </CardContent>
    </Card>
  );
};
