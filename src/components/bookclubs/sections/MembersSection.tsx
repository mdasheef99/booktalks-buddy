import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import UserAvatar from '@/components/common/UserAvatar';
import UserName from '@/components/common/UserName';
import { Database } from '@/integrations/supabase/types';
import { ProgressIndicator, MemberProgressSummary, useProgressRealtime } from '@/components/bookclubs/progress';
import { useAuth } from '@/contexts/AuthContext';

type ClubMember = Database['public']['Tables']['club_members']['Row'];

interface MembersSectionProps {
  members: ClubMember[];
  clubId: string;
}

const MembersSection: React.FC<MembersSectionProps> = ({ members, clubId }) => {
  const { user } = useAuth();

  // Real-time progress tracking
  const {
    memberProgress,
    progressTrackingEnabled,
    loading: progressLoading
  } = useProgressRealtime({
    clubId,
    userId: user?.id || '',
    enabled: !!user?.id,
    showToasts: false, // Don't show toasts in members section to avoid spam
    onMemberProgressUpdate: (progress) => {
      // Progress is automatically updated via the hook
    }
  });

  // Helper function to get progress for a specific member
  const getMemberProgress = (userId: string) => {
    return memberProgress.find(p => p.user_id === userId);
  };
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
        <Users className="h-5 w-5" />
        Members ({members.length})
      </h2>
      <div className="space-y-3">
        {members.map((member) => {
          const progress = getMemberProgress(member.user_id);

          return (
            <div key={member.user_id} className="flex items-center gap-3">
              <UserAvatar userId={member.user_id} size="sm" />
              <div className="flex-1">
                <UserName
                  userId={member.user_id}
                  linkToProfile
                  withRole={member.role}
                  displayFormat="full"
                  showTierBadge={true}
                />
              </div>

              {/* Progress indicator - only show if tracking is enabled */}
              {progressTrackingEnabled && (
                <div className="flex items-center gap-2">
                  {progress ? (
                    <ProgressIndicator
                      status={progress.status}
                      progressDisplay={progress.progress_display}
                      isPrivate={progress.is_private}
                      size="sm"
                      lastUpdated={progress.last_updated}
                    />
                  ) : (
                    <ProgressIndicator
                      status="not_started"
                      progressDisplay="Not Started"
                      isPrivate={false}
                      size="sm"
                      showTooltip={false}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default MembersSection;
