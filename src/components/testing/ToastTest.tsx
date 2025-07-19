/**
 * Toast Test Component
 * 
 * Simple test component to verify that subscription toast notifications are working.
 * This component manually triggers the toast functions to test the integration.
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  showSubscriptionExpiredToast,
  showSubscriptionExpiryWarningToast,
  showRoleAccessDeniedToast,
  showGracePeriodWarningToast
} from '@/components/alerts/AlertToast';

export default function ToastTest() {
  const testSubscriptionExpiredToast = () => {
    showSubscriptionExpiredToast('PRIVILEGED_PLUS', () => {
      alert('Contact store clicked!');
    });
  };

  const testSubscriptionExpiryWarningToast = () => {
    showSubscriptionExpiryWarningToast(3, () => {
      alert('Contact store clicked!');
    });
  };

  const testRoleAccessDeniedToast = () => {
    showRoleAccessDeniedToast('Club Management', 'PRIVILEGED', () => {
      alert('Contact store clicked!');
    });
  };

  const testGracePeriodWarningToast = () => {
    showGracePeriodWarningToast('Club Leadership', 5, () => {
      alert('Renew subscription clicked!');
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🍞 Toast Notification Test
          </CardTitle>
          <CardDescription>
            Test the subscription toast notification system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={testSubscriptionExpiredToast}
              variant="destructive"
              className="w-full"
            >
              Test Subscription Expired Toast
            </Button>
            
            <Button 
              onClick={testSubscriptionExpiryWarningToast}
              variant="outline"
              className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              Test Expiry Warning Toast
            </Button>
            
            <Button 
              onClick={testRoleAccessDeniedToast}
              variant="destructive"
              className="w-full"
            >
              Test Role Access Denied Toast
            </Button>
            
            <Button 
              onClick={testGracePeriodWarningToast}
              variant="outline"
              className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              Test Grace Period Warning Toast
            </Button>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Expected Behavior:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Subscription Expired</strong>: Red toast with "Contact Store" action</li>
              <li>• <strong>Expiry Warning</strong>: Orange toast with days remaining</li>
              <li>• <strong>Role Access Denied</strong>: Red toast for feature access</li>
              <li>• <strong>Grace Period Warning</strong>: Amber toast for role expiration</li>
            </ul>
          </div>
          
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-medium text-green-900 mb-2">Integration Status:</h3>
            <p className="text-sm text-green-800">
              ✅ Toast notifications are now automatically triggered when subscription alerts are created in the AlertContext.
              This test page allows manual testing of the toast functions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
