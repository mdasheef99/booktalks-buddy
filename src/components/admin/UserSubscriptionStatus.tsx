/**
 * UserSubscriptionStatus Component
 * 
 * Displays subscription expiration information directly on user cards in the admin panel.
 * Provides visual indicators for subscription status with appropriate styling and formatting.
 * 
 * Created: 2025-01-16
 * Part of: Admin User Management Enhancement
 */

import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { calculateSubscriptionStatus, type SubscriptionStatus } from '@/lib/utils/subscriptionUtils';

interface UserSubscriptionStatusProps {
  userId: string;
  membershipTier: string;
  className?: string;
}

interface SubscriptionData {
  id: string;
  end_date: string;
  is_active: boolean;
  tier: string;
  subscription_type: string;
}

export const UserSubscriptionStatus: React.FC<UserSubscriptionStatusProps> = ({
  userId,
  membershipTier,
  className = ''
}) => {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);

  useEffect(() => {
    async function fetchSubscriptionStatus() {
      setLoading(true);
      
      try {
        // Only fetch subscription data for paid tiers
        if (membershipTier === 'MEMBER') {
          const status = calculateSubscriptionStatus(null, membershipTier);
          setSubscriptionStatus(status);
          setLoading(false);
          return;
        }

        // Fetch the user's active subscription
        const { data: subscriptionData, error } = await supabase
          .from('user_subscriptions')
          .select('id, end_date, is_active, tier, subscription_type')
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('Error fetching subscription status:', error);
          const status = calculateSubscriptionStatus(null, membershipTier);
          setSubscriptionStatus(status);
        } else {
          const activeSubscription = subscriptionData && subscriptionData.length > 0 ? subscriptionData[0] : null;
          setSubscription(activeSubscription);
          
          const status = calculateSubscriptionStatus(
            activeSubscription?.end_date || null,
            membershipTier
          );
          setSubscriptionStatus(status);
        }
      } catch (error) {
        console.error('Error in fetchSubscriptionStatus:', error);
        const status = calculateSubscriptionStatus(null, membershipTier);
        setSubscriptionStatus(status);
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchSubscriptionStatus();
    }
  }, [userId, membershipTier]);

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="animate-pulse flex items-center space-x-2">
          <div className="h-4 w-4 bg-gray-200 rounded"></div>
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!subscriptionStatus) {
    return null;
  }

  const getStatusIcon = () => {
    switch (subscriptionStatus.status) {
      case 'active':
        return <CheckCircle className={`h-4 w-4 ${subscriptionStatus.iconClass}`} />;
      case 'expiring_soon':
        return <AlertTriangle className={`h-4 w-4 ${subscriptionStatus.iconClass}`} />;
      case 'expired':
        return <XCircle className={`h-4 w-4 ${subscriptionStatus.iconClass}`} />;
      case 'no_subscription':
        return <Clock className={`h-4 w-4 ${subscriptionStatus.iconClass}`} />;
      default:
        return <Clock className={`h-4 w-4 ${subscriptionStatus.iconClass}`} />;
    }
  };

  // Don't show subscription status for MEMBER tier users
  if (membershipTier === 'MEMBER') {
    return null;
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`flex items-center space-x-2 px-3 py-1 rounded-md border ${subscriptionStatus.bgColorClass}`}>
        {getStatusIcon()}
        <span className={`text-sm font-medium ${subscriptionStatus.colorClass}`}>
          {subscriptionStatus.formattedTimeRemaining}
        </span>
      </div>
      
      {/* Additional context for subscription type */}
      {subscription && (
        <span className="text-xs text-gray-500">
          ({subscription.subscription_type})
        </span>
      )}
    </div>
  );
};

export default UserSubscriptionStatus;
