/**
 * Banner Time Series Chart Component
 * 
 * Historical performance trends for banner analytics
 * Shows trends over time with multiple metrics
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  Calendar, 
  Eye, 
  MousePointer, 
  BarChart3,
  Activity
} from 'lucide-react';
import { formatCTR, formatNumber } from '@/lib/api/store/bannerAnalytics';
import type { BannerTimeSeriesData } from '@/lib/api/store/bannerAnalytics';

// =========================
// Component Props Interface
// =========================

interface BannerTimeSeriesChartProps {
  timeSeriesData: BannerTimeSeriesData[];
  isLoading: boolean;
  className?: string;
  selectedBanners?: string[];
  onBannerToggle?: (bannerId: string) => void;
  chartHeight?: number;
}

// =========================
// Chart Configuration
// =========================

type MetricType = 'impressions' | 'clicks' | 'ctr' | 'sessions';
type ChartType = 'line' | 'area';

interface MetricConfig {
  key: MetricType;
  label: string;
  color: string;
  icon: React.ReactNode;
  formatter: (value: number) => string;
}

const METRIC_CONFIGS: MetricConfig[] = [
  {
    key: 'impressions',
    label: 'Impressions',
    color: '#3B82F6',
    icon: <Eye className="h-4 w-4" />,
    formatter: formatNumber
  },
  {
    key: 'clicks',
    label: 'Clicks',
    color: '#10B981',
    icon: <MousePointer className="h-4 w-4" />,
    formatter: formatNumber
  },
  {
    key: 'ctr',
    label: 'CTR (%)',
    color: '#F59E0B',
    icon: <TrendingUp className="h-4 w-4" />,
    formatter: (value) => `${value.toFixed(2)}%`
  },
  {
    key: 'sessions',
    label: 'Sessions',
    color: '#8B5CF6',
    icon: <Activity className="h-4 w-4" />,
    formatter: formatNumber
  }
];

const BANNER_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6B7280'
];

// =========================
// Utility Functions
// =========================

/**
 * Format date for display
 */
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  });
};

/**
 * Prepare time series data for charts
 */
const prepareTimeSeriesData = (
  data: BannerTimeSeriesData[], 
  selectedBanners?: string[]
): any[] => {
  // Group data by time period
  const groupedData = data.reduce((acc, item) => {
    const period = item.timePeriod;
    if (!acc[period]) {
      acc[period] = { period, date: formatDate(period) };
    }
    
    // Only include selected banners or all if none selected
    if (!selectedBanners || selectedBanners.length === 0 || selectedBanners.includes(item.bannerId)) {
      const bannerKey = `banner_${item.bannerId.slice(0, 8)}`;
      acc[period][`${bannerKey}_impressions`] = item.impressions;
      acc[period][`${bannerKey}_clicks`] = item.clicks;
      acc[period][`${bannerKey}_ctr`] = item.ctr;
      acc[period][`${bannerKey}_sessions`] = item.uniqueSessions;
    }
    
    return acc;
  }, {} as Record<string, any>);

  // Convert to array and sort by date
  return Object.values(groupedData).sort((a, b) => 
    new Date(a.period).getTime() - new Date(b.period).getTime()
  );
};

/**
 * Get unique banners from time series data
 */
const getUniqueBanners = (data: BannerTimeSeriesData[]): Array<{id: string, label: string}> => {
  const bannerMap = new Map();
  data.forEach(item => {
    if (!bannerMap.has(item.bannerId)) {
      bannerMap.set(item.bannerId, {
        id: item.bannerId,
        label: `Banner ${item.bannerId.slice(0, 8)}...`
      });
    }
  });
  return Array.from(bannerMap.values());
};

// =========================
// Custom Tooltip Component
// =========================

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white p-3 border rounded-lg shadow-lg">
      <p className="font-medium text-gray-900 mb-2">{label}</p>
      <div className="space-y-1">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600">{entry.name}:</span>
            </div>
            <span className="font-medium">
              {entry.name.includes('CTR') 
                ? `${entry.value.toFixed(2)}%`
                : formatNumber(entry.value)
              }
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// =========================
// Loading Component
// =========================

const LoadingChart: React.FC = () => (
  <div className="h-80 flex items-center justify-center">
    <div className="animate-pulse space-y-4 w-full">
      <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto"></div>
      <div className="h-64 bg-gray-200 rounded"></div>
    </div>
  </div>
);

