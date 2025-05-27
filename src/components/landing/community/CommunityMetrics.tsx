import React from 'react';
import { Users, BookOpen, MessageCircle, TrendingUp, UserPlus } from 'lucide-react';
import { CommunityMetrics as CommunityMetricsType } from '@/lib/api/store/communityShowcase';

interface CommunityMetricsProps {
  metrics: CommunityMetricsType;
}

interface MetricCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  suffix?: string;
  color: string;
  description: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  icon: Icon, 
  label, 
  value, 
  suffix = '', 
  color, 
  description 
}) => {
  const formatValue = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  return (
    <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-lg p-4 border border-gray-100 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-bookconnect-brown">
            {formatValue(value)}{suffix}
          </div>
        </div>
      </div>
      <div>
        <h4 className="font-medium text-bookconnect-brown text-sm mb-1">
          {label}
        </h4>
        <p className="text-xs text-bookconnect-brown/60 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
};

export const CommunityMetrics: React.FC<CommunityMetricsProps> = ({ metrics }) => {
  const metricCards = [
    {
      icon: Users,
      label: 'Active Members',
      value: metrics.active_members,
      color: 'bg-blue-500',
      description: 'Community members participating in book clubs'
    },
    {
      icon: BookOpen,
      label: 'Book Clubs',
      value: metrics.total_clubs,
      color: 'bg-green-500',
      description: 'Active reading groups and discussion circles'
    },
    {
      icon: MessageCircle,
      label: 'Recent Discussions',
      value: metrics.recent_discussions,
      color: 'bg-purple-500',
      description: 'New topics started in the last 30 days'
    },
    {
      icon: TrendingUp,
      label: 'Books This Month',
      value: metrics.books_discussed_this_month,
      color: 'bg-orange-500',
      description: 'Books currently being read and discussed'
    },
    {
      icon: UserPlus,
      label: 'New Members',
      value: metrics.new_members_this_month,
      color: 'bg-pink-500',
      description: 'Fresh faces who joined us this month'
    }
  ];

  // Show a subset of metrics on smaller screens
  const featuredMetrics = metricCards.slice(0, 4);

  return (
    <div className="space-y-4">
      {/* Main Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        {featuredMetrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      {/* Additional Metric for larger screens */}
      <div className="hidden sm:block">
        <MetricCard {...metricCards[4]} />
      </div>

      {/* Summary Text */}
      <div className="bg-gradient-to-r from-bookconnect-sage/10 to-bookconnect-cream/20 rounded-lg p-4 mt-4">
        <div className="text-center">
          <p className="text-sm text-bookconnect-brown/80 leading-relaxed">
            {metrics.active_members > 0 ? (
              <>
                Our thriving community of <strong>{metrics.active_members}</strong> members 
                across <strong>{metrics.total_clubs}</strong> book clubs has generated{' '}
                <strong>{metrics.recent_discussions}</strong> discussions this month.
                {metrics.new_members_this_month > 0 && (
                  <> We've welcomed <strong>{metrics.new_members_this_month}</strong> new readers recently!</>
                )}
              </>
            ) : (
              'Join our growing community of book lovers and start your reading journey with us.'
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
