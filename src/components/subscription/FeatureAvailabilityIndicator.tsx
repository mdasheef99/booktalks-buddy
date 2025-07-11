/**
 * Feature Availability Indicator Component
 * 
 * Shows visual indicators for feature availability based on subscription status
 */

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Check, 
  Lock, 
  Crown, 
  Star, 
  AlertCircle, 
  Info,
  Zap
} from 'lucide-react';

interface FeatureAvailabilityIndicatorProps {
  feature: string;
  requiredTier?: 'PRIVILEGED' | 'PRIVILEGED_PLUS';
  variant?: 'badge' | 'icon' | 'text' | 'full';
  showTooltip?: boolean;
  featureName?: string;
  className?: string;
}

export function FeatureAvailabilityIndicator({
  feature,
  requiredTier,
  variant = 'badge',
  showTooltip = true,
  featureName,
  className = ''
}: FeatureAvailabilityIndicatorProps) {
  const { 
    canAccessFeature, 
    hasRequiredTier, 
    getSubscriptionStatusWithContext 
  } = useAuth();

  const statusContext = getSubscriptionStatusWithContext();
  const hasFeatureAccess = canAccessFeature(feature);
  const hasTierAccess = requiredTier ? hasRequiredTier(requiredTier) : true;
  const hasFullAccess = hasFeatureAccess && hasTierAccess;

  // Determine the status and styling
  const getFeatureStatus = () => {
    if (hasFullAccess) {
      return {
        status: 'available',
        icon: Check,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        borderColor: 'border-green-200',
        label: 'Available',
        description: `You have access to ${featureName || 'this feature'}`
      };
    }

    if (requiredTier && !hasTierAccess) {
      const tierInfo = requiredTier === 'PRIVILEGED_PLUS' 
        ? { name: 'Privileged Plus', icon: Crown, color: 'text-purple-600', bgColor: 'bg-purple-100', borderColor: 'border-purple-200' }
        : { name: 'Privileged', icon: Star, color: 'text-blue-600', bgColor: 'bg-blue-100', borderColor: 'border-blue-200' };
      
      return {
        status: 'requires_upgrade',
        icon: tierInfo.icon,
        color: tierInfo.color,
        bgColor: tierInfo.bgColor,
        borderColor: tierInfo.borderColor,
        label: `${tierInfo.name} Required`,
        description: `Upgrade to ${tierInfo.name} to access ${featureName || 'this feature'}`
      };
    }

    if (!statusContext.hasActiveSubscription) {
      return {
        status: 'requires_subscription',
        icon: Lock,
        color: 'text-amber-600',
        bgColor: 'bg-amber-100',
        borderColor: 'border-amber-200',
        label: 'Subscription Required',
        description: `An active subscription is required to access ${featureName || 'this feature'}`
      };
    }

    return {
      status: 'unavailable',
      icon: AlertCircle,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      borderColor: 'border-gray-200',
      label: 'Unavailable',
      description: `${featureName || 'This feature'} is not available with your current subscription`
    };
  };

  const featureStatus = getFeatureStatus();
  const StatusIcon = featureStatus.icon;

  // Icon variant
  if (variant === 'icon') {
    const indicator = (
      <StatusIcon className={`h-4 w-4 ${featureStatus.color} ${className}`} />
    );

    if (!showTooltip) return indicator;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {indicator}
          </TooltipTrigger>
          <TooltipContent>
            <p>{featureStatus.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Text variant
  if (variant === 'text') {
    const indicator = (
      <span className={`text-sm ${featureStatus.color} ${className}`}>
        {featureStatus.label}
      </span>
    );

    if (!showTooltip) return indicator;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {indicator}
          </TooltipTrigger>
          <TooltipContent>
            <p>{featureStatus.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Full variant with icon and text
  if (variant === 'full') {
    const indicator = (
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${featureStatus.bgColor} ${featureStatus.borderColor} ${className}`}>
        <StatusIcon className={`h-4 w-4 ${featureStatus.color}`} />
        <span className={`text-sm font-medium ${featureStatus.color}`}>
          {featureStatus.label}
        </span>
        {showTooltip && (
          <Info className={`h-3 w-3 ${featureStatus.color} opacity-60`} />
        )}
      </div>
    );

    if (!showTooltip) return indicator;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {indicator}
          </TooltipTrigger>
          <TooltipContent>
            <p>{featureStatus.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Badge variant (default)
  const getBadgeVariant = () => {
    switch (featureStatus.status) {
      case 'available':
        return 'default';
      case 'requires_upgrade':
        return 'secondary';
      case 'requires_subscription':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const indicator = (
    <Badge variant={getBadgeVariant()} className={`flex items-center space-x-1 ${className}`}>
      <StatusIcon className="h-3 w-3" />
      <span>{featureStatus.label}</span>
    </Badge>
  );

  if (!showTooltip) return indicator;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {indicator}
        </TooltipTrigger>
        <TooltipContent>
          <p>{featureStatus.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Convenience components for common features
export function ClubCreationIndicator(props: Omit<FeatureAvailabilityIndicatorProps, 'feature' | 'requiredTier' | 'featureName'>) {
  return (
    <FeatureAvailabilityIndicator
      feature="CAN_CREATE_LIMITED_CLUBS"
      requiredTier="PRIVILEGED"
      featureName="Club Creation"
      {...props}
    />
  );
}

export function PremiumContentIndicator(props: Omit<FeatureAvailabilityIndicatorProps, 'feature' | 'requiredTier' | 'featureName'>) {
  return (
    <FeatureAvailabilityIndicator
      feature="CAN_ACCESS_PREMIUM_CONTENT"
      requiredTier="PRIVILEGED"
      featureName="Premium Content"
      {...props}
    />
  );
}

export function ExclusiveContentIndicator(props: Omit<FeatureAvailabilityIndicatorProps, 'feature' | 'requiredTier' | 'featureName'>) {
  return (
    <FeatureAvailabilityIndicator
      feature="CAN_ACCESS_EXCLUSIVE_CONTENT"
      requiredTier="PRIVILEGED_PLUS"
      featureName="Exclusive Content"
      {...props}
    />
  );
}

export function DirectMessagingIndicator(props: Omit<FeatureAvailabilityIndicatorProps, 'feature' | 'requiredTier' | 'featureName'>) {
  return (
    <FeatureAvailabilityIndicator
      feature="CAN_INITIATE_DIRECT_MESSAGES"
      requiredTier="PRIVILEGED"
      featureName="Direct Messaging"
      {...props}
    />
  );
}
