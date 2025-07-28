/**
 * Payment History Debug Component
 * 
 * Temporary debug component to test payment history functionality
 * and diagnose any issues with the API or database.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

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
      console.log('Testing payment API for user:', user.id);

      // Test multiple endpoints
      const endpoints = [
        { name: 'Simple Test', url: '/api/users/test' },
        { name: 'Mock Payments', url: '/api/users/payments-simple' },
        { name: 'Auth Test', url: '/api/users/payments-test' },
        { name: 'Payment API v2', url: '/api/users/payments-v2?limit=5&page=1' },
        { name: 'Debug Records', url: '/api/debug/payment-records' }
      ];

      const results = {};

      for (const endpoint of endpoints) {
        try {
          console.log(`Testing ${endpoint.name}:`, endpoint.url);
          const response = await fetch(endpoint.url);

          if (!response.ok) {
            const errorText = await response.text();
            results[endpoint.name] = {
              status: response.status,
              error: errorText
            };
          } else {
            const data = await response.json();
            results[endpoint.name] = {
              status: response.status,
              data: data
            };
          }
        } catch (err) {
          results[endpoint.name] = {
            error: err instanceof Error ? err.message : 'Unknown error'
          };
        }
      }

      setDebugInfo({
        user: {
          id: user.id,
          email: user.email
        },
        endpointResults: results,
        timestamp: new Date().toISOString()
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
        <CardTitle>Payment History Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <Button 
            onClick={testPaymentAPI} 
            disabled={loading || !user}
            variant="outline"
          >
            {loading ? 'Testing...' : 'Test Payment API'}
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
