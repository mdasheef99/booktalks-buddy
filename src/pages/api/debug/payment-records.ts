/**
 * Debug API to check payment_records table structure and data
 * 
 * GET /api/debug/payment-records
 * Returns information about the payment_records table for debugging
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

    // Check if payment_records table exists and get structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('payment_records')
      .select('*')
      .limit(1);

    if (tableError) {
      return res.status(500).json({
        error: 'Table access error',
        details: tableError.message,
        user: { id: user.id, email: user.email }
      });
    }

    // Get total count of payment records
    const { count: totalRecords, error: countError } = await supabase
      .from('payment_records')
      .select('*', { count: 'exact', head: true });

    // Get count for current user
    const { count: userRecords, error: userCountError } = await supabase
      .from('payment_records')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Get sample records (first 3)
    const { data: sampleRecords, error: sampleError } = await supabase
      .from('payment_records')
      .select('*')
      .limit(3);

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      tableAccess: 'OK',
      totalRecords: totalRecords || 0,
      userRecords: userRecords || 0,
      sampleRecords: sampleRecords || [],
      errors: {
        tableError: tableError?.message || null,
        countError: countError?.message || null,
        userCountError: userCountError?.message || null,
        sampleError: sampleError?.message || null
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Unexpected error in debug API:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
