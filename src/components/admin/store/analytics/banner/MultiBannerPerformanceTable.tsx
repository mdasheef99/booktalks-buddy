/**
 * Multi-Banner Performance Table Component
 * 
 * Sortable table with ranking for individual banner performance
 * Follows BookTalks Buddy table design patterns
 */

import React, { useState, useMemo } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Eye, 
  MousePointer, 
  TrendingUp,
  Trophy,
  AlertTriangle,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react';
import { formatCTR, formatNumber, getPerformanceColor } from '@/lib/api/store/bannerAnalytics';
import type { BannerPerformanceDetail } from '@/lib/api/store/bannerAnalytics';

// =========================
// Component Props Interface
// =========================

interface MultiBannerPerformanceTableProps {
  bannerPerformance: BannerPerformanceDetail[];
  isLoading: boolean;
  className?: string;
  onBannerSelect?: (bannerId: string) => void;
  showDeviceBreakdown?: boolean;
  maxRows?: number;
}

// =========================
// Sorting Types
// =========================

type SortField = 'performanceRank' | 'impressions' | 'clicks' | 'ctr' | 'sessions' | 'avgViewDuration';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

// =========================
// Utility Functions
// =========================

/**
 * Get performance badge variant
 */
const getPerformanceBadge = (performance: string) => {
  switch (performance) {
    case 'excellent': return { variant: 'default' as const, className: 'bg-green-100 text-green-800' };
    case 'good': return { variant: 'secondary' as const, className: 'bg-blue-100 text-blue-800' };
    case 'average': return { variant: 'outline' as const, className: 'bg-yellow-100 text-yellow-800' };
    case 'poor': return { variant: 'destructive' as const, className: 'bg-red-100 text-red-800' };
    default: return { variant: 'outline' as const, className: 'bg-gray-100 text-gray-800' };
  }
};

/**
 * Get rank icon
 */
const getRankIcon = (rank: number) => {
  if (rank === 1) return <Trophy className="h-4 w-4 text-yellow-500" />;
  if (rank <= 3) return <TrendingUp className="h-4 w-4 text-green-500" />;
  return null;
};

/**
 * Format duration in seconds to readable format
 */
const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
};

// =========================
// Loading Component
// =========================

