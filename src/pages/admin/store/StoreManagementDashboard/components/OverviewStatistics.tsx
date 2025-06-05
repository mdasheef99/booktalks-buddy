/**
 * Overview Statistics Component
 * 
 * Displays key statistics cards for the dashboard
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  BookOpen,
  Megaphone,
  Quote,
  Users,
  BarChart3
} from 'lucide-react';
import type { OverviewStatisticsProps, StatisticsCardProps } from '../types';

/**
 * Statistics Card Component
 */
const StatisticsCard: React.FC<StatisticsCardProps> = ({
  title,
  value,
  icon: Icon,
  iconColor,
  iconBgColor,
  subtitle
}) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500">{subtitle}</p>
            )}
          </div>
          <div className={`h-12 w-12 ${iconBgColor} rounded-lg flex items-center justify-center`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Overview Statistics Component
 */
export const OverviewStatistics: React.FC<OverviewStatisticsProps> = ({
  stats,
  analyticsMetrics
}) => {
  const statisticsCards = [
    {
      title: 'Carousel Books',
      value: `${stats.carousel.active}/${stats.carousel.max}`,
      icon: BookOpen,
      iconColor: 'text-blue-600',
      iconBgColor: 'bg-blue-100'
    },
    {
      title: 'Active Banners',
      value: stats.banners.active,
      icon: Megaphone,
      iconColor: 'text-orange-600',
      iconBgColor: 'bg-orange-100'
    },
    {
      title: 'Active Quotes',
      value: stats.quotes.active,
      icon: Quote,
      iconColor: 'text-green-600',
      iconBgColor: 'bg-green-100'
    },
    {
      title: 'Community Features',
      value: stats.community.spotlights,
      icon: Users,
      iconColor: 'text-purple-600',
      iconBgColor: 'bg-purple-100'
    },
    {
      title: 'Page Views',
      value: analyticsMetrics.pageViews || 0,
      icon: BarChart3,
      iconColor: 'text-indigo-600',
      iconBgColor: 'bg-indigo-100',
      subtitle: `Last 7 days • ${analyticsMetrics.hasData ? 'Active' : 'No data'}`
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {statisticsCards.map((card, index) => (
        <StatisticsCard
          key={index}
          title={card.title}
          value={card.value}
          icon={card.icon}
          iconColor={card.iconColor}
          iconBgColor={card.iconBgColor}
          subtitle={card.subtitle}
        />
      ))}
    </div>
  );
};
