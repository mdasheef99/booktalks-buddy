/**
 * Profile Subscription Display Component
 * 
 * Read-only subscription information display for the main profile page
 * Shows subscription details without edit capabilities (manual upgrades by store owner)
 */

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Crown, 
  Star, 
  User, 
  Calendar, 
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';

interface ProfileSubscriptionDisplayProps {
  className?: string;
}

export default function ProfileSubscriptionDisplay({ className = '' }: ProfileSubscriptionDisplayProps) {
  const { 
    subscriptionStatus, 
    subscriptionLoading, 
    getSubscriptionStatusWithContext 
  } = useAuth();

  const statusContext = getSubscriptionStatusWithContext();

  // Get tier-specific configuration
  const getTierConfig = (tier: string) => {
    switch (tier) {
      case 'PRIVILEGED_PLUS':
        return {
          icon: Crown,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          gradientColor: 'from-purple-500 to-pink-500',
          label: 'Privileged Plus',
          description: 'Premium membership with unlimited access',
          monthlyAmount: '$19.99'
        };
      case 'PRIVILEGED':
        return {
          icon: Star,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          gradientColor: 'from-blue-500 to-cyan-500',
          label: 'Privileged',
          description: 'Enhanced membership with premium features',
          monthlyAmount: '$9.99'
        };
      default:
        return {
          icon: User,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          gradientColor: 'from-gray-400 to-gray-500',
          label: 'Member',
          description: 'Basic membership with community access',
          monthlyAmount: 'Free'
        };
    }
  };

  const tierConfig = getTierConfig(statusContext.tier);
  const TierIcon = tierConfig.icon;

  // Calculate days remaining
  const getDaysRemaining = () => {
    if (!statusContext.expiryDate) return null;
    const today = new Date();
    const expiry = new Date(statusContext.expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const daysRemaining = getDaysRemaining();

  // Loading state
  if (subscriptionLoading) {
    return (
      <Card className={`${className} animate-pulse`}>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} border-bookconnect-brown/20 shadow-md`}>
      <CardHeader className={`bg-gradient-to-r ${tierConfig.gradientColor} text-white rounded-t-lg`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <TierIcon className="h-6 w-6" />
            <div>
              <CardTitle className="text-xl font-serif">{tierConfig.label}</CardTitle>
              <CardDescription className="text-white/90 text-sm">
                {tierConfig.description}
              </CardDescription>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">{tierConfig.monthlyAmount}</div>
            {tierConfig.monthlyAmount !== 'Free' && (
              <div className="text-xs text-white/80">per month</div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Membership Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Current Status */}
          <div className="space-y-3">
            <h4 className="font-medium text-bookconnect-brown flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Membership Status
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Current Tier</span>
                <Badge 
                  variant="outline" 
                  className={`${tierConfig.bgColor} ${tierConfig.borderColor} ${tierConfig.color}`}
                >
                  {tierConfig.label}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <div className="flex items-center space-x-1">
                  {statusContext.hasActiveSubscription ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <Badge 
                    variant={statusContext.hasActiveSubscription ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {statusContext.hasActiveSubscription ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="space-y-3">
            <h4 className="font-medium text-bookconnect-brown flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Payment Information
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Monthly Amount</span>
                <span className="font-medium">{tierConfig.monthlyAmount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Payment Method</span>
                <span className="text-sm text-gray-500">Direct to Store Owner</span>
              </div>
            </div>
          </div>
        </div>

        <Separator className="bg-bookconnect-brown/20" />

        {/* Membership Timeline */}
        {statusContext.expiryDate && (
          <div className="space-y-3">
            <h4 className="font-medium text-bookconnect-brown flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Membership Timeline
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Expires On</div>
                <div className="font-medium">
                  {new Date(statusContext.expiryDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
              
              {daysRemaining !== null && (
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Days Remaining</div>
                  <div className={`font-medium ${daysRemaining <= 7 ? 'text-red-600' : daysRemaining <= 30 ? 'text-amber-600' : 'text-green-600'}`}>
                    {daysRemaining} days
                  </div>
                </div>
              )}

              {statusContext.lastValidated && (
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Last Updated</div>
                  <div className="font-medium text-xs">
                    {new Date(statusContext.lastValidated).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Membership Benefits */}
        <div className="space-y-3">
          <h4 className="font-medium text-bookconnect-brown flex items-center">
            <Star className="h-4 w-4 mr-2" />
            Your Membership Benefits
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {statusContext.tier === 'PRIVILEGED_PLUS' && (
              <>
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Unlimited club creation</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Exclusive content access</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Priority support</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Advanced features</span>
                </div>
              </>
            )}
            
            {statusContext.tier === 'PRIVILEGED' && (
              <>
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Create up to 3 clubs</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Premium content access</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Unlimited club joins</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Direct messaging</span>
                </div>
              </>
            )}
            
            {statusContext.tier === 'MEMBER' && (
              <>
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Join up to 5 clubs</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Basic discussions</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Public content access</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Profile customization</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Payment Model Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium text-blue-800 mb-1">Payment Information</div>
              <div className="text-blue-700">
                Membership upgrades are processed manually by the store owner. 
                Contact the store owner directly to upgrade your membership or make payments.
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