// =========================
// Main Component
// =========================

/**
 * Banner Time Series Chart
 * Shows historical performance trends for banners
 */
export const BannerTimeSeriesChart: React.FC<BannerTimeSeriesChartProps> = ({
  timeSeriesData,
  isLoading,
  className = '',
  selectedBanners = [],
  onBannerToggle,
  chartHeight = 400
}) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('impressions');
  const [chartType, setChartType] = useState<ChartType>('line');

  // Get unique banners and prepare data
  const uniqueBanners = useMemo(() => getUniqueBanners(timeSeriesData), [timeSeriesData]);
  const chartData = useMemo(() => 
    prepareTimeSeriesData(timeSeriesData, selectedBanners), 
    [timeSeriesData, selectedBanners]
  );

  // Get current metric config
  const currentMetric = METRIC_CONFIGS.find(m => m.key === selectedMetric) || METRIC_CONFIGS[0];

  // Show loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingChart />
        </CardContent>
      </Card>
    );
  }

  // Show empty state
  if (timeSeriesData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-center">
            <div>
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Trend Data</h3>
              <p className="text-gray-500">
                Historical data will appear here as banners accumulate performance metrics.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render chart lines for each banner
  const renderChartLines = () => {
    const activeBanners = selectedBanners.length > 0 ? selectedBanners : uniqueBanners.map(b => b.id);
    
    return activeBanners.map((bannerId, index) => {
      const bannerKey = `banner_${bannerId.slice(0, 8)}`;
      const dataKey = `${bannerKey}_${selectedMetric}`;
      const color = BANNER_COLORS[index % BANNER_COLORS.length];
      const bannerLabel = uniqueBanners.find(b => b.id === bannerId)?.label || `Banner ${bannerId.slice(0, 8)}`;

      if (chartType === 'area') {
        return (
          <Area
            key={bannerId}
            type="monotone"
            dataKey={dataKey}
            stackId={selectedMetric === 'ctr' ? undefined : '1'}
            stroke={color}
            fill={color}
            fillOpacity={0.3}
            strokeWidth={2}
            name={bannerLabel}
          />
        );
      } else {
        return (
          <Line
            key={bannerId}
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
            name={bannerLabel}
          />
        );
      }
    });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Trends
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Historical performance over time
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Metric Selector */}
            <div className="flex gap-1">
              {METRIC_CONFIGS.map((metric) => (
                <Button
                  key={metric.key}
                  variant={selectedMetric === metric.key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMetric(metric.key)}
                  className="h-8"
                >
                  {metric.icon}
                  <span className="ml-1 hidden sm:inline">{metric.label}</span>
                </Button>
              ))}
            </div>

            {/* Chart Type Toggle */}
            <div className="flex gap-1">
              <Button
                variant={chartType === 'line' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('line')}
                className="h-8"
              >
                <TrendingUp className="h-4 w-4" />
                <span className="ml-1 hidden sm:inline">Line</span>
              </Button>
              <Button
                variant={chartType === 'area' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('area')}
                className="h-8"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="ml-1 hidden sm:inline">Area</span>
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Banner Selection */}
        {onBannerToggle && uniqueBanners.length > 1 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Select Banners to Compare</h4>
            <div className="flex flex-wrap gap-2">
              {uniqueBanners.map((banner, index) => (
                <Button
                  key={banner.id}
                  variant={selectedBanners.includes(banner.id) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onBannerToggle(banner.id)}
                  className="h-8"
                >
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: BANNER_COLORS[index % BANNER_COLORS.length] }}
                  />
                  {banner.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="mb-6">
          <ResponsiveContainer width="100%" height={chartHeight}>
            {chartType === 'area' ? (
              <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis 
                  fontSize={12}
                  tickFormatter={currentMetric.formatter}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {renderChartLines()}
              </AreaChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis 
                  fontSize={12}
                  tickFormatter={currentMetric.formatter}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {renderChartLines()}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Trend Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Trend Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Time Period:</span>
              <div className="font-medium text-gray-900">
                {chartData.length > 0 ? `${chartData.length} data points` : 'No data'}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Tracking:</span>
              <div className="font-medium text-gray-900">
                {uniqueBanners.length} banner{uniqueBanners.length !== 1 ? 's' : ''}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Current Metric:</span>
              <div className="font-medium text-gray-900 flex items-center gap-1">
                {currentMetric.icon}
                {currentMetric.label}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BannerTimeSeriesChart;
