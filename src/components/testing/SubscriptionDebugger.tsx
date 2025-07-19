/**
 * Subscription Debugger Component
 * 
 * Debug component to diagnose subscription status and alert system issues.
 * Provides detailed information about user subscription state and validation.
 * 
 * Created: 2025-01-16
 * Part of: Alert System Troubleshooting
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useAlerts } from '@/hooks/useAlerts';
import { supabase } from '@/lib/supabase';
import { validateUserSubscription } from '@/lib/api/subscriptions/validation';
import { getSubscriptionStatus } from '@/lib/api/subscriptions';

interface DebugInfo {
  userId: string;
  email: string;
  authContextData: any;
  rawSubscriptionData: any;
  validationResult: any;
  databaseQueries: any;
  alertSystemState: any;
}

export function SubscriptionDebugger() {
  const { user, subscriptionStatus, getSubscriptionStatusWithContext, refreshSubscriptionStatus } = useAuth();
  const { alerts, addAlert } = useAlerts();
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    if (!user) return;

    setLoading(true);
    try {
      console.log('🔍 Starting subscription diagnostics for user:', user.email);

      // 1. Get AuthContext data
      const statusContext = getSubscriptionStatusWithContext();
      
      // 2. Direct database queries
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('id, email, membership_tier')
        .eq('id', user.id)
        .single();

      const { data: subscriptions, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // 3. Database function calls
      const { data: hasActive, error: activeError } = await supabase
        .rpc('has_active_subscription', { p_user_id: user.id });

      const { data: tierFromDB, error: tierError } = await supabase
        .rpc('get_user_subscription_tier', { p_user_id: user.id });

      // 4. Validation API calls
      const validationResult = await validateUserSubscription(user.id, {
        useCache: false,
        failSecure: false,
        timeout: 10000
      });

      const apiResult = await getSubscriptionStatus(user.id, { useCache: false });

      // 5. Alert system state
      const userAlerts = alerts.filter(alert => alert.userId === user.id);

      const debugData: DebugInfo = {
        userId: user.id,
        email: user.email || 'No email',
        authContextData: {
          subscriptionStatus,
          statusContext,
          subscriptionLoading: false
        },
        rawSubscriptionData: {
          userRecord: { data: userRecord, error: userError },
          subscriptions: { data: subscriptions, error: subError },
          hasActive: { data: hasActive, error: activeError },
          tierFromDB: { data: tierFromDB, error: tierError }
        },
        validationResult: {
          validationAPI: validationResult,
          subscriptionAPI: apiResult
        },
        databaseQueries: {
          userTable: userRecord,
          subscriptionTable: subscriptions,
          hasActiveFunction: hasActive,
          tierFunction: tierFromDB
        },
        alertSystemState: {
          totalAlerts: alerts.length,
          userAlerts: userAlerts,
          alertTypes: userAlerts.map(a => a.type)
        }
      };

      setDebugInfo(debugData);
      console.log('🔍 Debug info collected:', debugData);

    } catch (error) {
      console.error('❌ Diagnostics failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const forceRefreshSubscription = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await refreshSubscriptionStatus();
      await runDiagnostics();
    } catch (error) {
      console.error('❌ Refresh failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const testAlertCreation = () => {
    if (!user) return;
    
    // Create test alerts
    addAlert({
      type: 'subscription_expired',
      priority: 'HIGH',
      category: 'USER_SUBSCRIPTION',
      title: 'Test Subscription Expired',
      message: 'This is a test expired subscription alert',
      displayType: 'banner',
      userId: user.id,
      subscriptionData: {
        currentTier: 'PRIVILEGED',
        expiryDate: '2025-01-15T00:00:00Z',
        hasActiveSubscription: false
      }
    } as any);
  };

  useEffect(() => {
    if (user) {
      runDiagnostics();
    }
  }, [user]);

  if (!user) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Subscription Debugger</CardTitle>
          <CardDescription>Please log in to debug subscription status</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Subscription Status Debugger</CardTitle>
          <CardDescription>
            Debugging subscription status for: <strong>{user.email}</strong>
          </CardDescription>
          <div className="flex gap-2">
            <Button onClick={runDiagnostics} disabled={loading}>
              {loading ? 'Running...' : 'Run Diagnostics'}
            </Button>
            <Button onClick={forceRefreshSubscription} disabled={loading} variant="outline">
              Force Refresh
            </Button>
            <Button onClick={testAlertCreation} variant="secondary">
              Test Alert Creation
            </Button>
          </div>
        </CardHeader>
      </Card>

      {debugInfo && (
        <>
          {/* AuthContext Status */}
          <Card>
            <CardHeader>
              <CardTitle>AuthContext Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Subscription Status:</strong>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-1">
                    {JSON.stringify(debugInfo.authContextData.subscriptionStatus, null, 2)}
                  </pre>
                </div>
                <div>
                  <strong>Status Context:</strong>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-1">
                    {JSON.stringify(debugInfo.authContextData.statusContext, null, 2)}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Database Queries */}
          <Card>
            <CardHeader>
              <CardTitle>Database Queries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <strong>User Record:</strong>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-1">
                    {JSON.stringify(debugInfo.rawSubscriptionData.userRecord, null, 2)}
                  </pre>
                </div>
                <div>
                  <strong>User Subscriptions:</strong>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-1">
                    {JSON.stringify(debugInfo.rawSubscriptionData.subscriptions, null, 2)}
                  </pre>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong>has_active_subscription():</strong>
                    <Badge variant={debugInfo.rawSubscriptionData.hasActive.data ? 'default' : 'destructive'}>
                      {String(debugInfo.rawSubscriptionData.hasActive.data)}
                    </Badge>
                    {debugInfo.rawSubscriptionData.hasActive.error && (
                      <p className="text-red-600 text-xs mt-1">
                        Error: {debugInfo.rawSubscriptionData.hasActive.error.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <strong>get_user_subscription_tier():</strong>
                    <Badge variant="outline">
                      {debugInfo.rawSubscriptionData.tierFromDB.data || 'NULL'}
                    </Badge>
                    {debugInfo.rawSubscriptionData.tierFromDB.error && (
                      <p className="text-red-600 text-xs mt-1">
                        Error: {debugInfo.rawSubscriptionData.tierFromDB.error.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Validation Results */}
          <Card>
            <CardHeader>
              <CardTitle>Validation Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Validation API Result:</strong>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-1">
                    {JSON.stringify(debugInfo.validationResult.validationAPI, null, 2)}
                  </pre>
                </div>
                <div>
                  <strong>Subscription API Result:</strong>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-1">
                    {JSON.stringify(debugInfo.validationResult.subscriptionAPI, null, 2)}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alert System State */}
          <Card>
            <CardHeader>
              <CardTitle>Alert System State</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Total Alerts:</strong> {debugInfo.alertSystemState.totalAlerts}</p>
                <p><strong>User Alerts:</strong> {debugInfo.alertSystemState.userAlerts.length}</p>
                <p><strong>Alert Types:</strong> {debugInfo.alertSystemState.alertTypes.join(', ') || 'None'}</p>
                
                {debugInfo.alertSystemState.userAlerts.length > 0 && (
                  <div>
                    <strong>Alert Details:</strong>
                    <pre className="text-xs bg-gray-100 p-2 rounded mt-1">
                      {JSON.stringify(debugInfo.alertSystemState.userAlerts, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
