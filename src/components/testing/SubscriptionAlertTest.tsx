/**
 * Subscription Alert Test Component
 * 
 * Test component to verify that subscription alerts are working properly
 * for users with expired premium subscriptions.
 * 
 * Created: 2025-01-16
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useAlerts } from '@/hooks/useAlerts';
import { useUserSubscriptionAlerts } from '@/contexts/AlertContext';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';

export function SubscriptionAlertTest() {
  const { user, subscriptionStatus } = useAuth();
  const { alerts } = useAlerts();
  const subscriptionAlerts = useUserSubscriptionAlerts();
  const [testResults, setTestResults] = useState<{
    subscriptionDetection: 'pass' | 'fail' | 'pending';
    alertGeneration: 'pass' | 'fail' | 'pending';
    alertFiltering: 'pass' | 'fail' | 'pending';
  }>({
    subscriptionDetection: 'pending',
    alertGeneration: 'pending',
    alertFiltering: 'pending'
  });

  useEffect(() => {
    if (!user || !subscriptionStatus) return;

    // Test 1: Subscription Detection
    const hasExpiredPremium = subscriptionStatus.hadPremiumSubscription && !subscriptionStatus.hasActiveSubscription;
    const correctTierDetection = subscriptionStatus.currentTier === 'PRIVILEGED_PLUS';

    // Test 2: Alert Generation
    const hasSubscriptionAlerts = subscriptionAlerts.length > 0;
    const hasExpiredAlert = subscriptionAlerts.some(alert => alert.type === 'subscription_expired');

    // Test 3: Alert Filtering
    const userSpecificAlerts = alerts.filter(alert => alert.userId === user.id);
    const subscriptionSpecificAlerts = userSpecificAlerts.filter(alert => alert.category === 'USER_SUBSCRIPTION');

    setTestResults({
      subscriptionDetection: (hasExpiredPremium || correctTierDetection) ? 'pass' : 'fail',
      alertGeneration: (hasSubscriptionAlerts && hasExpiredAlert) ? 'pass' : 'fail',
      alertFiltering: (subscriptionSpecificAlerts.length === subscriptionAlerts.length) ? 'pass' : 'fail'
    });

  }, [user?.id, subscriptionStatus?.currentTier, subscriptionStatus?.hasActiveSubscription, subscriptionStatus?.hadPremiumSubscription, subscriptionAlerts.length, alerts.length]);

  if (!user) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Subscription Alert Test</CardTitle>
          <CardDescription>Please log in to test subscription alerts</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getStatusIcon = (status: 'pass' | 'fail' | 'pending') => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'fail': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'pending': return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: 'pass' | 'fail' | 'pending') => {
    const variant = status === 'pass' ? 'default' : status === 'fail' ? 'destructive' : 'secondary';
    return <Badge variant={variant}>{status.toUpperCase()}</Badge>;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            Subscription Alert System Test
          </CardTitle>
          <CardDescription>
            Testing subscription alert functionality for users with expired premium subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test Results */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Subscription Detection</h3>
                {getStatusIcon(testResults.subscriptionDetection)}
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Tests if expired premium subscriptions are properly detected
              </p>
              {getStatusBadge(testResults.subscriptionDetection)}
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Alert Generation</h3>
                {getStatusIcon(testResults.alertGeneration)}
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Tests if subscription alerts are generated for expired users
              </p>
              {getStatusBadge(testResults.alertGeneration)}
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Alert Filtering</h3>
                {getStatusIcon(testResults.alertFiltering)}
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Tests if alerts are properly filtered for the current user
              </p>
              {getStatusBadge(testResults.alertFiltering)}
            </div>
          </div>

          {/* Detailed Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-3">Subscription Status</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>User ID:</span>
                  <span className="font-mono text-xs">{user.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Current Tier:</span>
                  <Badge variant="outline">{subscriptionStatus?.currentTier || 'Unknown'}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Has Active Subscription:</span>
                  <Badge variant={subscriptionStatus?.hasActiveSubscription ? 'default' : 'secondary'}>
                    {subscriptionStatus?.hasActiveSubscription ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Had Premium Subscription:</span>
                  <Badge variant={subscriptionStatus?.hadPremiumSubscription ? 'default' : 'secondary'}>
                    {subscriptionStatus?.hadPremiumSubscription ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Most Recent Tier:</span>
                  <Badge variant="outline">{subscriptionStatus?.mostRecentSubscriptionTier || 'Unknown'}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Subscription Expiry:</span>
                  <span className="text-xs">{subscriptionStatus?.subscriptionExpiry || 'None'}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">Alert Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Alerts:</span>
                  <Badge variant="outline">{alerts.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>User Alerts:</span>
                  <Badge variant="outline">{alerts.filter(a => a.userId === user.id).length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Subscription Alerts:</span>
                  <Badge variant="outline">{subscriptionAlerts.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Expired Alerts:</span>
                  <Badge variant="outline">
                    {subscriptionAlerts.filter(a => a.type === 'subscription_expired').length}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Warning Alerts:</span>
                  <Badge variant="outline">
                    {subscriptionAlerts.filter(a => a.type === 'subscription_expiry_warning').length}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Alert Details */}
          {subscriptionAlerts.length > 0 && (
            <div>
              <h3 className="font-medium mb-3">Active Subscription Alerts</h3>
              <div className="space-y-2">
                {subscriptionAlerts.map((alert, index) => (
                  <div key={alert.id} className="p-3 border rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={alert.type === 'subscription_expired' ? 'destructive' : 'secondary'}>
                        {alert.type}
                      </Badge>
                      <Badge variant="outline">{alert.priority}</Badge>
                    </div>
                    <h4 className="font-medium text-sm">{alert.title}</h4>
                    <p className="text-sm text-gray-600">{alert.message}</p>
                    {alert.subscriptionData && (
                      <div className="mt-2 text-xs text-gray-500">
                        Tier: {alert.subscriptionData.currentTier} | 
                        Active: {alert.subscriptionData.hasActiveSubscription ? 'Yes' : 'No'}
                        {alert.subscriptionData.daysRemaining !== undefined && 
                          ` | Days: ${alert.subscriptionData.daysRemaining}`
                        }
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
