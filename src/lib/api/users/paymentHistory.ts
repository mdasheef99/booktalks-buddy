/**
 * Payment History Service Layer
 * 
 * Provides business logic for user payment history operations.
 * Handles subscription stacking scenarios and payment data processing.
 */

import { supabase } from '@/lib/supabase';

export interface PaymentRecord {
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

export interface PaymentHistoryOptions {
  page?: number;
  limit?: number;
  sortBy?: 'payment_date' | 'amount' | 'created_at';
  sortOrder?: 'asc' | 'desc';
  tier?: string;
  subscription_type?: string;
  date_from?: string;
  date_to?: string;
}

export interface PaymentSummary {
  totalPayments: number;
  totalAmount: number;
  firstPaymentDate: string | null;
  lastPaymentDate: string | null;
  uniqueSubscriptions: number;
  averagePayment: number;
  paymentsByTier: Record<string, { count: number; amount: number }>;
  paymentsByType: Record<string, { count: number; amount: number }>;
}

/**
 * Get user's payment history with pagination and filtering
 */
export async function getUserPaymentHistory(
  userId: string,
  options: PaymentHistoryOptions = {}
): Promise<{
  payments: PaymentRecord[];
  total: number;
  hasMore: boolean;
}> {
  const {
    page = 1,
    limit = 20,
    sortBy = 'payment_date',
    sortOrder = 'desc',
    tier,
    subscription_type,
    date_from,
    date_to
  } = options;

  const offset = (page - 1) * limit;

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
      created_at,
      subscription:user_subscriptions(
        id,
        tier,
        subscription_type,
        start_date,
        end_date,
        is_active
      ),
      recorded_by_user:recorded_by(
        id,
        displayname,
        email
      )
    `)
    .eq('user_id', userId);

  // Apply filters
  if (tier) {
    query = query.eq('user_subscriptions.tier', tier);
  }
  if (subscription_type) {
    query = query.eq('user_subscriptions.subscription_type', subscription_type);
  }
  if (date_from) {
    query = query.gte('payment_date', date_from);
  }
  if (date_to) {
    query = query.lte('payment_date', date_to);
  }

  // Apply sorting
  const order = sortOrder === 'asc' ? { ascending: true } : { ascending: false };
  query = query.order(sortBy, order);

  // Get total count
  const { count: total, error: countError } = await supabase
    .from('payment_records')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (countError) {
    throw new Error(`Failed to get payment count: ${countError.message}`);
  }

  // Get paginated results
  const { data: payments, error: paymentsError } = await query
    .range(offset, offset + limit - 1);

  if (paymentsError) {
    throw new Error(`Failed to get payment history: ${paymentsError.message}`);
  }

  return {
    payments: payments || [],
    total: total || 0,
    hasMore: (offset + limit) < (total || 0)
  };
}

/**
 * Get comprehensive payment summary for user
 */
export async function getUserPaymentSummary(userId: string): Promise<PaymentSummary> {
  const { data: payments, error } = await supabase
    .from('payment_records')
    .select(`
      amount,
      payment_date,
      subscription_id,
      subscription:user_subscriptions(
        tier,
        subscription_type
      )
    `)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to get payment summary: ${error.message}`);
  }

  if (!payments || payments.length === 0) {
    return {
      totalPayments: 0,
      totalAmount: 0,
      firstPaymentDate: null,
      lastPaymentDate: null,
      uniqueSubscriptions: 0,
      averagePayment: 0,
      paymentsByTier: {},
      paymentsByType: {}
    };
  }

  // Calculate basic statistics
  const totalPayments = payments.length;
  const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const paymentDates = payments.map(p => p.payment_date).filter(Boolean).sort();
  const uniqueSubscriptions = new Set(payments.map(p => p.subscription_id).filter(Boolean)).size;
  const averagePayment = totalPayments > 0 ? totalAmount / totalPayments : 0;

  // Group by tier
  const paymentsByTier: Record<string, { count: number; amount: number }> = {};
  payments.forEach(payment => {
    const tier = payment.subscription?.tier || 'unknown';
    if (!paymentsByTier[tier]) {
      paymentsByTier[tier] = { count: 0, amount: 0 };
    }
    paymentsByTier[tier].count++;
    paymentsByTier[tier].amount += payment.amount || 0;
  });

  // Group by subscription type
  const paymentsByType: Record<string, { count: number; amount: number }> = {};
  payments.forEach(payment => {
    const type = payment.subscription?.subscription_type || 'unknown';
    if (!paymentsByType[type]) {
      paymentsByType[type] = { count: 0, amount: 0 };
    }
    paymentsByType[type].count++;
    paymentsByType[type].amount += payment.amount || 0;
  });

  return {
    totalPayments,
    totalAmount,
    firstPaymentDate: paymentDates.length > 0 ? paymentDates[0] : null,
    lastPaymentDate: paymentDates.length > 0 ? paymentDates[paymentDates.length - 1] : null,
    uniqueSubscriptions,
    averagePayment,
    paymentsByTier,
    paymentsByType
  };
}

/**
 * Get payment history grouped by subscription for stacking visualization
 */
export async function getPaymentHistoryBySubscription(userId: string): Promise<{
  subscriptions: Array<{
    subscription: {
      id: string;
      tier: string;
      subscription_type: string;
      start_date: string;
      end_date: string;
      is_active: boolean;
    };
    payments: PaymentRecord[];
    totalAmount: number;
  }>;
}> {
  const { data: payments, error } = await supabase
    .from('payment_records')
    .select(`
      id,
      amount,
      currency,
      payment_method,
      payment_reference,
      payment_date,
      notes,
      created_at,
      subscription:user_subscriptions(
        id,
        tier,
        subscription_type,
        start_date,
        end_date,
        is_active
      ),
      recorded_by_user:recorded_by(
        id,
        displayname,
        email
      )
    `)
    .eq('user_id', userId)
    .order('payment_date', { ascending: false });

  if (error) {
    throw new Error(`Failed to get payment history by subscription: ${error.message}`);
  }

  // Group payments by subscription
  const subscriptionMap = new Map();
  
  (payments || []).forEach(payment => {
    if (!payment.subscription) return;
    
    const subId = payment.subscription.id;
    if (!subscriptionMap.has(subId)) {
      subscriptionMap.set(subId, {
        subscription: payment.subscription,
        payments: [],
        totalAmount: 0
      });
    }
    
    const subData = subscriptionMap.get(subId);
    subData.payments.push(payment);
    subData.totalAmount += payment.amount || 0;
  });

  return {
    subscriptions: Array.from(subscriptionMap.values())
      .sort((a, b) => new Date(b.subscription.start_date).getTime() - new Date(a.subscription.start_date).getTime())
  };
}
