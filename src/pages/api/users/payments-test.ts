/**
 * Simple Payment History Test API
 * 
 * GET /api/users/payments-test
 * Simple test endpoint to verify authentication and basic functionality
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
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return res.status(401).json({ 
        error: 'Authentication failed',
        details: sessionError.message
      });
    }
    
    if (!session?.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        details: 'No valid session found'
      });
    }

    const user = session.user;

    // Test basic database connectivity
    const { data: testData, error: testError } = await supabase
      .from('payment_records')
      .select('count')
      .eq('user_id', user.id);

    if (testError) {
      console.error('Database test error:', testError);
      return res.status(500).json({ 
        error: 'Database connection failed',
        details: testError.message 
      });
    }

    // Return test response
    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      message: 'Authentication and database connection successful',
      paymentRecordsFound: testData?.length || 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Unexpected error in payment test API:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
