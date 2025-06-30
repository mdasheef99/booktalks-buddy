import React, { useState, useEffect, useRef } from 'react';
import { Users } from 'lucide-react';
import { clubMembersService } from '@/lib/services/clubMembersService';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface ClubMemberCountProps {
  clubId: string;
  initialCount?: number;
  size: 'small' | 'medium' | 'large';
  showIcon?: boolean;
  realTimeUpdates?: boolean;
  className?: string;
}

export const ClubMemberCount: React.FC<ClubMemberCountProps> = ({
  clubId,
  initialCount = 0,
  size,
  showIcon = true,
  realTimeUpdates = true,
  className = ""
}) => {
  const [memberCount, setMemberCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const subscriptionRef = useRef<RealtimeChannel | null>(null);

  // Size classes
  const sizeClasses = {
    small: {
      text: 'text-xs',
      icon: 'h-3 w-3',
      gap: 'gap-1'
    },
    medium: {
      text: 'text-sm',
      icon: 'h-4 w-4',
      gap: 'gap-1.5'
    },
    large: {
      text: 'text-base',
      icon: 'h-5 w-5',
      gap: 'gap-2'
    }
  };

  const currentSize = sizeClasses[size];

  useEffect(() => {
    let isMounted = true;
    let subscription: RealtimeChannel | null = null;

    const setupMemberCount = async () => {
      if (!clubId || !isMounted) return;

      setLoading(true);

      try {
        if (realTimeUpdates) {
          // ✅ FIXED: Clean up any existing subscription first
          if (subscriptionRef.current) {
            subscriptionRef.current.unsubscribe();
            subscriptionRef.current = null;
          }

          // ✅ FIXED: Create subscription with unique channel name and proper setup
          subscription = supabase
            .channel(`member_count_${clubId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
            .on('postgres_changes', {
              event: '*',
              schema: 'public',
              table: 'club_members',
              filter: `club_id=eq.${clubId}`
            }, async () => {
              // Only update if component is still mounted
              if (isMounted) {
                try {
                  const updatedCount = await clubMembersService.getMemberCountCached(clubId);
                  setMemberCount(updatedCount);
                } catch (error) {
                  console.warn('Error updating member count:', error);
                }
              }
            })
            .subscribe();

          // Store subscription reference
          if (isMounted) {
            subscriptionRef.current = subscription;
          }

          // Get initial count
          const count = await clubMembersService.getMemberCountCached(clubId);
          if (isMounted) {
            setMemberCount(count);
          }
        } else {
          // Get cached count only
          const count = await clubMembersService.getMemberCountCached(clubId);
          if (isMounted) {
            setMemberCount(count);
          }
        }
      } catch (error) {
        console.error('Error setting up member count:', error);
        // Keep initial count on error - don't break the UI
        if (isMounted) {
          setMemberCount(initialCount);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    setupMemberCount();

    // ✅ FIXED: Enhanced cleanup function
    return () => {
      isMounted = false;
      if (subscription) {
        try {
          subscription.unsubscribe();
        } catch (error) {
          console.warn('Error unsubscribing from member count:', error);
        }
      }
      if (subscriptionRef.current) {
        try {
          subscriptionRef.current.unsubscribe();
        } catch (error) {
          console.warn('Error unsubscribing from member count ref:', error);
        } finally {
          subscriptionRef.current = null;
        }
      }
    };
  }, [clubId, realTimeUpdates, initialCount]);

  // Format member count for display
  const formatCount = (count: number): string => {
    if (count === 0) return '0 members';
    if (count === 1) return '1 member';
    if (count < 1000) return `${count} members`;
    if (count < 10000) return `${(count / 1000).toFixed(1)}k members`;
    return `${Math.floor(count / 1000)}k members`;
  };

  return (
    <div className={`
      flex items-center ${currentSize.gap} text-gray-600
      ${loading ? 'animate-pulse' : ''}
      ${className}
    `}>
      {showIcon && (
        <Users className={`${currentSize.icon} flex-shrink-0`} />
      )}
      <span className={`${currentSize.text} font-medium`}>
        {loading ? '...' : formatCount(memberCount)}
      </span>
    </div>
  );
};

export default ClubMemberCount;
