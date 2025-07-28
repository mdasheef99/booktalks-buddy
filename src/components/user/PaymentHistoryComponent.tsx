/**
 * Payment History Component
 * 
 * Displays user's complete payment history with subscription stacking support.
 * Features filtering, sorting, pagination, and comprehensive payment details.
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
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CreditCard,
  Calendar,
  DollarSign,
  FileText,
  Filter,
  ChevronDown,
  ChevronUp,
  Receipt,
  TrendingUp,
  Clock,
  Star,
  Crown
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface PaymentRecord {
  id: string;
  amount: number | null;
  currency: string;
  payment_method: string;
  payment_reference: string | null;
  payment_date: string;
  notes: string | null;
  created_at: string;
  subscription: {
    id: string;
    tier: string;
    subscription_type: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
  } | null;
  recorded_by: {
    id: string;
    displayname: string | null;
    email: string;
  } | null;
}

interface PaymentSummary {
  totalPayments: number;
  totalAmount: number;
  firstPaymentDate: string | null;
  lastPaymentDate: string | null;
  uniqueSubscriptions: number;
}

interface PaymentHistoryComponentProps {
  className?: string;
  showSummary?: boolean;
  showFilters?: boolean;
  initialLimit?: number;
  compact?: boolean;
}

export const PaymentHistoryComponent: React.FC<PaymentHistoryComponentProps> = ({
  className = '',
  showSummary = true,
  showFilters = true,
  initialLimit = 10,
  compact = false
}) => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  // Filter states
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('payment_date');
  const [sortOrder, setSortOrder] = useState<string>('desc');

  const fetchPaymentHistory = async (resetPage = false) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const currentPage = resetPage ? 1 : page;
      const offset = (currentPage - 1) * initialLimit;

      // Use direct Supabase call instead of API route
      const { supabase } = await import('@/lib/supabase');

      // Build query
      let query = supabase
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
        .eq('user_id', user.id);

      // Apply sorting
      const ascending = sortOrder === 'asc';
      query = query.order(sortBy, { ascending });

      // Apply pagination
      query = query.range(offset, offset + initialLimit - 1);

      // Execute query
      const { data: payments, error: paymentsError } = await query;

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

      const paymentDates = payments?.map(p => p.payment_date).sort() || [];

      const summary = {
        totalPayments,
        totalAmount,
        firstPaymentDate: paymentDates.length > 0 ? paymentDates[0] : null,
        lastPaymentDate: paymentDates.length > 0 ? paymentDates[paymentDates.length - 1] : null,
        uniqueSubscriptions: 0
      };

      if (resetPage) {
        setPayments(payments || []);
        setPage(1);
      } else {
        setPayments(prev => [...prev, ...(payments || [])]);
      }

      setSummary(summary);
      setHasMore((offset + initialLimit) < (totalCount || 0));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentHistory(true);
  }, [user, tierFilter, typeFilter, sortBy, sortOrder]);

  const getTierIcon = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'privileged_plus':
        return <Crown className="h-4 w-4 text-purple-500" />;
      case 'privileged':
        return <Star className="h-4 w-4 text-blue-500" />;
      default:
        return <CreditCard className="h-4 w-4 text-gray-500" />;
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
    if (amount === null) return 'Amount not specified';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  if (loading && payments.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bookconnect-brown"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => fetchPaymentHistory(true)} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Summary Section */}
      {showSummary && summary && !compact && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-bookconnect-brown" />
              Payment Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-bookconnect-brown">
                  {summary.totalPayments}
                </div>
                <div className="text-sm text-gray-600">Total Payments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(summary.totalAmount)}
                </div>
                <div className="text-sm text-gray-600">Total Amount</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {summary.uniqueSubscriptions}
                </div>
                <div className="text-sm text-gray-600">Subscriptions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {summary.firstPaymentDate ? 
                    format(new Date(summary.firstPaymentDate), 'MMM yyyy') : 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Member Since</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Payment History Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-bookconnect-brown" />
              Payment History
            </CardTitle>
            
            {showFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {showFiltersPanel ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            )}
          </div>

          {/* Filters Panel */}
          {showFilters && showFiltersPanel && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Tier</label>
                  <Select value={tierFilter} onValueChange={setTierFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tiers</SelectItem>
                      <SelectItem value="privileged_plus">Privileged Plus</SelectItem>
                      <SelectItem value="privileged">Privileged</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Type</label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Sort By</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="payment_date">Payment Date</SelectItem>
                      <SelectItem value="amount">Amount</SelectItem>
                      <SelectItem value="created_at">Created Date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Order</label>
                  <Select value={sortOrder} onValueChange={setSortOrder}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Newest First</SelectItem>
                      <SelectItem value="asc">Oldest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No payment history found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment, index) => (
                <div key={payment.id}>
                  <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getTierIcon(payment.subscription?.tier || '')}
                        <div className="font-medium text-bookconnect-brown">
                          {formatCurrency(payment.amount, payment.currency)}
                        </div>
                        {payment.subscription && (
                          <Badge className={getTierBadgeColor(payment.subscription.tier)}>
                            {payment.subscription.tier.replace('_', ' ').toUpperCase()}
                          </Badge>
                        )}
                        {payment.subscription && (
                          <Badge variant="outline">
                            {payment.subscription.subscription_type}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(payment.payment_date), 'PPP')}
                        </div>
                        <div className="flex items-center gap-1">
                          <CreditCard className="h-4 w-4" />
                          {payment.payment_method}
                        </div>
                      </div>

                      {payment.subscription && (
                        <div className="text-sm text-gray-600 mb-2">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Subscription: {format(new Date(payment.subscription.start_date), 'MMM dd, yyyy')} - {format(new Date(payment.subscription.end_date), 'MMM dd, yyyy')}
                            {payment.subscription.is_active && (
                              <Badge variant="outline" className="ml-2 text-green-600 border-green-200">
                                Active
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {payment.payment_reference && (
                        <div className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Reference:</span> {payment.payment_reference}
                        </div>
                      )}

                      {payment.notes && (
                        <div className="text-sm text-gray-600">
                          <div className="flex items-start gap-1">
                            <FileText className="h-4 w-4 mt-0.5" />
                            <span>{payment.notes}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {index < payments.length - 1 && <Separator className="my-2" />}
                </div>
              ))}

              {hasMore && (
                <div className="text-center pt-4">
                  <Button
                    onClick={() => {
                      setPage(prev => prev + 1);
                      fetchPaymentHistory();
                    }}
                    variant="outline"
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
