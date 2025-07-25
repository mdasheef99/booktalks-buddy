import React from 'react';
import { MetricCard } from '../shared/MetricCard';
import {
  Eye,
  MousePointer,
  Clock,
  Users,
  TrendingUp,
  BarChart3
} from 'lucide-react';

interface LandingPageMetricsGridProps {
  analyticsSummary: any;
}

/**
 * Metrics grid component for Landing Page Analytics
 * Displays key performance indicators for landing page performance
 */
export const LandingPageMetricsGrid: React.FC<LandingPageMetricsGridProps> = ({
  analyticsSummary
}) => {
  if (!analyticsSummary) {
    return null;
  }

  const metrics = [
    {
      title: 'Page Views',
      value: analyticsSummary.totalPageViews || 0,
      subtitle: 'Total visits',
      icon: <Eye className="h-6 w-6" />,
      iconBgColor: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Unique Visitors',
      value: analyticsSummary.uniqueVisitors || 0,
      subtitle: 'Individual users',
      icon: <Users className="h-6 w-6" />,
      iconBgColor: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      title: 'Avg. Time on Page',
      value: `${Math.round(analyticsSummary.avgTimeOnPage || 0)}s`,
      subtitle: 'User engagement',
      icon: <Clock className="h-6 w-6" />,
      iconBgColor: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
    {
      title: 'Bounce Rate',
      value: `${(analyticsSummary.bounceRate || 0).toFixed(1)}%`,
      subtitle: 'Single page visits',
      icon: <TrendingUp className="h-6 w-6" />,
      iconBgColor: 'bg-orange-100',
      iconColor: 'text-orange-600'
    },
    {
      title: 'Click-through Rate',
      value: `${(analyticsSummary.clickThroughRate || 0).toFixed(1)}%`,
      subtitle: 'User interactions',
      icon: <MousePointer className="h-6 w-6" />,
      iconBgColor: 'bg-yellow-100',
      iconColor: 'text-yellow-600'
    },
    {
      title: 'Performance Score',
      value: analyticsSummary.performanceScore || 0,
      subtitle: 'Overall rating',
      icon: <BarChart3 className="h-6 w-6" />,
      iconBgColor: 'bg-indigo-100',
      iconColor: 'text-indigo-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
      {metrics.map((metric, index) => (
        <MetricCard
          key={index}
          title={metric.title}
          value={metric.value}
          subtitle={metric.subtitle}
          icon={metric.icon}
          iconBgColor={metric.iconBgColor}
          iconColor={metric.iconColor}
        />
      ))}
    </div>
  );
};
