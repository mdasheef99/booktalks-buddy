import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

/**
 * API endpoint to get upcoming events
 * 
 * @param req - Next.js API request
 * @param res - Next.js API response
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const now = new Date().toISOString();
    
    // Get upcoming events (events with start_time in the future)
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .gt('start_time', now)
      .order('start_time', { ascending: true })
      .limit(6);
    
    if (error) {
      console.error('Error fetching upcoming events:', error);
      return res.status(500).json({ error: 'Failed to fetch upcoming events' });
    }
    
    return res.status(200).json({ data });
  } catch (error) {
    console.error('Unexpected error in upcoming events API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
