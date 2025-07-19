/**
 * Subscription Section Component for Profile
 * 
 * Displays subscription information and management options within the profile form
 */

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Crown, 
  Star, 
  User, 
  Calendar, 
  RefreshCw, 
  Settings, 
  CreditCard,
  Gift,
  TrendingUp
} from 'lucide-react';
import { SubscriptionStatus } from '@/components/subscription/SubscriptionStatus';
import { FeatureAvailabilityIndicator } from '@/components/subscription/FeatureAvailabilityIndicator';

interface SubscriptionSectionProps {
  className?: string;
}

export default function SubscriptionSection({ className = '' }: SubscriptionSectionProps) {
  const { 
    subscriptionStatus, 
    subscriptionLoading, 
    getSubscriptionStatusWithContext,
    refreshUserData 
  } = useAuth();

  const statusContext = getSubscriptionStatusWithContext();

  // Get tier-specific benefits
  const getTierBenefits = (tier: string) => {
    switch (tier) {
      case 'PRIVILEGED_PLUS':
        return [
          { feature: 'CAN_CREATE_UNLIMITED_CLUBS', name: 'Unlimited Club Creation' },
          { feature: 'CAN_ACCESS_EXCLUSIVE_CONTENT', name: 'Exclusive Content Access' },
          { feature: 'CAN_INITIATE_DIRECT_MESSAGES', name: 'Direct Messaging' },
          { feature: 'CAN_ACCESS_PREMIUM_CONTENT', name: 'Premium Content' }
        ];
      case 'PRIVILEGED':
        return [
          { feature: 'CAN_CREATE_LIMITED_CLUBS', name: 'Club Creation (up to 3)' },
          { feature: 'CAN_ACCESS_PREMIUM_CONTENT', name: 'Premium Content Access' },
          { feature: 'CAN_INITIATE_DIRECT_MESSAGES', name: 'Direct Messaging' },
          { feature: 'CAN_JOIN_UNLIMITED_CLUBS', name: 'Unlimited Club Joins' }
        ];
      default:
        return [
          { feature: 'CAN_VIEW_PUBLIC_CLUBS', name: 'Public Club Access' },
          { feature: 'CAN_JOIN_LIMITED_CLUBS', name: 'Join Clubs (up to 5)' },
          { feature: 'CAN_PARTICIPATE_IN_DISCUSSIONS', name: 'Discussion Participation' },
          { feature: 'CAN_EDIT_OWN_PROFILE', name: 'Profile Customization' }
        ];
    }
  };

  const currentBenefits = getTierBenefits(statusContext.tier);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Section Header */}
      <div>
        <h3 className="text-lg font-medium">Subscription & Membership</h3>
        <p className="text-sm text-muted-foreground">
          Manage your subscription and view available features
        </p>
      </div>

      {/* Current Subscription Status */}
      <SubscriptionStatus showUpgradeButton={true} className="w-full" />

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Subscription Management</span>
          </CardTitle>
          <CardDescription>
            Manage your subscription settings and billing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="flex items-center space-x-2"
              onClick={refreshUserData}
              disabled={subscriptionLoading}
            >
              <RefreshCw className={`h-4 w-4 ${subscriptionLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Status</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="flex items-center space-x-2"
              onClick={() => console.log('Navigate to billing')}
            >
              <CreditCard className="h-4 w-4" />
              <span>Billing Settings</span>
            </Button>
            
            {statusContext.needsUpgrade && (
              <Button 
                className="flex items-center space-x-2 md:col-span-2"
                onClick={() => console.log('Navigate to upgrade')}
              >
                <TrendingUp className="h-4 w-4" />
                <span>Upgrade Subscription</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Current Benefits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Gift className="h-5 w-5" />
            <span>Your Current Benefits</span>
          </CardTitle>
          <CardDescription>
            Features available with your {statusContext.tier} membership
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {currentBenefits.map((benefit, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm">{benefit.name}</span>
                <FeatureAvailabilityIndicator
                  feature={benefit.feature}
                  variant="icon"
                  featureName={benefit.name}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Subscription Details */}
      {subscriptionStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Subscription Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Current Tier</span>
                <div className="flex items-center space-x-2 mt-1">
                  {statusContext.tier === 'PRIVILEGED_PLUS' && <Crown className="h-4 w-4 text-purple-500" />}
                  {statusContext.tier === 'PRIVILEGED' && <Star className="h-4 w-4 text-blue-500" />}
                  {statusContext.tier === 'MEMBER' && <User className="h-4 w-4 text-gray-500" />}
                  <span>{statusContext.tier}</span>
                </div>
              </div>
              
              <div>
                <span className="font-medium">Status</span>
                <div className="mt-1">
                  <Badge variant={statusContext.hasActiveSubscription ? 'default' : 'destructive'}>
                    {statusContext.hasActiveSubscription ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              
              {statusContext.expiryDate && (
                <>
                  <div>
                    <span className="font-medium">
                      {new Date(statusContext.expiryDate) < new Date() ? 'Expired' : 'Expires'}
                    </span>
                    <div className="mt-1 text-muted-foreground">
                      {new Date(statusContext.expiryDate).toLocaleDateString()}
                    </div>
                  </div>

                  <div>
                    <span className="font-medium">
                      {new Date(statusContext.expiryDate) < new Date() ? 'Days Since Expiry' : 'Days Remaining'}
                    </span>
                    <div className="mt-1 text-muted-foreground">
                      {Math.abs(Math.ceil((new Date(statusContext.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))}
                    </div>
                  </div>
                </>
              )}
              
              {statusContext.lastValidated && (
                <div className="col-span-2">
                  <span className="font-medium">Last Updated</span>
                  <div className="mt-1 text-muted-foreground text-xs">
                    {new Date(statusContext.lastValidated).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upgrade Recommendations */}
      {statusContext.tier === 'MEMBER' && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-700">
              <Star className="h-5 w-5" />
              <span>Unlock More Features</span>
            </CardTitle>
            <CardDescription className="text-blue-600">
              Upgrade to Privileged to access premium features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <span>✓</span>
                <span>Create and manage your own book clubs</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>✓</span>
                <span>Access premium content and discussions</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>✓</span>
                <span>Direct messaging with other members</span>
              </div>
            </div>
            <Button className="w-full mt-4" onClick={() => console.log('Navigate to upgrade')}>
              <Star className="h-4 w-4 mr-2" />
              Upgrade to Privileged
            </Button>
          </CardContent>
        </Card>
      )}

      {statusContext.tier === 'PRIVILEGED' && (
        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-purple-700">
              <Crown className="h-5 w-5" />
              <span>Go Premium</span>
            </CardTitle>
            <CardDescription className="text-purple-600">
              Upgrade to Privileged Plus for unlimited access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <span>✓</span>
                <span>Unlimited club creation and management</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>✓</span>
                <span>Exclusive content and early access</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>✓</span>
                <span>Priority support and advanced features</span>
              </div>
            </div>
            <Button className="w-full mt-4" onClick={() => console.log('Navigate to upgrade')}>
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to Privileged Plus
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
