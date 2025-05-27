import React from 'react';
import { MessageCircle, UserPlus, BookOpen, Users, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ActivityFeedItem } from '@/lib/api/store/communityShowcase';

interface ActivityFeedProps {
  activities: ActivityFeedItem[];
  limit?: number;
}

const ACTIVITY_TYPE_CONFIG = {
  discussion: {
    icon: MessageCircle,
    color: 'bg-blue-100 text-blue-700',
    bgColor: 'bg-blue-50'
  },
  member_join: {
    icon: UserPlus,
    color: 'bg-green-100 text-green-700',
    bgColor: 'bg-green-50'
  },
  book_set: {
    icon: BookOpen,
    color: 'bg-purple-100 text-purple-700',
    bgColor: 'bg-purple-50'
  },
  club_created: {
    icon: Users,
    color: 'bg-orange-100 text-orange-700',
    bgColor: 'bg-orange-50'
  }
};

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, limit = 5 }) => {
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const displayedActivities = activities.slice(0, limit);

  if (displayedActivities.length === 0) {
    return (
      <div className="text-center py-8 text-bookconnect-brown/60">
        <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <p>No recent activity</p>
        <p className="text-sm mt-1">Check back soon for community updates!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {displayedActivities.map((activity) => {
        const config = ACTIVITY_TYPE_CONFIG[activity.type];
        const IconComponent = config.icon;

        return (
          <div
            key={activity.id}
            className={`flex items-start space-x-3 p-3 rounded-lg border border-gray-100 hover:shadow-sm transition-all duration-200 ${config.bgColor}`}
          >
            {/* Activity Icon */}
            <div className={`flex-shrink-0 p-2 rounded-lg ${config.color}`}>
              <IconComponent className="h-4 w-4" />
            </div>

            {/* Activity Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-bookconnect-brown text-sm truncate">
                    {activity.title}
                  </h4>
                  <p className="text-sm text-bookconnect-brown/70 mt-1 leading-relaxed">
                    {activity.description}
                  </p>
                  
                  {/* Additional Context */}
                  <div className="flex items-center space-x-2 mt-2">
                    {activity.user_name && (
                      <Badge variant="outline" className="text-xs">
                        {activity.user_name}
                      </Badge>
                    )}
                    {activity.club_name && (
                      <Badge variant="secondary" className="text-xs bg-bookconnect-sage/20 text-bookconnect-brown">
                        {activity.club_name}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Timestamp */}
                <div className="flex-shrink-0 ml-2">
                  <div className="flex items-center text-xs text-bookconnect-brown/50">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{formatTimeAgo(activity.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Show More Indicator */}
      {activities.length > limit && (
        <div className="text-center pt-2">
          <div className="text-xs text-bookconnect-brown/50">
            Showing {limit} of {activities.length} recent activities
          </div>
        </div>
      )}

      {/* Refresh Indicator */}
      <div className="text-center pt-2 border-t border-gray-100 mt-4">
        <div className="text-xs text-bookconnect-brown/40">
          Activity updates every few minutes
        </div>
      </div>
    </div>
  );
};
