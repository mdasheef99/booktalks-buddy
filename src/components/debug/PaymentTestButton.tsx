/**
 * Payment Test Button Component
 * 
 * Simple component to test payment history functionality with direct Supabase calls
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export const PaymentTestButton: React.FC = () => {
  const { user } = useAuth();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testPaymentAccess = async () => {
    if (!user) {
      setResult({ error: 'No user logged in' });
      return;
    }

    setLoading(true);
    try {
      // Test 1: Check if we can access the payment_records table
      const { data: testAccess, error: accessError } = await supabase
        .from('payment_records')
        .select('count')
        .eq('user_id', user.id);

      if (accessError) {
        setResult({
          error: 'Table access failed',
          details: accessError.message,
          user: { id: user.id, email: user.email }
        });
        return;
      }

      // Test 2: Get actual payment records
      const { data: payments, error: paymentsError } = await supabase
        .from('payment_records')
        .select(`
          id,
          amount,
          currency,
          payment_method,
          payment_reference,
          payment_date,
          notes,
          created_at
        `)
        .eq('user_id', user.id)
        .order('payment_date', { ascending: false })
        .limit(5);

      if (paymentsError) {
        setResult({
          error: 'Payment query failed',
          details: paymentsError.message,
          user: { id: user.id, email: user.email }
        });
        return;
      }

      // Test 3: Get count
      const { count: totalCount, error: countError } = await supabase
        .from('payment_records')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setResult({
        success: true,
        user: { id: user.id, email: user.email },
        tableAccess: 'OK',
        totalRecords: totalCount || 0,
        payments: payments || [],
        errors: {
          accessError: accessError?.message || null,
          paymentsError: paymentsError?.message || null,
          countError: countError?.message || null
        }
      });

    } catch (error) {
      setResult({
        error: 'Unexpected error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const createTestPayment = async () => {
    if (!user) {
      setResult({ error: 'No user logged in' });
      return;
    }

    setLoading(true);
    try {
      // Create a test payment record
      const testPayment = {
        user_id: user.id,
        store_id: '00000000-0000-0000-0000-000000000001', // Default store ID
        amount: 19.99,
        currency: 'USD',
        payment_method: 'cash',
        payment_reference: 'TEST-' + Date.now(),
        payment_date: new Date().toISOString(),
        recorded_by: user.id,
        notes: 'Test payment created by debug component'
      };

      const { data, error } = await supabase
        .from('payment_records')
        .insert([testPayment])
        .select()
        .single();

      if (error) {
        setResult({
          error: 'Failed to create test payment',
          details: error.message,
          testPayment
        });
        return;
      }

      setResult({
        success: true,
        message: 'Test payment created successfully',
        createdPayment: data
      });

    } catch (error) {
      setResult({
        error: 'Unexpected error creating payment',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Payment History Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <Button 
            onClick={testPaymentAccess} 
            disabled={loading || !user}
            variant="outline"
          >
            {loading ? 'Testing...' : 'Test Payment Access'}
          </Button>
          
          <Button 
            onClick={createTestPayment} 
            disabled={loading || !user}
            variant="outline"
          >
            {loading ? 'Creating...' : 'Create Test Payment'}
          </Button>
        </div>

        {!user && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-yellow-800">Please log in to test payment functionality</p>
          </div>
        )}

        {result && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded">
            <h3 className="font-medium mb-2">Test Results:</h3>
            <pre className="text-sm overflow-auto max-h-96 bg-white p-3 border rounded">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
