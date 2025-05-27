/**
 * Spotlight Stats Component
 * Display statistics about member spotlights
 */

import React from 'react';
import type { SpotlightStatsProps } from '../types/memberSpotlightTypes';
import { calculateSpotlightStats } from '../utils/memberSpotlightUtils';
import { UI_TEXT } from '../constants/memberSpotlightConstants';

export const SpotlightStats: React.FC<SpotlightStatsProps> = ({ spotlights }) => {
  const stats = calculateSpotlightStats(spotlights);

  return (
    <div className="text-sm text-gray-600">
      {UI_TEXT.STATS.ACTIVE_SPOTLIGHTS(stats.active)}
    </div>
  );
};

/**
 * Detailed Spotlight Stats Component
 * More comprehensive statistics display
 */
export const DetailedSpotlightStats: React.FC<SpotlightStatsProps> = ({ spotlights }) => {
  const stats = calculateSpotlightStats(spotlights);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        <div className="text-sm text-gray-600">Total</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-green-600">{stats.active}</div>
        <div className="text-sm text-gray-600">Active</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-600">{stats.expired}</div>
        <div className="text-sm text-gray-600">Expired</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600">{stats.byType.top_reviewer}</div>
        <div className="text-sm text-gray-600">Top Reviewers</div>
      </div>
    </div>
  );
};

/**
 * Compact Stats Component
 * Minimal statistics display
 */
export const CompactSpotlightStats: React.FC<SpotlightStatsProps> = ({ spotlights }) => {
  const stats = calculateSpotlightStats(spotlights);

  return (
    <div className="flex items-center space-x-4 text-xs text-gray-500">
      <span>{stats.total} total</span>
      <span className="text-green-600">{stats.active} active</span>
      {stats.expired > 0 && (
        <span className="text-gray-600">{stats.expired} expired</span>
      )}
    </div>
  );
};
