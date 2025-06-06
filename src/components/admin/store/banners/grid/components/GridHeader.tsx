import React from 'react';
import { GridHeaderProps } from '../types/bannerGridTypes';
import { GRID_MESSAGES } from '../utils';

/**
 * Grid header component showing banner count and status
 * Displays reordering status when applicable
 */
export const GridHeader: React.FC<GridHeaderProps> = ({ bannerCount, isReordering }) => {
  return (
    <div className="flex items-center justify-between text-sm text-gray-600">
      <span>{GRID_MESSAGES.BANNER_COUNT(bannerCount)}</span>
      {isReordering && (
        <span className="text-blue-600">{GRID_MESSAGES.REORDERING}</span>
      )}
    </div>
  );
};