const LoadingTable: React.FC = () => (
  <div className="border rounded-lg">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Rank</TableHead>
          <TableHead>Banner</TableHead>
          <TableHead>Performance</TableHead>
          <TableHead>Impressions</TableHead>
          <TableHead>Clicks</TableHead>
          <TableHead>CTR</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, index) => (
          <TableRow key={index}>
            <TableCell><div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div></TableCell>
            <TableCell><div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div></TableCell>
            <TableCell><div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div></TableCell>
            <TableCell><div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div></TableCell>
            <TableCell><div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div></TableCell>
            <TableCell><div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

// =========================
// Main Component
// =========================

/**
 * Multi-Banner Performance Table
 * Displays individual banner metrics with sorting and ranking
 */
export const MultiBannerPerformanceTable: React.FC<MultiBannerPerformanceTableProps> = ({
  bannerPerformance,
  isLoading,
  className = '',
  onBannerSelect,
  showDeviceBreakdown = false,
  maxRows
}) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'performanceRank',
    direction: 'asc'
  });

  // Sort data based on current sort configuration
  const sortedData = useMemo(() => {
    const sorted = [...bannerPerformance].sort((a, b) => {
      const aValue = a[sortConfig.field];
      const bValue = b[sortConfig.field];
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return maxRows ? sorted.slice(0, maxRows) : sorted;
  }, [bannerPerformance, sortConfig, maxRows]);

  // Handle sorting
  const handleSort = (field: SortField) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Get sort icon
  const getSortIcon = (field: SortField) => {
    if (sortConfig.field !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="h-4 w-4" />
      : <ArrowDown className="h-4 w-4" />;
  };

  // Show loading state
  if (isLoading) {
    return <LoadingTable />;
  }

  // Show empty state
  if (bannerPerformance.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Banner Data</h3>
        <p className="text-gray-500">
          No banner performance data available for the selected time period.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Table Header Info */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Banner Performance</h3>
          <p className="text-sm text-gray-500">
            {sortedData.length} banner{sortedData.length !== 1 ? 's' : ''} ranked by performance
          </p>
        </div>
        {maxRows && bannerPerformance.length > maxRows && (
          <p className="text-sm text-gray-500">
            Showing top {maxRows} of {bannerPerformance.length} banners
          </p>
        )}
      </div>

      {/* Performance Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('performanceRank')}
                  className="h-8 p-0 font-medium"
                >
                  Rank {getSortIcon('performanceRank')}
                </Button>
              </TableHead>
              <TableHead className="min-w-[200px]">Banner</TableHead>
              <TableHead>Performance</TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('impressions')}
                  className="h-8 p-0 font-medium"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Impressions {getSortIcon('impressions')}
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('clicks')}
                  className="h-8 p-0 font-medium"
                >
                  <MousePointer className="h-4 w-4 mr-1" />
                  Clicks {getSortIcon('clicks')}
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('ctr')}
                  className="h-8 p-0 font-medium"
                >
                  CTR {getSortIcon('ctr')}
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('sessions')}
                  className="h-8 p-0 font-medium"
                >
                  Sessions {getSortIcon('sessions')}
                </Button>
              </TableHead>
              {showDeviceBreakdown && (
                <TableHead className="text-center">Devices</TableHead>
              )}
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('avgViewDuration')}
                  className="h-8 p-0 font-medium"
                >
                  Avg. View {getSortIcon('avgViewDuration')}
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((banner) => {
              const performanceBadge = getPerformanceBadge(banner.performance);
              const rankIcon = getRankIcon(banner.performanceRank);

              return (
                <TableRow 
                  key={banner.bannerId}
                  className={onBannerSelect ? 'cursor-pointer hover:bg-gray-50' : ''}
                  onClick={() => onBannerSelect?.(banner.bannerId)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {rankIcon}
                      <span className="font-medium">#{banner.performanceRank}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-gray-900 truncate max-w-[180px]">
                        {banner.bannerTitle}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">
                        {banner.bannerId.slice(0, 8)}...
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={performanceBadge.variant}
                      className={performanceBadge.className}
                    >
                      {banner.performance}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatNumber(banner.impressions)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatNumber(banner.clicks)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`font-medium ${
                      banner.ctr >= 5 ? 'text-green-600' : 
                      banner.ctr >= 2 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {formatCTR(banner.ctr)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(banner.sessions)}
                  </TableCell>
                  {showDeviceBreakdown && (
                    <TableCell>
                      <div className="flex items-center justify-center gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <Smartphone className="h-3 w-3" />
                          {banner.deviceBreakdown.mobile}
                        </div>
                        <div className="flex items-center gap-1">
                          <Monitor className="h-3 w-3" />
                          {banner.deviceBreakdown.desktop}
                        </div>
                        <div className="flex items-center gap-1">
                          <Tablet className="h-3 w-3" />
                          {banner.deviceBreakdown.tablet}
                        </div>
                      </div>
                    </TableCell>
                  )}
                  <TableCell className="text-right text-sm text-gray-600">
                    {formatDuration(banner.avgViewDuration)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Performance Summary */}
      {sortedData.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Performance Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Top Performer:</span>
              <div className="font-medium text-gray-900">
                {sortedData[0]?.bannerTitle || 'N/A'}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Best CTR:</span>
              <div className="font-medium text-green-600">
                {formatCTR(Math.max(...sortedData.map(b => b.ctr)))}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Total Impressions:</span>
              <div className="font-medium text-gray-900">
                {formatNumber(sortedData.reduce((sum, b) => sum + b.impressions, 0))}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Total Clicks:</span>
              <div className="font-medium text-gray-900">
                {formatNumber(sortedData.reduce((sum, b) => sum + b.clicks, 0))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiBannerPerformanceTable;
