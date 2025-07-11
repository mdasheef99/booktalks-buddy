/**
 * Premium Feature Gate Component
 * 
 * Controls access to premium features based on subscription status and entitlements
 */

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Crown, Star, ArrowRight, AlertTriangle } from 'lucide-react';

interface PremiumFeatureGateProps {
  feature: string;
  requiredTier?: 'PRIVILEGED' | 'PRIVILEGED_PLUS';
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
  featureName?: string;
  featureDescription?: string;
  className?: string;
}

export function PremiumFeatureGate({
  feature,
  requiredTier,
  children,
  fallback,
  showUpgradePrompt = true,
  featureName,
  featureDescription,
  className = ''
}: PremiumFeatureGateProps) {
  const { 
    canAccessFeature, 
    hasRequiredTier, 
    getSubscriptionStatusWithContext,
    hasValidSubscription 
  } = useAuth();

  const statusContext = getSubscriptionStatusWithContext();
  const hasFeatureAccess = canAccessFeature(feature);
  const hasTierAccess = requiredTier ? hasRequiredTier(requiredTier) : true;

  // If user has access, render the feature
  if (hasFeatureAccess && hasTierAccess) {
    return <>{children}</>;
  }

  // If custom fallback is provided, use it
  if (fallback) {
    return <>{fallback}</>;
  }

  // If upgrade prompt is disabled, render nothing
  if (!showUpgradePrompt) {
    return null;
  }

  // Determine the required tier for messaging
  const getRequiredTierInfo = () => {
    if (requiredTier === 'PRIVILEGED_PLUS') {
      return {
        name: 'Privileged Plus',
        icon: Crown,
        color: 'from-purple-500 to-pink-500'
      };
    }
    if (requiredTier === 'PRIVILEGED') {
      return {
        name: 'Privileged',
        icon: Star,
        color: 'from-blue-500 to-cyan-500'
      };
    }
    return {
      name: 'Premium',
      icon: Lock,
      color: 'from-gray-500 to-gray-600'
    };
  };

  const tierInfo = getRequiredTierInfo();
  const TierIcon = tierInfo.icon;

  // Render upgrade prompt
  return (
    <Card className={`border-dashed border-2 ${className}`}>
      <CardHeader className="text-center">
        <div className="mx-auto mb-2">
          <div className={`inline-flex p-3 rounded-full bg-gradient-to-r ${tierInfo.color}`}>
            <TierIcon className="h-6 w-6 text-white" />
          </div>
        </div>
        <CardTitle className="flex items-center justify-center space-x-2">
          <span>{featureName || 'Premium Feature'}</span>
          <Badge variant="secondary">{tierInfo.name}</Badge>
        </CardTitle>
        <CardDescription>
          {featureDescription || `This feature requires a ${tierInfo.name} subscription to access.`}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Current Tier</span>
            <Badge variant="outline">{statusContext.tier}</Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Subscription Status</span>
            <Badge variant={statusContext.hasActiveSubscription ? 'default' : 'destructive'}>
              {statusContext.hasActiveSubscription ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>

        {/* Upgrade Message */}
        <div className="text-center space-y-3">
          {statusContext.needsUpgrade ? (
            <>
              <div className="flex items-center justify-center space-x-2 text-amber-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Subscription Required</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Upgrade to {tierInfo.name} to unlock this feature and many more.
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center space-x-2 text-blue-600">
                <ArrowRight className="h-4 w-4" />
                <span className="text-sm font-medium">Tier Upgrade Available</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Upgrade to {tierInfo.name} to access this premium feature.
              </p>
            </>
          )}

          {/* Upgrade Button */}
          <Button 
            className="w-full"
            onClick={() => {
              // TODO: Implement upgrade flow
              console.log(`Navigate to upgrade page for ${tierInfo.name}`);
            }}
          >
            <Crown className="h-4 w-4 mr-2" />
            Upgrade to {tierInfo.name}
          </Button>
        </div>

        {/* Feature Preview (if applicable) */}
        <div className="border-t pt-4">
          <p className="text-xs text-muted-foreground text-center">
            Preview available features and pricing in your account settings.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Convenience wrapper for specific premium features
export function PremiumClubCreation({ children, ...props }: Omit<PremiumFeatureGateProps, 'feature' | 'requiredTier'>) {
  return (
    <PremiumFeatureGate
      feature="CAN_CREATE_LIMITED_CLUBS"
      requiredTier="PRIVILEGED"
      featureName="Club Creation"
      featureDescription="Create and manage your own book clubs with Privileged membership."
      {...props}
    >
      {children}
    </PremiumFeatureGate>
  );
}

export function PremiumContentAccess({ children, ...props }: Omit<PremiumFeatureGateProps, 'feature' | 'requiredTier'>) {
  return (
    <PremiumFeatureGate
      feature="CAN_ACCESS_PREMIUM_CONTENT"
      requiredTier="PRIVILEGED"
      featureName="Premium Content"
      featureDescription="Access exclusive content and premium discussions."
      {...props}
    >
      {children}
    </PremiumFeatureGate>
  );
}

export function ExclusiveFeatureAccess({ children, ...props }: Omit<PremiumFeatureGateProps, 'feature' | 'requiredTier'>) {
  return (
    <PremiumFeatureGate
      feature="CAN_ACCESS_EXCLUSIVE_CONTENT"
      requiredTier="PRIVILEGED_PLUS"
      featureName="Exclusive Features"
      featureDescription="Access our most exclusive content and features with Privileged Plus."
      {...props}
    >
      {children}
    </PremiumFeatureGate>
  );
}
