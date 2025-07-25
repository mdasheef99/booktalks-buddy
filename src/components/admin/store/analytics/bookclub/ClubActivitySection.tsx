import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import type { ClubActivityMetrics } from '@/lib/api/store/bookClubAnalytics';

interface ClubActivitySectionProps {
  clubActivity: ClubActivityMetrics[];
  maxItems?: number;
}

/**
 * Club Activity Section component for Book Club Analytics
 * Displays most active book clubs in the store
 */
export const ClubActivitySection: React.FC<ClubActivitySectionProps> = ({
  clubActivity,
  maxItems = 5
}) => {
  const displayClubs = clubActivity.slice(0, maxItems);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Club Activity
        </CardTitle>
        <CardDescription>
          Most active book clubs in your store
        </CardDescription>
      </CardHeader>
      <CardContent>
        {displayClubs.length > 0 ? (
          <div className="space-y-4">
            {displayClubs.map((club, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{club.clubName}</h4>
                  {club.currentBookTitle && (
                    <p className="text-sm text-gray-600">
                      Reading: {club.currentBookTitle}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    <span>{club.memberCount} members</span>
                    <span>{club.discussionCount} discussions</span>
                    <span>{club.postCount} posts</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-bookconnect-sage">
                    {club.activityScore.toFixed(0)}
                  </div>
                  <div className="text-xs text-gray-500">activity score</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No club activity found</p>
            <p className="text-sm">Activity will appear as clubs become more engaged</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
