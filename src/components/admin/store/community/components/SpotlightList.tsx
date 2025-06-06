/**
 * Spotlight List Component
 * List display for member spotlights with empty state
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Plus } from 'lucide-react';
import type { MemberSpotlightListProps } from '../types/memberSpotlightTypes';
import { SpotlightItem } from './SpotlightItem';
import { SpotlightStats } from './SpotlightStats';
import { UI_TEXT } from '../constants/memberSpotlightConstants';

export const SpotlightList: React.FC<MemberSpotlightListProps> = ({
  spotlights,
  onEdit,
  onDelete,
  onCreateNew,
  isLoading = false,
}) => {
  if (spotlights.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header with Add Button */}
        <div className="flex justify-between items-center">
          <SpotlightStats spotlights={[]} />
          <Button onClick={onCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            {UI_TEXT.BUTTONS.ADD_SPOTLIGHT}
          </Button>
        </div>

        {/* Empty State */}
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Star className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {UI_TEXT.EMPTY_STATE.TITLE}
            </h3>
            <p className="text-gray-500 text-center mb-4">
              {UI_TEXT.EMPTY_STATE.DESCRIPTION}
            </p>
            <Button onClick={onCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              {UI_TEXT.BUTTONS.CREATE_FIRST_SPOTLIGHT}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <SpotlightStats spotlights={spotlights} />
        <Button onClick={onCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          {UI_TEXT.BUTTONS.ADD_SPOTLIGHT}
        </Button>
      </div>

      {/* Spotlights List */}
      <div className="space-y-4">
        {spotlights.map((spotlight) => (
          <SpotlightItem
            key={spotlight.id}
            spotlight={spotlight}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="text-gray-500">Loading spotlights...</div>
        </div>
      )}
    </div>
  );
};

/**
 * Compact Spotlight List Component
 * Simplified version for smaller spaces
 */
interface CompactSpotlightListProps {
  spotlights: any[];
  onEdit: (spotlight: any) => void;
  onDelete: (spotlightId: string) => void;
  onCreateNew: () => void;
  maxItems?: number;
}

export const CompactSpotlightList: React.FC<CompactSpotlightListProps> = ({
  spotlights,
  onEdit,
  onDelete,
  onCreateNew,
  maxItems = 5,
}) => {
  const displaySpotlights = spotlights.slice(0, maxItems);
  const hasMore = spotlights.length > maxItems;

  if (spotlights.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Star className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500 mb-3">No member spotlights yet</p>
          <Button size="sm" onClick={onCreateNew}>
            <Plus className="h-3 w-3 mr-1" />
            Create First
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">
          {spotlights.length} spotlight{spotlights.length !== 1 ? 's' : ''}
        </span>
        <Button size="sm" onClick={onCreateNew}>
          <Plus className="h-3 w-3 mr-1" />
          Add
        </Button>
      </div>

      <div className="space-y-2">
        {displaySpotlights.map((spotlight) => (
          <div
            key={spotlight.id}
            className="p-3 border rounded-lg hover:bg-gray-50 flex justify-between items-start"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {spotlight.userData?.displayname || spotlight.userData?.username}
              </p>
              <p className="text-xs text-gray-500 truncate">
                "{spotlight.spotlight_description}"
              </p>
            </div>
            <div className="ml-2 flex space-x-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(spotlight)}
                className="px-2 py-1 h-auto"
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDelete(spotlight.id)}
                className="px-2 py-1 h-auto text-red-600 hover:text-red-700"
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <p className="text-xs text-gray-500 text-center">
          And {spotlights.length - maxItems} more...
        </p>
      )}
    </div>
  );
};
