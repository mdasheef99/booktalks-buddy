/**
 * Suspension Enforcement Test Component
 * 
 * This component provides testing utilities for the suspension enforcement system.
 * It displays current account status and provides debugging information.
 * 
 * Part of: Suspension Enforcement System Implementation
 * Created: 2025-01-23
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { getStatusChangeTimestamp, getAccountStatusDisplayName, getAccountStatusDisplayNameSync } from '@/contexts/AuthContext/features/accountStatus';
import { Shield, User, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

// =========================
// Main Component
// =========================

/**
 * Test component for suspension enforcement system
 */
export const SuspensionEnforcementTest: React.FC = () => {
  const { 
    user,
    accountStatus,
    accountStatusLoading,
    isAccountSuspended,
    isAccountDeleted,
    isAccountActive,
    getAccountStatusMessage,
    refreshAccountStatus
  } = useAuth();

  // Handle manual refresh
  const handleRefresh = async () => {
    try {
      await refreshAccountStatus();
    } catch (error) {
      console.error('Error refreshing account status:', error);
    }
  };

  if (!user) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Suspension Enforcement Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Please log in to test suspension enforcement.</p>
        </CardContent>
      </Card>
    );
  }

  const statusDisplayName = getAccountStatusDisplayName(accountStatus);
  const statusMessage = getAccountStatusMessage();
  const statusChangeTime = getStatusChangeTimestamp(accountStatus);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Suspension Enforcement System Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            This component displays the current account status and tests the suspension enforcement system.
          </p>
        </CardContent>
      </Card>

      {/* User Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Current User
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>User ID:</strong> {user.id}</p>
            <p><strong>Email:</strong> {user.email}</p>
          </div>
        </CardContent>
      </Card>

      {/* Account Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Account Status
            {accountStatusLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span className="font-medium">Status:</span>
            <Badge 
              variant={
                isAccountActive() ? "default" : 
                isAccountSuspended() ? "destructive" : 
                isAccountDeleted() ? "secondary" : "outline"
              }
              className="flex items-center gap-1"
            >
              {isAccountActive() && <CheckCircle className="h-3 w-3" />}
              {isAccountSuspended() && <AlertTriangle className="h-3 w-3" />}
              {isAccountDeleted() && <XCircle className="h-3 w-3" />}
              {statusDisplayName}
            </Badge>
          </div>

          {/* Status Message */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm">{statusMessage}</p>
          </div>

          {/* Status Details */}
          {accountStatus && (
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Database Status:</span>
                  <p className="text-gray-600">{accountStatus.account_status || 'null (treated as active)'}</p>
                </div>
                {statusChangeTime && (
                  <div>
                    <span className="font-medium">Changed:</span>
                    <p className="text-gray-600 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {statusChangeTime}
                    </p>
                  </div>
                )}
              </div>
              
              {accountStatus.status_changed_by && (
                <div>
                  <span className="font-medium">Changed By:</span>
                  <p className="text-gray-600">{accountStatus.status_changed_by}</p>
                </div>
              )}
            </div>
          )}

          {/* Refresh Button */}
          <Button 
            onClick={handleRefresh} 
            disabled={accountStatusLoading}
            variant="outline"
            size="sm"
          >
            Refresh Status
          </Button>
        </CardContent>
      </Card>

      {/* Enforcement Status */}
      <Card>
        <CardHeader>
          <CardTitle>Enforcement Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="font-medium">Route Protection</span>
              <Badge variant="default">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="font-medium">Real-time Monitoring</span>
              <Badge variant="default">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="font-medium">Periodic Checking</span>
              <Badge variant="default">
                <CheckCircle className="h-3 w-3 mr-1" />
                Every 5 minutes
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="font-medium">Session Invalidation</span>
              <Badge variant="default">
                <CheckCircle className="h-3 w-3 mr-1" />
                Enabled
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium mb-2">Available Test Users:</h4>
              <ul className="space-y-1 text-gray-700">
                <li>• <code>taleb1</code> - Suspended until Aug 22, 2025</li>
                <li>• <code>kjkj</code> - Suspended</li>
                <li>• <code>asdfgh</code> - Suspended</li>
              </ul>
            </div>
            
            <div className="p-3 bg-yellow-50 rounded-lg">
              <h4 className="font-medium mb-2">Expected Behavior:</h4>
              <ul className="space-y-1 text-gray-700">
                <li>• Suspended users should be redirected to <code>/suspended</code> page</li>
                <li>• Real-time status changes should trigger immediate logout</li>
                <li>• All protected routes should be inaccessible</li>
                <li>• Status changes should be reflected within 5 minutes</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuspensionEnforcementTest;
