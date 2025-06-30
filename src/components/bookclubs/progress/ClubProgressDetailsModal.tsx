/**
 * Club Progress Details Modal Component
 * 
 * Displays detailed member progress information organized by reading status.
 * Shows only public progress data while respecting privacy settings.
 */

import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  BookOpen, 
  CheckCircle, 
  Clock, 
  Circle,
  X,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import UserAvatar from '@/components/common/UserAvatar';
import UserName from '@/components/common/UserName';
import ProgressIndicator from './ProgressIndicator';
import { getClubReadingProgress } from '@/lib/api/bookclubs/progress';
import type { MemberProgressSummary, ClubProgressStats } from '@/lib/api/bookclubs/progress/types';
import { useAuth } from '@/contexts/AuthContext';
import { useProgressRealtime } from './hooks/useProgressRealtime';

interface ClubProgressDetailsModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  
  /** Function to close the modal */
  onClose: () => void;
  
  /** Club ID to fetch progress for */
  clubId: string;
  
  /** Optional book ID to filter progress */
  bookId?: string;
  
  /** Club statistics for header display */
  clubStats: ClubProgressStats | null;

  /** Optional callback when member progress updates */
  onMemberProgressUpdate?: (progress: MemberProgressSummary[]) => void;

  /** Additional CSS classes */
  className?: string;
}

interface GroupedProgress {
  not_started: MemberProgressSummary[];
  reading: MemberProgressSummary[];
  finished: MemberProgressSummary[];
}

const ClubProgressDetailsModal: React.FC<ClubProgressDetailsModalProps> = ({
  isOpen,
  onClose,
  clubId,
  bookId,
  clubStats,
  onMemberProgressUpdate,
  className
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [memberProgress, setMemberProgress] = useState<MemberProgressSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ✅ FIXED: Real-time progress tracking for the modal with unique component ID
  const {
    memberProgress: realtimeMemberProgress,
    loading: realtimeLoading
  } = useProgressRealtime({
    clubId,
    userId: user?.id || '',
    enabled: isOpen && !!user?.id,
    showToasts: false, // Don't show toasts in modal
    componentId: 'progress-details-modal', // Unique identifier to prevent subscription conflicts
    onMemberProgressUpdate: (progress) => {
      // Filter out private progress and update state
      const publicProgress = progress.filter(p => !p.is_private);
      setMemberProgress(publicProgress);
      onMemberProgressUpdate?.(publicProgress);
    }
  });

  // Use real-time data when available, fallback to manual fetch
  useEffect(() => {
    if (realtimeMemberProgress.length > 0) {
      // Use real-time data and filter out private progress
      const publicProgress = realtimeMemberProgress.filter(p => !p.is_private);
      setMemberProgress(publicProgress);
      setLoading(false);
      setError(null);
    } else if (isOpen && user?.id && clubId && !realtimeLoading) {
      // Fallback to manual fetch if real-time data not available
      const fetchMemberProgress = async () => {
        setLoading(true);
        setError(null);

        try {
          const progress = await getClubReadingProgress(user.id, clubId, bookId);

          // Filter out private progress (only show public progress)
          const publicProgress = progress.filter(p => !p.is_private);
          setMemberProgress(publicProgress);
        } catch (err) {
          console.error('Error fetching member progress:', err);
          setError('Failed to load member progress. Please try again.');
        } finally {
          setLoading(false);
        }
      };

      fetchMemberProgress();
    }
  }, [isOpen, user?.id, clubId, bookId, realtimeMemberProgress, realtimeLoading]);

  // Group members by reading status
  const groupedProgress: GroupedProgress = memberProgress.reduce(
    (groups, member) => {
      groups[member.status].push(member);
      return groups;
    },
    { not_started: [], reading: [], finished: [] } as GroupedProgress
  );

  // Format last updated date
  const formatLastUpdated = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  // Render member card
  const renderMemberCard = (member: MemberProgressSummary) => (
    <Card key={member.user_id} className="p-3 hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <UserAvatar 
            userId={member.user_id} 
            size="md" 
            showTooltip={false}
            className="flex-shrink-0"
          />
          
          {/* Member info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <UserName
                userId={member.user_id}
                linkToProfile
                displayFormat="full"
                showTierBadge={true}
                className="font-medium text-sm"
              />
              <ProgressIndicator
                status={member.status}
                progressDisplay={member.progress_display}
                isPrivate={member.is_private}
                size="sm"
                showTooltip={false}
              />
            </div>
            
            {/* Progress details */}
            <div className="text-sm text-gray-600 mb-1">
              {member.progress_display}
            </div>
            
            {/* Last updated */}
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar className="h-3 w-3" />
              {formatLastUpdated(member.last_updated)}
            </div>
          </div>
        </div>
        
        {/* Notes (if available and not private) */}
        {member.user?.username && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-start gap-1 text-xs text-gray-600">
              <MessageSquare className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span className="italic">
                Reading notes are private to each member
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Render progress section
  const renderProgressSection = (
    title: string, 
    members: MemberProgressSummary[], 
    icon: React.ReactNode,
    badgeColor: string
  ) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="font-medium text-gray-900">{title}</h3>
        <Badge variant="secondary" className={cn("text-xs", badgeColor)}>
          {members.length}
        </Badge>
      </div>
      
      {members.length > 0 ? (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {members.map(renderMemberCard)}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500 text-sm">
          No members in this category
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={cn(
          "max-w-4xl max-h-[90vh] overflow-hidden flex flex-col",
          "sm:max-w-3xl w-[95vw] sm:w-full",
          className
        )}
        aria-describedby="club-progress-description"
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-bookconnect-terracotta" />
            Club Reading Progress Details
          </DialogTitle>
          <DialogDescription id="club-progress-description">
            View detailed reading progress for all club members. Only public progress is shown.
          </DialogDescription>
          
          {/* Summary stats */}
          {clubStats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="font-semibold text-bookconnect-terracotta">{clubStats.total_members}</div>
                <div className="text-xs text-gray-600">Total</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-green-600">{clubStats.finished_count}</div>
                <div className="text-xs text-gray-600">Finished</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-blue-600">{clubStats.reading_count}</div>
                <div className="text-xs text-gray-600">Reading</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-bookconnect-terracotta">{clubStats.completion_percentage}%</div>
                <div className="text-xs text-gray-600">Complete</div>
              </div>
            </div>
          )}
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-6 mt-4">
          {(loading || realtimeLoading) ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bookconnect-terracotta mx-auto mb-2"></div>
              <p className="text-gray-600">Loading member progress...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-2">{error}</p>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                size="sm"
              >
                Try Again
              </Button>
            </div>
          ) : (
            <>
              {/* Finished Section */}
              {renderProgressSection(
                'Finished Reading',
                groupedProgress.finished,
                <CheckCircle className="h-4 w-4 text-green-600" />,
                'bg-green-100 text-green-800'
              )}

              {/* Currently Reading Section */}
              {renderProgressSection(
                'Currently Reading',
                groupedProgress.reading,
                <Clock className="h-4 w-4 text-blue-600" />,
                'bg-blue-100 text-blue-800'
              )}

              {/* Not Started Section */}
              {renderProgressSection(
                'Not Started',
                groupedProgress.not_started,
                <Circle className="h-4 w-4 text-gray-500" />,
                'bg-gray-100 text-gray-800'
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex justify-between items-center pt-4 border-t">
          <p className="text-xs text-gray-500">
            Only public progress is shown • Private progress is hidden
          </p>
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClubProgressDetailsModal;
