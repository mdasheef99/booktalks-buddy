/**
 * Subscription Status Component
 * 
 * Displays current subscription status with tier information and upgrade options
 */

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, Star, User, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface SubscriptionStatusProps {
  showUpgradeButton?: boolean;
  compact?: boolean;
  className?: string;
}

export function SubscriptionStatus({ 
  showUpgradeButton = true, 
  compact = false, 
  className = '' 
}: SubscriptionStatusProps) {
  const { 
    subscriptionStatus, 
    subscriptionLoading, 
    getSubscriptionStatusWithContext,
    refreshSubscriptionStatus 
  } = useAuth();

  const statusContext = getSubscriptionStatusWithContext();

  // Loading state
  if (subscriptionLoading) {
    return (
      <Card className={`${className} animate-pulse`}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Loading subscription status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get tier-specific styling and icons
  const getTierConfig = (tier: string) => {
    switch (tier) {
      case 'PRIVILEGED_PLUS':
        return {
          icon: Crown,
          color: 'bg-gradient-to-r from-purple-500 to-pink-500',
          textColor: 'text-white',
          badgeVariant: 'default' as const,
          label: 'Privileged Plus',
          description: 'Premium access to all features'
        };
      case 'PRIVILEGED':
        return {
          icon: Star,
          color: 'bg-gradient-to-r from-blue-500 to-cyan-500',
          textColor: 'text-white',
          badgeVariant: 'secondary' as const,
          label: 'Privileged',
          description: 'Enhanced features and club access'
        };
      default:
        return {
          icon: User,
          color: 'bg-gray-100',
          textColor: 'text-gray-700',
          badgeVariant: 'outline' as const,
          label: 'Member',
          description: 'Basic access to community features'
        };
    }
  };

  const tierConfig = getTierConfig(statusContext.tier);
  const TierIcon = tierConfig.icon;

  // Compact view for navigation or small spaces
  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Badge variant={tierConfig.badgeVariant} className="flex items-center space-x-1">
          <TierIcon className="h-3 w-3" />
          <span>{tierConfig.label}</span>
        </Badge>
        {statusContext.needsUpgrade && (
          <AlertCircle className="h-4 w-4 text-amber-500" title="Subscription required" />
        )}
      </div>
    );
  }

  // Full card view
  return (
    <Card className={className}>
      <CardHeader className={`${tierConfig.color} ${tierConfig.textColor} rounded-t-lg`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TierIcon className="h-5 w-5" />
            <CardTitle className="text-lg">{tierConfig.label}</CardTitle>
          </div>
          <div className="flex items-center space-x-1">
            {statusContext.hasActiveSubscription ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
          </div>
        </div>
        <CardDescription className={`${tierConfig.textColor} opacity-90`}>
          {tierConfig.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-4 space-y-4">
        {/* Subscription Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status</span>
            <Badge 
              variant={statusContext.hasActiveSubscription ? 'default' : 'destructive'}
              className="text-xs"
            >
              {statusContext.hasActiveSubscription ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          
          {statusContext.expiryDate && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Expires</span>
              <span className="text-xs text-muted-foreground">
                {new Date(statusContext.expiryDate).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {/* Context Message */}
        <div className="text-sm text-muted-foreground">
          {statusContext.context}
        </div>

        {/* Upgrade Button */}
        {showUpgradeButton && statusContext.needsUpgrade && statusContext.canUpgrade && (
          <Button 
            className="w-full" 
            onClick={() => {
              // TODO: Implement upgrade flow
              console.log('Navigate to upgrade page');
            }}
          >
            Upgrade Subscription
          </Button>
        )}

        {/* Refresh Button */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refreshSubscriptionStatus}
          className="w-full"
        >
          Refresh Status
        </Button>
      </CardContent>
    </Card>
  );
}

// Export compact version as separate component
export function CompactSubscriptionStatus(props: Omit<SubscriptionStatusProps, 'compact'>) {
  return <SubscriptionStatus {...props} compact={true} />;
}
