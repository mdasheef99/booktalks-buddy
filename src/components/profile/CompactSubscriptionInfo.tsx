/**
 * Compact Subscription Info Component
 * 
 * Displays subscription information in a compact format suitable for the profile dialog
 */

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Star, User, RefreshCw, TrendingUp } from 'lucide-react';

interface CompactSubscriptionInfoProps {
  className?: string;
}

export default function CompactSubscriptionInfo({ className = '' }: CompactSubscriptionInfoProps) {
  const { 
    subscriptionStatus, 
    subscriptionLoading, 
    getSubscriptionStatusWithContext,
    refreshSubscriptionStatus 
  } = useAuth();

  const statusContext = getSubscriptionStatusWithContext();

  // Get tier-specific styling and icons
  const getTierConfig = (tier: string) => {
    switch (tier) {
      case 'PRIVILEGED_PLUS':
        return {
          icon: Crown,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          label: 'Privileged Plus'
        };
      case 'PRIVILEGED':
        return {
          icon: Star,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          label: 'Privileged'
        };
      default:
        return {
          icon: User,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          label: 'Member'
        };
    }
  };

  const tierConfig = getTierConfig(statusContext.tier);
  const TierIcon = tierConfig.icon;

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center space-x-2">
          <TierIcon className={`h-4 w-4 ${tierConfig.color}`} />
          <span>Subscription</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Current Tier */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Current Tier</span>
          <Badge 
            variant="outline" 
            className={`${tierConfig.bgColor} ${tierConfig.borderColor} ${tierConfig.color}`}
          >
            {tierConfig.label}
          </Badge>
        </div>

        {/* Subscription Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status</span>
          <Badge 
            variant={statusContext.hasActiveSubscription ? 'default' : 'destructive'}
            className="text-xs"
          >
            {statusContext.hasActiveSubscription ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        {/* Expiry Date (if available) */}
        {statusContext.expiryDate && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Expires</span>
            <span className="text-xs text-muted-foreground">
              {new Date(statusContext.expiryDate).toLocaleDateString()}
            </span>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex space-x-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshSubscriptionStatus}
            disabled={subscriptionLoading}
            className="flex-1 text-xs"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${subscriptionLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          {statusContext.needsUpgrade && (
            <Button 
              size="sm" 
              onClick={() => console.log('Navigate to upgrade')}
              className="flex-1 text-xs"
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              Upgrade
            </Button>
          )}
        </div>

        {/* Context Message */}
        <div className="text-xs text-muted-foreground text-center pt-1">
          {statusContext.context}
        </div>
      </CardContent>
    </Card>
  );
}
