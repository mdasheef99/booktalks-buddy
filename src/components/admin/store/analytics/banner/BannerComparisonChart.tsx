/**
 * Banner Comparison Chart Component
 * 
 * Visual comparison between banners using charts
 * Supports multiple chart types and responsive design
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  Radar as RadarIcon,
  TrendingUp,
  Eye,
  MousePointer,
  Target
} from 'lucide-react';
import { formatCTR, formatNumber } from '@/lib/api/store/bannerAnalytics';
import type { BannerComparisonData } from '@/lib/api/store/bannerAnalytics';

// =========================
// Component Props Interface
// =========================

interface BannerComparisonChartProps {
  comparisonData: BannerComparisonData[];
  isLoading: boolean;
  className?: string;
  maxBanners?: number;
  defaultChartType?: ChartType;
}

// =========================
// Chart Types
// =========================

type ChartType = 'bar' | 'pie' | 'radar';

interface ChartTypeOption {
  type: ChartType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

// =========================
// Constants
// =========================

const CHART_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
  '#EC4899', // Pink
  '#6B7280'  // Gray
];

const CHART_TYPE_OPTIONS: ChartTypeOption[] = [
  {
    type: 'bar',
    label: 'Bar Chart',
    icon: <BarChart3 className="h-4 w-4" />,
    description: 'Compare metrics side by side'
  },
  {
    type: 'pie',
    label: 'Pie Chart',
    icon: <PieChartIcon className="h-4 w-4" />,
    description: 'Show proportional distribution'
  },
  {
    type: 'radar',
    label: 'Radar Chart',
    icon: <RadarIcon className="h-4 w-4" />,
    description: 'Multi-dimensional comparison'
  }
];

// =========================
// Utility Functions
// =========================

/**
 * Prepare data for different chart types
 */
const prepareChartData = (data: BannerComparisonData[], chartType: ChartType, maxBanners?: number) => {
  const limitedData = maxBanners ? data.slice(0, maxBanners) : data;

  switch (chartType) {
    case 'bar':
      return limitedData.map((banner, index) => ({
        name: banner.bannerTitle.length > 15 
          ? `${banner.bannerTitle.slice(0, 15)}...` 
          : banner.bannerTitle,
        fullName: banner.bannerTitle,
        impressions: banner.impressions,
        clicks: banner.clicks,
        ctr: banner.ctr,
        performanceScore: banner.performanceScore,
        engagementRate: banner.engagementRate,
        conversionRate: banner.conversionRate,
        color: CHART_COLORS[index % CHART_COLORS.length]
      }));

    case 'pie':
      return limitedData.map((banner, index) => ({
        name: banner.bannerTitle.length > 20 
          ? `${banner.bannerTitle.slice(0, 20)}...` 
          : banner.bannerTitle,
        value: banner.clicks,
        percentage: data.length > 0 
          ? ((banner.clicks / data.reduce((sum, b) => sum + b.clicks, 0)) * 100).toFixed(1)
          : '0',
        color: CHART_COLORS[index % CHART_COLORS.length]
      }));

    case 'radar':
      return limitedData.map((banner, index) => ({
        banner: banner.bannerTitle.length > 12 
          ? `${banner.bannerTitle.slice(0, 12)}...` 
          : banner.bannerTitle,
        fullName: banner.bannerTitle,
        CTR: banner.ctr,
        'Performance Score': banner.performanceScore,
        'Engagement Rate': banner.engagementRate,
        'Conversion Rate': banner.conversionRate,
        color: CHART_COLORS[index % CHART_COLORS.length]
      }));

    default:
      return [];
  }
};

/**
 * Custom tooltip for charts
 */
