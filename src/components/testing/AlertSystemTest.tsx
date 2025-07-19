/**
 * Alert System Test Component
 * 
 * Test component for verifying alert system functionality.
 * Provides buttons to trigger different types of alerts for testing purposes.
 * 
 * Created: 2025-01-16
 * Part of: Alert System Implementation - Phase 1 Testing
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useAlerts } from '@/hooks/useAlerts';
import { 
  createSubscriptionExpiredAlert,
  createSubscriptionExpiryWarningAlert,
  createRoleAccessDeniedAlert,
  createGracePeriodWarningAlert
} from '@/lib/alerts/alertManager';
import { 
  showSubscriptionExpiredToast,
  showSubscriptionExpiryWarningToast,
  showRoleAccessDeniedToast,
  showGracePeriodWarningToast
} from '@/components/alerts/AlertToast';

export function AlertSystemTest() {
  const { user } = useAuth();
  const { addAlert, alerts, dismissAlert, clearAlerts } = useAlerts();

  if (!user) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Alert System Test</CardTitle>
          <CardDescription>Please log in to test the alert system</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // =========================
  // Test Functions
  // =========================

  const testSubscriptionExpiredAlert = () => {
    const alert = createSubscriptionExpiredAlert(user.id, {
      currentTier: 'PRIVILEGED',
      expiryDate: '2025-01-15T00:00:00Z',
      hasActiveSubscription: false
    });
    addAlert(alert);
  };

  const testSubscriptionExpiryWarningAlert = () => {
    const alert = createSubscriptionExpiryWarningAlert(user.id, {
      currentTier: 'PRIVILEGED',
      expiryDate: '2025-01-23T00:00:00Z',
      daysRemaining: 7,
      hasActiveSubscription: true
    });
    addAlert(alert);
  };

  const testRoleAccessDeniedAlert = () => {
    const alert = createRoleAccessDeniedAlert(user.id, 'Club Creation', 'PRIVILEGED');
    addAlert(alert);
  };

  const testGracePeriodWarningAlert = () => {
    const alert = createGracePeriodWarningAlert(user.id, 'Club Leadership', 3);
    addAlert(alert);
  };

  // Toast Tests
  const testSubscriptionExpiredToast = () => {
    showSubscriptionExpiredToast('PRIVILEGED', () => {
      alert('Contact store owner clicked!');
    });
  };

  const testSubscriptionExpiryWarningToast = () => {
    showSubscriptionExpiryWarningToast(7, () => {
      alert('Contact store owner clicked!');
    });
  };

  const testRoleAccessDeniedToast = () => {
    showRoleAccessDeniedToast('Club Creation', 'PRIVILEGED', () => {
      alert('Contact store owner clicked!');
    });
  };

  const testGracePeriodWarningToast = () => {
    showGracePeriodWarningToast('Club Leadership', 3, () => {
      alert('Renew subscription clicked!');
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Alert System Test</CardTitle>
          <CardDescription>
            Test the alert system functionality. Alerts will appear in the profile section and as toast notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Alerts Display */}
          <div>
            <h3 className="text-lg font-medium mb-3">Current Alerts ({alerts.length})</h3>
            {alerts.length > 0 ? (
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium">{alert.title}</span>
                      <span className="text-sm text-gray-600 ml-2">({alert.type})</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => dismissAlert(alert.id)}
                    >
                      Dismiss
                    </Button>
                  </div>
                ))}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={clearAlerts}
                  className="mt-2"
                >
                  Clear All Alerts
                </Button>
              </div>
            ) : (
              <p className="text-gray-500">No active alerts</p>
            )}
          </div>

          {/* Banner Alert Tests */}
          <div>
            <h3 className="text-lg font-medium mb-3">Banner Alert Tests</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={testSubscriptionExpiredAlert} variant="destructive">
                Test Subscription Expired
              </Button>
              <Button onClick={testSubscriptionExpiryWarningAlert} variant="outline">
                Test Expiry Warning
              </Button>
              <Button onClick={testRoleAccessDeniedAlert} variant="destructive">
                Test Role Access Denied
              </Button>
              <Button onClick={testGracePeriodWarningAlert} variant="outline">
                Test Grace Period Warning
              </Button>
            </div>
          </div>

          {/* Toast Alert Tests */}
          <div>
            <h3 className="text-lg font-medium mb-3">Toast Alert Tests</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={testSubscriptionExpiredToast} variant="destructive">
                Toast: Subscription Expired
              </Button>
              <Button onClick={testSubscriptionExpiryWarningToast} variant="outline">
                Toast: Expiry Warning
              </Button>
              <Button onClick={testRoleAccessDeniedToast} variant="destructive">
                Toast: Role Access Denied
              </Button>
              <Button onClick={testGracePeriodWarningToast} variant="outline">
                Toast: Grace Period Warning
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Testing Instructions</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Banner alerts will appear in the profile section and persist until dismissed</li>
              <li>• Toast alerts will appear as temporary notifications in the bottom-right corner</li>
              <li>• Navigate to the profile page to see banner alerts in context</li>
              <li>• Click "Contact Store Owner" buttons to test action handlers</li>
              <li>• Use browser dev tools to inspect alert state and behavior</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
