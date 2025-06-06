/**
 * Spotlight Type Select Component
 * Dropdown for selecting spotlight types with descriptions
 */

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { SpotlightTypeSelectProps } from '../types/memberSpotlightTypes';
import { SPOTLIGHT_TYPES } from '../constants/memberSpotlightConstants';

export const SpotlightTypeSelect: React.FC<SpotlightTypeSelectProps> = ({
  value,
  onChange,
  showDescription = false,
}) => {
  const selectedType = SPOTLIGHT_TYPES.find(type => type.value === value);

  return (
    <div className="space-y-2">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue>
            {selectedType && (
              <div className="flex items-center space-x-2">
                <selectedType.icon className="h-4 w-4" />
                <span>{selectedType.label}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {SPOTLIGHT_TYPES.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              <div className="flex items-center space-x-2">
                <type.icon className="h-4 w-4" />
                <div>
                  <div className="font-medium">{type.label}</div>
                  {showDescription && (
                    <div className="text-sm text-gray-500">{type.description}</div>
                  )}
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Show description below if enabled and type is selected */}
      {showDescription && selectedType && (
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className={selectedType.color}>
            <selectedType.icon className="h-3 w-3 mr-1" />
            {selectedType.label}
          </Badge>
          <span className="text-sm text-gray-600">{selectedType.description}</span>
        </div>
      )}
    </div>
  );
};

/**
 * Compact Spotlight Type Select Component
 * Simplified version without descriptions
 */
interface CompactSpotlightTypeSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export const CompactSpotlightTypeSelect: React.FC<CompactSpotlightTypeSelectProps> = ({
  value,
  onChange,
}) => {
  const selectedType = SPOTLIGHT_TYPES.find(type => type.value === value);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue>
          {selectedType && (
            <div className="flex items-center space-x-1">
              <selectedType.icon className="h-3 w-3" />
              <span className="text-sm">{selectedType.label}</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {SPOTLIGHT_TYPES.map((type) => (
          <SelectItem key={type.value} value={type.value}>
            <div className="flex items-center space-x-2">
              <type.icon className="h-3 w-3" />
              <span className="text-sm">{type.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