const CustomTooltip = ({ active, payload, label, chartType }: any) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-white p-3 border rounded-lg shadow-lg">
      <p className="font-medium text-gray-900 mb-2">
        {data.fullName || data.name || label}
      </p>
      {chartType === 'bar' && (
        <div className="space-y-1 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Impressions:</span>
            <span className="font-medium">{formatNumber(data.impressions)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Clicks:</span>
            <span className="font-medium">{formatNumber(data.clicks)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">CTR:</span>
            <span className="font-medium">{formatCTR(data.ctr)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Performance:</span>
            <span className="font-medium">{data.performanceScore.toFixed(1)}</span>
          </div>
        </div>
      )}
      {chartType === 'pie' && (
        <div className="space-y-1 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Clicks:</span>
            <span className="font-medium">{formatNumber(data.value)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Share:</span>
            <span className="font-medium">{data.percentage}%</span>
          </div>
        </div>
      )}
      {chartType === 'radar' && payload.map((entry: any, index: number) => (
        <div key={index} className="flex justify-between gap-4 text-sm">
          <span className="text-gray-600">{entry.dataKey}:</span>
          <span className="font-medium">
            {entry.dataKey === 'CTR' ? formatCTR(entry.value) : entry.value.toFixed(1)}
          </span>
        </div>
      ))}
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
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 bg-gray-200 rounded" style={{ width: `${60 + i * 8}%` }}></div>
        ))}
      </div>
    </div>
  </div>
);

// =========================
// Main Component
// =========================

/**
 * Banner Comparison Chart
 * Visual comparison between banner performance metrics
 */
export const BannerComparisonChart: React.FC<BannerComparisonChartProps> = ({
  comparisonData,
  isLoading,
  className = '',
  maxBanners = 8,
  defaultChartType = 'bar'
}) => {
  const [chartType, setChartType] = useState<ChartType>(defaultChartType);

  // Prepare chart data
  const chartData = prepareChartData(comparisonData, chartType, maxBanners);

  // Show loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Banner Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingChart />
        </CardContent>
      </Card>
    );
  }

  // Show empty state
  if (comparisonData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Banner Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-center">
            <div>
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Data to Compare</h3>
              <p className="text-gray-500">
                Add multiple banners to see performance comparisons.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render chart based on type
  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis />
              <Tooltip content={<CustomTooltip chartType="bar" />} />
              <Bar dataKey="performanceScore" fill="#3B82F6" name="Performance Score" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip chartType="pie" />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'radar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={chartData} margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
              <PolarGrid />
              <PolarAngleAxis dataKey="banner" fontSize={12} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} fontSize={10} />
              {chartData.map((banner, index) => (
                <Radar
                  key={index}
                  name={banner.fullName}
                  dataKey="CTR"
                  stroke={banner.color}
                  fill={banner.color}
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              ))}
              <Tooltip content={<CustomTooltip chartType="radar" />} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Banner Comparison
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Comparing {chartData.length} banner{chartData.length !== 1 ? 's' : ''} performance
            </p>
          </div>
          
          {/* Chart Type Selector */}
          <div className="flex gap-1">
            {CHART_TYPE_OPTIONS.map((option) => (
              <Button
                key={option.type}
                variant={chartType === option.type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType(option.type)}
                className="h-8"
                title={option.description}
              >
                {option.icon}
                <span className="ml-1 hidden sm:inline">{option.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Chart */}
        <div className="mb-6">
          {renderChart()}
        </div>

        {/* Performance Insights */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Performance Insights</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Best Performer</p>
                <p className="text-xs text-gray-600">
                  {comparisonData[0]?.bannerTitle || 'N/A'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Eye className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Most Viewed</p>
                <p className="text-xs text-gray-600">
                  {comparisonData.reduce((max, banner) => 
                    banner.impressions > max.impressions ? banner : max, 
                    comparisonData[0] || { impressions: 0, bannerTitle: 'N/A' }
                  ).bannerTitle}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MousePointer className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Most Clicked</p>
                <p className="text-xs text-gray-600">
                  {comparisonData.reduce((max, banner) => 
                    banner.clicks > max.clicks ? banner : max, 
                    comparisonData[0] || { clicks: 0, bannerTitle: 'N/A' }
                  ).bannerTitle}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BannerComparisonChart;
