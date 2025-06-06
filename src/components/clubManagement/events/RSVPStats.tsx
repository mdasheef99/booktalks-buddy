/**
 * RSVP Statistics Component
 *
 * Displays attendance analytics for club events.
 * Only visible to users with CAN_MANAGE_CLUB_EVENTS entitlement.
 */

import React from 'react';
import { Users, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useClubEventRSVP } from '@/hooks/clubManagement/useClubEventRSVP';
import { useHasEntitlement } from '@/lib/entitlements/hooks';

// =====================================================
// Types
// =====================================================

interface RSVPStatsProps {
  meetingId: string;
  clubId: string;
  isMember: boolean;
  compact?: boolean;
  className?: string;
}

// =====================================================
// RSVP Stats Component
// =====================================================

const RSVPStats: React.FC<RSVPStatsProps> = ({
  meetingId,
  clubId,
  isMember,
  compact = false,
  className = ''
}) => {
  const { result: canManageEvents } = useHasEntitlement('CAN_MANAGE_CLUB_EVENTS');
  
  const {
    rsvpStats,
    statsLoading,
    statsError
  } = useClubEventRSVP(meetingId, clubId, isMember);

  // Only show to users who can manage club events
  if (!canManageEvents || !isMember) {
    return null;
  }

  if (statsLoading) {
    return (
      <Card className={`${compact ? 'p-3' : 'p-4'} ${className}`}>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </Card>
    );
  }

  if (statsError || !rsvpStats) {
    return (
      <Card className={`${compact ? 'p-3' : 'p-4'} ${className}`}>
        <div className="text-sm text-red-600">
          Failed to load RSVP statistics
        </div>
      </Card>
    );
  }

  const { total_rsvps, going_count, maybe_count, not_going_count, response_rate } = rsvpStats;
  
  // Calculate percentages
  const goingPercentage = total_rsvps > 0 ? (going_count / total_rsvps) * 100 : 0;
  const maybePercentage = total_rsvps > 0 ? (maybe_count / total_rsvps) * 100 : 0;
  const notGoingPercentage = total_rsvps > 0 ? (not_going_count / total_rsvps) * 100 : 0;

  if (compact) {
    return (
      <div className={`flex items-center gap-3 text-sm ${className}`}>
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4 text-gray-500" />
          <span className="font-medium">{total_rsvps}</span>
          <span className="text-gray-500">RSVPs</span>
        </div>
        
        {total_rsvps > 0 && (
          <>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              {going_count} Going
            </Badge>
            
            {maybe_count > 0 && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                <Clock className="h-3 w-3 mr-1" />
                {maybe_count} Maybe
              </Badge>
            )}
            
            <div className="text-gray-500">
              {response_rate.toFixed(0)}% response rate
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          RSVP Statistics
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{total_rsvps}</div>
            <div className="text-sm text-gray-500">Total RSVPs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-bookconnect-terracotta">
              {response_rate.toFixed(0)}%
            </div>
            <div className="text-sm text-gray-500">Response Rate</div>
          </div>
        </div>

        {/* Response Breakdown */}
        {total_rsvps > 0 && (
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-700">Response Breakdown</div>
            
            {/* Going */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Going</span>
                </div>
                <span className="font-medium">{going_count} ({goingPercentage.toFixed(0)}%)</span>
              </div>
              <Progress value={goingPercentage} className="h-2 bg-gray-100">
                <div 
                  className="h-full bg-green-600 rounded-full transition-all duration-300"
                  style={{ width: `${goingPercentage}%` }}
                />
              </Progress>
            </div>

            {/* Maybe */}
            {maybe_count > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span>Maybe</span>
                  </div>
                  <span className="font-medium">{maybe_count} ({maybePercentage.toFixed(0)}%)</span>
                </div>
                <Progress value={maybePercentage} className="h-2 bg-gray-100">
                  <div 
                    className="h-full bg-yellow-500 rounded-full transition-all duration-300"
                    style={{ width: `${maybePercentage}%` }}
                  />
                </Progress>
              </div>
            )}

            {/* Not Going */}
            {not_going_count > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span>Not Going</span>
                  </div>
                  <span className="font-medium">{not_going_count} ({notGoingPercentage.toFixed(0)}%)</span>
                </div>
                <Progress value={notGoingPercentage} className="h-2 bg-gray-100">
                  <div 
                    className="h-full bg-red-600 rounded-full transition-all duration-300"
                    style={{ width: `${notGoingPercentage}%` }}
                  />
                </Progress>
              </div>
            )}
          </div>
        )}

        {/* No RSVPs Message */}
        {total_rsvps === 0 && (
          <div className="text-center py-4 text-gray-500">
            <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <div className="text-sm">No RSVPs yet</div>
            <div className="text-xs">Members will see RSVP options for this event</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RSVPStats;
