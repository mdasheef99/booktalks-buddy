/**
 * Compact Payment History Component
 * 
 * Lightweight version for profile sections and book clubs integration.
 * Shows recent payments with option to view full history.
 */

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard,
  Calendar,
  Receipt,
  ExternalLink,
  Star,
  Crown,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface PaymentRecord {
  id: string;
  amount: number | null;
  currency: string;
  payment_method: string;
  payment_reference: string | null;
  payment_date: string;
  subscription: {
    id: string;
    tier: string;
    subscription_type: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
  } | null;
}

interface CompactPaymentHistoryProps {
  className?: string;
  maxItems?: number;
  showViewAllButton?: boolean;
  onViewAll?: () => void;
  title?: string;
}

export const CompactPaymentHistory: React.FC<CompactPaymentHistoryProps> = ({
  className = '',
  maxItems = 3,
  showViewAllButton = true,
  onViewAll,
  title = 'Recent Payments'
}) => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [summary, setSummary] = useState<{
    totalPayments: number;
    totalAmount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentPayments = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        // Use direct Supabase call instead of API route
        const { supabase } = await import('@/lib/supabase');

        // Get payment records for the user
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
          .limit(maxItems);

        if (paymentsError) {
          throw new Error(`Database error: ${paymentsError.message}`);
        }

        // Get total count
        const { count: totalCount, error: countError } = await supabase
          .from('payment_records')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (countError) {
          console.error('Error counting payments:', countError);
        }

        // Calculate summary
        const totalPayments = totalCount || 0;
        const totalAmount = payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;

        setPayments(payments || []);
        setSummary({
          totalPayments,
          totalAmount
        });

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load payments');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentPayments();
  }, [user, maxItems]);

  const getTierIcon = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'privileged_plus':
        return <Crown className="h-3 w-3 text-purple-500" />;
      case 'privileged':
        return <Star className="h-3 w-3 text-blue-500" />;
      default:
        return <CreditCard className="h-3 w-3 text-gray-500" />;
    }
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'privileged_plus':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'privileged':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amount: number | null, currency: string = 'USD') => {
    if (amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-bookconnect-brown"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="text-center py-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="h-4 w-4 text-bookconnect-brown" />
            {title}
          </CardTitle>
          
          {summary && (
            <div className="text-right">
              <div className="text-sm font-medium text-bookconnect-brown">
                {formatCurrency(summary.totalAmount)}
              </div>
              <div className="text-xs text-gray-600">
                {summary.totalPayments} payment{summary.totalPayments !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {payments.length === 0 ? (
          <div className="text-center py-6">
            <Receipt className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 text-sm">No payment history</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {payment.subscription && getTierIcon(payment.subscription.tier)}
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-bookconnect-brown">
                        {formatCurrency(payment.amount, payment.currency)}
                      </span>
                      {payment.subscription && (
                        <Badge 
                          className={`text-xs ${getTierBadgeColor(payment.subscription.tier)}`}
                        >
                          {payment.subscription.tier.replace('_', ' ').toUpperCase()}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(payment.payment_date), 'MMM dd, yyyy')}
                      </div>
                      {payment.subscription && (
                        <Badge variant="outline" className="text-xs">
                          {payment.subscription.subscription_type}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {payment.payment_reference && (
                  <div className="text-xs text-gray-500 text-right">
                    Ref: {payment.payment_reference}
                  </div>
                )}
              </div>
            ))}

            {showViewAllButton && summary && summary.totalPayments > maxItems && (
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onViewAll}
                  className="w-full flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  View All {summary.totalPayments} Payments
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Payment Summary Card for Dashboard/Profile Overview
 */
export const PaymentSummaryCard: React.FC<{
  className?: string;
  onClick?: () => void;
}> = ({ className = '', onClick }) => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<{
    totalPayments: number;
    totalAmount: number;
    lastPaymentDate: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!user) return;

      try {
        // Use direct Supabase call
        const { supabase } = await import('@/lib/supabase');

        // Get total count and sum
        const { count: totalPayments, error: countError } = await supabase
          .from('payment_records')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Get most recent payment for last payment date
        const { data: recentPayment, error: recentError } = await supabase
          .from('payment_records')
          .select('payment_date, amount')
          .eq('user_id', user.id)
          .order('payment_date', { ascending: false })
          .limit(1)
          .single();

        // Get total amount
        const { data: allPayments, error: amountError } = await supabase
          .from('payment_records')
          .select('amount')
          .eq('user_id', user.id);

        if (!countError && !recentError && !amountError) {
          const totalAmount = allPayments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;

          setSummary({
            totalPayments: totalPayments || 0,
            totalAmount,
            lastPaymentDate: recentPayment?.payment_date || null
          });
        }
      } catch (error) {
        console.error('Failed to fetch payment summary:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [user]);

  if (loading || !summary) {
    return (
      <Card className={`cursor-pointer hover:shadow-md transition-shadow ${className}`} onClick={onClick}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-bookconnect-brown"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Card className={`cursor-pointer hover:shadow-md transition-shadow ${className}`} onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-bookconnect-brown/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-bookconnect-brown" />
            </div>
            <div>
              <div className="font-medium text-bookconnect-brown">Payment History</div>
              <div className="text-sm text-gray-600">
                {summary.totalPayments} payment{summary.totalPayments !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="font-bold text-lg text-green-600">
              {formatCurrency(summary.totalAmount)}
            </div>
            {summary.lastPaymentDate && (
              <div className="text-xs text-gray-600">
                Last: {format(new Date(summary.lastPaymentDate), 'MMM dd')}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
