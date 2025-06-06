import React, { useState, useEffect, useRef } from 'react';
import { Users } from 'lucide-react';
import { clubMembersService } from '@/lib/services/clubMembersService';
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
    const setupMemberCount = async () => {
      if (!clubId) return;

      setLoading(true);

      try {
        if (realTimeUpdates) {
          // Set up real-time subscription
          const { count, subscription } = await clubMembersService.getMemberCountRealtime(clubId);
          setMemberCount(count);
          subscriptionRef.current = subscription;

          // Listen for count updates
          subscription.on('postgres_changes', async () => {
            const updatedCount = await clubMembersService.getMemberCountCached(clubId);
            setMemberCount(updatedCount);
          });
        } else {
          // Get cached count only
          const count = await clubMembersService.getMemberCountCached(clubId);
          setMemberCount(count);
        }
      } catch (error) {
        console.error('Error setting up member count:', error);
        // Keep initial count on error
      } finally {
        setLoading(false);
      }
    };

    setupMemberCount();

    // Cleanup subscription on unmount
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [clubId, realTimeUpdates]);

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
