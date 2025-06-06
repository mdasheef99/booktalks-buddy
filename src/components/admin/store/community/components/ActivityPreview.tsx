/**
 * Activity Preview Component
 * Display recent community activity with filtering and formatting
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Clock } from 'lucide-react';
import type { ActivityPreviewProps, ActivityItemProps } from '../types/metricsConfigTypes';
import { useActivityDisplay } from '../hooks/useActivityDisplay';
import { useMetricsFormatting } from '../hooks/useMetricsFormatting';
import { 
  getActivityTypeConfig,
  getActivityEmptyStateMessage,
  getActivityCountText
} from '../utils/metricsConfigUtils';
import { 
  UI_TEXT, 
  CSS_CLASSES 
} from '../constants/metricsConfigConstants';

export const ActivityPreview: React.FC<ActivityPreviewProps> = ({
  activities,
  settings,
}) => {
  const { displayedActivities, hasMoreActivities, activityCount } = useActivityDisplay(
    activities, 
    settings
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          {UI_TEXT.HEADERS.ACTIVITY_PREVIEW}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <div className="space-y-3">
            {displayedActivities.map((activity, index) => (
              <ActivityItem
                key={activity.id}
                activity={activity}
                index={index}
              />
            ))}
            
            {hasMoreActivities && (
              <ActivityCountDisplay
                shown={activityCount.shown}
                total={activityCount.total}
              />
            )}
          </div>
        ) : (
          <ActivityEmptyState />
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Individual Activity Item Component
 */
export const ActivityItem: React.FC<ActivityItemProps> = ({
  activity,
  index,
}) => {
  const { formatTimeAgo } = useMetricsFormatting();
  const typeConfig = getActivityTypeConfig(activity.type as any);
  const IconComponent = typeConfig.icon;

  return (
    <div className={CSS_CLASSES.ACTIVITY_ITEM}>
      <div className={`${CSS_CLASSES.ACTIVITY_ICON_CONTAINER} ${typeConfig.bgColor}`}>
        <IconComponent className={`h-4 w-4 ${typeConfig.color}`} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className={CSS_CLASSES.ACTIVITY_TITLE}>
              {activity.title}
            </h4>
            <p className={CSS_CLASSES.ACTIVITY_DESCRIPTION}>
              {activity.description}
            </p>
            
            <div className="flex items-center space-x-2 mt-2">
              {activity.user_name && (
                <Badge variant="outline" className="text-xs">
                  {activity.user_name}
                </Badge>
              )}
              {activity.club_name && (
                <Badge variant="secondary" className="text-xs">
                  {activity.club_name}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex-shrink-0 ml-2">
            <div className={CSS_CLASSES.ACTIVITY_TIME}>
              <Clock className="h-3 w-3 mr-1" />
              <span>{formatTimeAgo(activity.created_at)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Activity Count Display Component
 */
interface ActivityCountDisplayProps {
  shown: number;
  total: number;
}

export const ActivityCountDisplay: React.FC<ActivityCountDisplayProps> = ({
  shown,
  total,
}) => {
  return (
    <div className="text-center pt-2 text-sm text-gray-500">
      {getActivityCountText(shown, total)}
    </div>
  );
};

/**
 * Activity Empty State Component
 */
export const ActivityEmptyState: React.FC = () => {
  const emptyState = getActivityEmptyStateMessage();

  return (
    <div className="text-center py-8 text-gray-500">
      <Activity className={`${CSS_CLASSES.EMPTY_STATE_ICON} text-gray-400`} />
      <p>{emptyState.title}</p>
      <p className="text-sm mt-1">{emptyState.description}</p>
    </div>
  );
};

/**
 * Compact Activity Preview Component
 * Simplified version for smaller spaces
 */
interface CompactActivityPreviewProps {
  activities: any[];
  maxItems?: number;
}

export const CompactActivityPreview: React.FC<CompactActivityPreviewProps> = ({
  activities,
  maxItems = 3,
}) => {
  const { formatTimeAgo } = useMetricsFormatting();
  const displayActivities = activities.slice(0, maxItems);

  if (activities.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        <Activity className="h-8 w-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {displayActivities.map((activity) => {
        const typeConfig = getActivityTypeConfig(activity.type);
        const IconComponent = typeConfig.icon;
        
        return (
          <div key={activity.id} className="flex items-center space-x-2 p-2 border rounded">
            <div className={`p-1 rounded ${typeConfig.bgColor}`}>
              <IconComponent className={`h-3 w-3 ${typeConfig.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{activity.title}</p>
              <p className="text-xs text-gray-500">{formatTimeAgo(activity.created_at)}</p>
            </div>
          </div>
        );
      })}
      
      {activities.length > maxItems && (
        <p className="text-xs text-gray-500 text-center">
          And {activities.length - maxItems} more...
        </p>
      )}
    </div>
  );
};
