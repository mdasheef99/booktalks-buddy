/**
 * Subscription Upgrade Prompt Component
 * 
 * Displays upgrade prompts and subscription messaging based on user context
 */

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Crown, 
  Star, 
  Check, 
  X, 
  ArrowRight, 
  Sparkles, 
  Users, 
  BookOpen,
  MessageCircle,
  Calendar
} from 'lucide-react';

interface SubscriptionUpgradePromptProps {
  variant?: 'banner' | 'card' | 'modal' | 'inline';
  targetTier?: 'PRIVILEGED' | 'PRIVILEGED_PLUS';
  dismissible?: boolean;
  showFeatureComparison?: boolean;
  className?: string;
  onUpgradeClick?: () => void;
  onDismiss?: () => void;
}

export function SubscriptionUpgradePrompt({
  variant = 'card',
  targetTier,
  dismissible = true,
  showFeatureComparison = true,
  className = '',
  onUpgradeClick,
  onDismiss
}: SubscriptionUpgradePromptProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const { getSubscriptionStatusWithContext } = useAuth();
  
  const statusContext = getSubscriptionStatusWithContext();

  // Don't show if user already has the target tier or higher
  const shouldShow = () => {
    if (isDismissed) return false;
    
    if (targetTier === 'PRIVILEGED' && statusContext.tier !== 'MEMBER') return false;
    if (targetTier === 'PRIVILEGED_PLUS' && statusContext.tier === 'PRIVILEGED_PLUS') return false;
    
    return statusContext.needsUpgrade || (targetTier && statusContext.tier !== targetTier);
  };

  if (!shouldShow()) return null;

  // Determine target tier if not specified
  const effectiveTargetTier = targetTier || (statusContext.tier === 'MEMBER' ? 'PRIVILEGED' : 'PRIVILEGED_PLUS');

  const getTierConfig = (tier: string) => {
    switch (tier) {
      case 'PRIVILEGED_PLUS':
        return {
          name: 'Privileged Plus',
          icon: Crown,
          color: 'from-purple-500 to-pink-500',
          price: '$19.99/month',
          features: [
            'Unlimited club creation',
            'Exclusive content access',
            'Priority support',
            'Advanced analytics',
            'Custom themes'
          ]
        };
      case 'PRIVILEGED':
        return {
          name: 'Privileged',
          icon: Star,
          color: 'from-blue-500 to-cyan-500',
          price: '$9.99/month',
          features: [
            'Create up to 3 clubs',
            'Premium content access',
            'Unlimited club joins',
            'Direct messaging',
            'Book nominations'
          ]
        };
      default:
        return {
          name: 'Member',
          icon: Users,
          color: 'from-gray-400 to-gray-500',
          price: 'Free',
          features: [
            'Join up to 5 clubs',
            'Basic discussions',
            'Public content',
            'Profile customization'
          ]
        };
    }
  };

  const currentTierConfig = getTierConfig(statusContext.tier);
  const targetTierConfig = getTierConfig(effectiveTargetTier);
  const TargetIcon = targetTierConfig.icon;

  const handleUpgrade = () => {
    if (onUpgradeClick) {
      onUpgradeClick();
    } else {
      // TODO: Implement default upgrade flow
      console.log(`Navigate to upgrade page for ${effectiveTargetTier}`);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  // Banner variant for top of page
  if (variant === 'banner') {
    return (
      <Alert className={`border-l-4 border-l-blue-500 ${className}`}>
        <Sparkles className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span>Unlock premium features with {targetTierConfig.name}!</span>
            <Badge variant="secondary">{targetTierConfig.price}</Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button size="sm" onClick={handleUpgrade}>
              Upgrade Now
            </Button>
            {dismissible && (
              <Button variant="ghost" size="sm" onClick={handleDismiss}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Inline variant for within content
  if (variant === 'inline') {
    return (
      <div className={`flex items-center justify-between p-3 bg-gradient-to-r ${targetTierConfig.color} rounded-lg text-white ${className}`}>
        <div className="flex items-center space-x-3">
          <TargetIcon className="h-5 w-5" />
          <div>
            <p className="font-medium">Upgrade to {targetTierConfig.name}</p>
            <p className="text-sm opacity-90">Starting at {targetTierConfig.price}</p>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={handleUpgrade}>
          <ArrowRight className="h-4 w-4 mr-1" />
          Upgrade
        </Button>
      </div>
    );
  }

  // Card variant (default)
  return (
    <Card className={className}>
      <CardHeader className="text-center">
        <div className="mx-auto mb-2">
          <div className={`inline-flex p-4 rounded-full bg-gradient-to-r ${targetTierConfig.color}`}>
            <TargetIcon className="h-8 w-8 text-white" />
          </div>
        </div>
        <CardTitle className="text-xl">
          Upgrade to {targetTierConfig.name}
        </CardTitle>
        <CardDescription>
          Unlock powerful features and enhance your BookConnect experience
        </CardDescription>
        {dismissible && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="absolute top-2 right-2"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Pricing */}
        <div className="text-center">
          <div className="text-3xl font-bold">{targetTierConfig.price}</div>
          <div className="text-sm text-muted-foreground">
            {targetTierConfig.price !== 'Free' && 'Cancel anytime'}
          </div>
        </div>

        {/* Feature Comparison */}
        {showFeatureComparison && (
          <div className="space-y-4">
            <h4 className="font-medium text-center">What you'll get:</h4>
            <div className="space-y-2">
              {targetTierConfig.features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>

            {/* Current vs Target */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center">
                <Badge variant="outline" className="mb-2">Current</Badge>
                <div className="text-sm font-medium">{currentTierConfig.name}</div>
                <div className="text-xs text-muted-foreground">{currentTierConfig.price}</div>
              </div>
              <div className="text-center">
                <Badge className="mb-2">Upgrade to</Badge>
                <div className="text-sm font-medium">{targetTierConfig.name}</div>
                <div className="text-xs text-muted-foreground">{targetTierConfig.price}</div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button className="w-full" onClick={handleUpgrade}>
            <Crown className="h-4 w-4 mr-2" />
            Upgrade to {targetTierConfig.name}
          </Button>
          <Button variant="outline" className="w-full" onClick={() => console.log('Learn more')}>
            Learn More About Features
          </Button>
        </div>

        {/* Trust indicators */}
        <div className="text-center text-xs text-muted-foreground space-y-1">
          <div>✓ 30-day money-back guarantee</div>
          <div>✓ Cancel anytime</div>
          <div>✓ Secure payment processing</div>
        </div>
      </CardContent>
    </Card>
  );
}

// Convenience components for specific upgrade scenarios
export function PrivilegedUpgradePrompt(props: Omit<SubscriptionUpgradePromptProps, 'targetTier'>) {
  return <SubscriptionUpgradePrompt {...props} targetTier="PRIVILEGED" />;
}

export function PrivilegedPlusUpgradePrompt(props: Omit<SubscriptionUpgradePromptProps, 'targetTier'>) {
  return <SubscriptionUpgradePrompt {...props} targetTier="PRIVILEGED_PLUS" />;
}
