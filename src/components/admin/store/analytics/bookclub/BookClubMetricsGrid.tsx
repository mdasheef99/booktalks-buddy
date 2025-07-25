import React from 'react';
import { MetricCard } from '../shared/MetricCard';
import {
  Users,
  BookOpen,
  MessageSquare,
  Activity,
  TrendingUp,
  Target
} from 'lucide-react';
import type { BookClubAnalyticsSummary } from '@/lib/api/store/bookClubAnalytics';

interface BookClubMetricsGridProps {
  summary: BookClubAnalyticsSummary | undefined;
}

/**
 * Metrics grid component for Book Club Analytics
 * Displays key performance indicators in a responsive grid layout
 */
export const BookClubMetricsGrid: React.FC<BookClubMetricsGridProps> = ({
  summary
}) => {
  const metrics = [
    {
      title: 'Active Clubs',
      value: summary?.activeClubsCount || 0,
      subtitle: summary?.period,
      icon: <Users className="h-6 w-6" />,
      iconBgColor: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Current Books',
      value: summary?.currentBooksCount || 0,
      subtitle: 'Being discussed',
      icon: <BookOpen className="h-6 w-6" />,
      iconBgColor: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      title: 'Discussions',
      value: summary?.totalDiscussionsCount || 0,
      subtitle: 'Total topics',
      icon: <MessageSquare className="h-6 w-6" />,
      iconBgColor: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
    {
      title: 'Posts',
      value: summary?.totalPostsCount || 0,
      subtitle: 'Total messages',
      icon: <Activity className="h-6 w-6" />,
      iconBgColor: 'bg-orange-100',
      iconColor: 'text-orange-600'
    },
    {
      title: 'Engagement',
      value: summary?.avgPostsPerDiscussion?.toFixed(1) || '0.0',
      subtitle: 'Posts per topic',
      icon: <TrendingUp className="h-6 w-6" />,
      iconBgColor: 'bg-yellow-100',
      iconColor: 'text-yellow-600'
    },
    {
      title: 'Members',
      value: summary?.totalMembersCount || 0,
      subtitle: 'Active participants',
      icon: <Target className="h-6 w-6" />,
      iconBgColor: 'bg-indigo-100',
      iconColor: 'text-indigo-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
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
