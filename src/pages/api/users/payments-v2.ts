/**
 * User Payment History API v2
 * 
 * GET /api/users/payments-v2
 * Retrieves authenticated user's complete payment history across all subscriptions.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Create authenticated Supabase client
    const supabase = createServerSupabaseClient({ req, res });
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        details: sessionError?.message || 'No valid session found'
      });
    }

    const user = session.user;

    // Parse query parameters
    const {
      page = '1',
      limit = '20'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
    const offset = (pageNum - 1) * limitNum;

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
      .range(offset, offset + limitNum - 1);

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError);
      return res.status(500).json({ 
        error: 'Failed to fetch payment history',
        details: paymentsError.message 
      });
    }

    // Get total count
    const { count: totalCount, error: countError } = await supabase
      .from('payment_records')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (countError) {
      console.error('Error counting payments:', countError);
    }

    // Calculate summary statistics
    const totalPayments = totalCount || 0;
    const totalAmount = payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
    
    // Get date range
    const paymentDates = payments?.map(p => p.payment_date).sort() || [];
    
    const summary = {
      totalPayments,
      totalAmount,
      firstPaymentDate: paymentDates.length > 0 ? paymentDates[0] : null,
      lastPaymentDate: paymentDates.length > 0 ? paymentDates[paymentDates.length - 1] : null,
      uniqueSubscriptions: 0
    };

    // Format response
    const response = {
      payments: payments || [],
      pagination: {
        total: totalCount || 0,
        page: pageNum,
        limit: limitNum,
        hasMore: (offset + limitNum) < (totalCount || 0)
      },
      summary
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Unexpected error in payment history API:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
