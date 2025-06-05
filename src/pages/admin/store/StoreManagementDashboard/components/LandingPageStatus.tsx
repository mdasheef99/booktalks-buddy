/**
 * Landing Page Status Component
 * 
 * Displays current status of landing page sections
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { getSectionCompletionStatus } from '../utils/dashboardUtils';
import type { LandingPageStatusProps, StatusItemProps } from '../types';

/**
 * Status Item Component
 */
const StatusItem: React.FC<StatusItemProps> = ({ label, value, isActive }) => {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-medium ${isActive ? 'text-green-600' : 'text-gray-400'}`}>
        {value}
      </span>
    </div>
  );
};

/**
 * Landing Page Status Component
 */
export const LandingPageStatus: React.FC<LandingPageStatusProps> = ({ stats }) => {
  const sections = [
    {
      key: 'hero',
      label: 'Hero Section'
    },
    {
      key: 'carousel',
      label: 'Carousel'
    },
    {
      key: 'banners',
      label: 'Banners'
    },
    {
      key: 'quotes',
      label: 'Quotes'
    },
    {
      key: 'community',
      label: 'Community'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Landing Page Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sections.map((section) => {
          const status = getSectionCompletionStatus(stats, section.key);
          return (
            <StatusItem
              key={section.key}
              label={section.label}
              value={status.completionText}
              isActive={status.isComplete}
            />
          );
        })}
      </CardContent>
    </Card>
  );
};
