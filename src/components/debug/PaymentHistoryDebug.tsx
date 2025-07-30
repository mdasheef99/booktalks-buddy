/**
 * Payment History Debug Component
 *
 * ✅ UPDATED: Debug component using direct Supabase queries instead of removed API endpoints.
 * Tests payment history functionality and database connectivity.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const PaymentHistoryDebug: React.FC = () => {
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testPaymentAPI = async () => {
    if (!user) {
      setError('No user logged in');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Testing payment functionality for user:', user.id);

      // ✅ UPDATED: Direct Supabase queries instead of removed API endpoints
      const results = {};

      // Test 1: Direct Supabase connection test
      try {
        console.log('Testing direct Supabase connection...');
        const { data: connectionTest, error: connectionError } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .limit(1);

        results['Supabase Connection'] = {
          status: connectionError ? 'error' : 'success',
          data: connectionError ? { error: connectionError.message } : { connected: true, userFound: !!connectionTest?.length }
        };
      } catch (err) {
        results['Supabase Connection'] = {
          error: err instanceof Error ? err.message : 'Unknown error'
        };
      }

      // Test 2: Payment records query
      try {
        console.log('Testing payment records query...');
        const { data: paymentRecords, error: paymentError } = await supabase
          .from('payment_records')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        results['Payment Records Query'] = {
          status: paymentError ? 'error' : 'success',
          data: paymentError ? { error: paymentError.message } : {
            recordCount: paymentRecords?.length || 0,
            records: paymentRecords || []
          }
        };
      } catch (err) {
        results['Payment Records Query'] = {
          error: err instanceof Error ? err.message : 'Unknown error'
        };
      }

      // Test 3: User profile query
      try {
        console.log('Testing user profile query...');
        const { data: userProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        results['User Profile Query'] = {
          status: profileError ? 'error' : 'success',
          data: profileError ? { error: profileError.message } : {
            profileFound: !!userProfile,
            profile: userProfile
          }
        };
      } catch (err) {
        results['User Profile Query'] = {
          error: err instanceof Error ? err.message : 'Unknown error'
        };
      }

      setDebugInfo({
        user: {
          id: user.id,
          email: user.email
        },
        testResults: results,
        timestamp: new Date().toISOString(),
        note: 'Updated to use direct Supabase queries instead of removed API endpoints'
      });

    } catch (err) {
      console.error('Payment API test failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createTestPayment = async () => {
    if (!user) {
      setError('No user logged in');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // This would be a test endpoint to create sample payment data
      // For now, just show what would be created
      const testPayment = {
        user_id: user.id,
        store_id: '00000000-0000-0000-0000-000000000001', // Default store ID
        amount: 19.99,
        currency: 'USD',
        payment_method: 'cash',
        payment_reference: 'TEST-' + Date.now(),
        payment_date: new Date().toISOString(),
        recorded_by: user.id,
        notes: 'Test payment for debugging'
      };

      console.log('Would create test payment:', testPayment);
      setDebugInfo({
        ...debugInfo,
        testPayment,
        message: 'Test payment structure (not actually created)'
      });

    } catch (err) {
      console.error('Test payment creation failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Payment History Debug (Direct Supabase)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <Button
            onClick={testPaymentAPI}
            disabled={loading || !user}
            variant="outline"
          >
            {loading ? 'Testing...' : 'Test Supabase Queries'}
          </Button>
          
          <Button 
            onClick={createTestPayment} 
            disabled={loading || !user}
            variant="outline"
          >
            Show Test Payment Structure
          </Button>
        </div>

        {!user && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-yellow-800">Please log in to test payment history</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <p className="text-red-800 font-medium">Error:</p>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {debugInfo && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded">
            <h3 className="font-medium mb-2">Debug Information:</h3>
            <pre className="text-sm overflow-auto max-h-96 bg-white p-3 border rounded">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}

        <div className="text-sm text-gray-600">
          <h4 className="font-medium mb-2">Expected Behavior:</h4>
          <ul className="list-disc list-inside space-y-1">
            <li>API should return 200 status with payment data structure</li>
            <li>If no payments exist, should return empty array with summary</li>
            <li>RLS policies should only show user's own payment records</li>
            <li>Payment history component should handle empty state gracefully</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
