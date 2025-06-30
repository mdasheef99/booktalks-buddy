import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { 
  BookAvailabilityRequestFormData,
  BookAvailabilityRequestData,
  validateBookAvailabilityRequestForm
} from '@/types/bookAvailabilityRequests';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGetRequests(req, res);
  } else if (req.method === 'POST') {
    return handleCreateRequest(req, res);
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

/**
 * GET /api/book-availability-requests
 * Get book availability requests for a store (requires store owner authentication)
 */
async function handleGetRequests(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { storeId, status } = req.query;
    console.log('GET /api/book-availability-requests called with:', { storeId, status });

    if (!storeId) {
      console.log('No storeId provided, returning 400');
      return res.status(400).json({ error: 'Store ID is required' });
    }

    // Build query
    let query = supabase
      .from('book_availability_requests')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    // Filter by status if provided
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    console.log('Supabase query result:', { data: data?.length || 0, error });

    if (error) {
      console.error('Error fetching book availability requests:', error);
      return res.status(500).json({ error: 'Failed to fetch book availability requests' });
    }

    console.log('Returning successful response with', data?.length || 0, 'requests');
    return res.status(200).json({ requests: data || [] });
  } catch (error) {
    console.error('Unexpected error in GET /api/book-availability-requests:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/book-availability-requests
 * Create a new book availability request (public endpoint for customers)
 */
async function handleCreateRequest(req: NextApiRequest, res: NextApiResponse) {
  try {
    const requestData = req.body as BookAvailabilityRequestFormData & {
      store_id: string;
    };

    // Validate required fields
    const requiredFields = ['store_id', 'customer_name', 'customer_email', 'customer_phone', 'book_title', 'book_author'];
    const missingFields = requiredFields.filter(field => !requestData[field as keyof typeof requestData]);

    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        missingFields 
      });
    }

    // Validate form data
    const validationErrors = validateBookAvailabilityRequestForm(requestData);
    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        validationErrors 
      });
    }

    // Prepare data for insertion
    const insertData = {
      store_id: requestData.store_id,
      customer_name: requestData.customer_name.trim(),
      customer_email: requestData.customer_email.trim(),
      customer_phone: requestData.customer_phone.trim(),
      book_title: requestData.book_title.trim(),
      book_author: requestData.book_author.trim(),
      description: requestData.description?.trim() || null,
      status: 'pending' as const,
    };

    // Insert into database
    const { data, error } = await supabase
      .from('book_availability_requests')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating book availability request:', error);
      return res.status(500).json({ error: 'Failed to create book availability request' });
    }

    return res.status(201).json({ 
      request: data,
      message: 'Book availability request submitted successfully' 
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/book-availability-requests:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
