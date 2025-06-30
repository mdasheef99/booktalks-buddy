import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { BookAvailabilityRequestUpdateData } from '@/types/bookAvailabilityRequests';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { requestId } = req.query;

  if (!requestId || typeof requestId !== 'string') {
    return res.status(400).json({ error: 'Request ID is required' });
  }

  if (req.method === 'GET') {
    return handleGetRequest(req, res, requestId);
  } else if (req.method === 'PATCH') {
    return handleUpdateRequest(req, res, requestId);
  } else if (req.method === 'DELETE') {
    return handleDeleteRequest(req, res, requestId);
  } else {
    res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

/**
 * GET /api/book-availability-requests/[requestId]
 * Get a specific book availability request
 */
async function handleGetRequest(req: NextApiRequest, res: NextApiResponse, requestId: string) {
  try {
    const { data, error } = await supabase
      .from('book_availability_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Book availability request not found' });
      }
      console.error('Error fetching book availability request:', error);
      return res.status(500).json({ error: 'Failed to fetch book availability request' });
    }

    return res.status(200).json({ request: data });
  } catch (error) {
    console.error('Unexpected error in GET /api/book-availability-requests/[requestId]:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * PATCH /api/book-availability-requests/[requestId]
 * Update a book availability request (store owner only)
 */
async function handleUpdateRequest(req: NextApiRequest, res: NextApiResponse, requestId: string) {
  try {
    const updateData = req.body as BookAvailabilityRequestUpdateData & {
      user_id?: string;
    };

    // Validate status if provided
    if (updateData.status && !['pending', 'responded', 'resolved'].includes(updateData.status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    // Prepare update data
    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (updateData.status) {
      updates.status = updateData.status;
    }

    if (updateData.store_owner_notes !== undefined) {
      updates.store_owner_notes = updateData.store_owner_notes?.trim() || null;
    }

    // If status is being updated to 'responded' and no responded_at exists, set it
    if (updateData.status === 'responded' && updateData.user_id) {
      updates.responded_by = updateData.user_id;
      updates.responded_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('book_availability_requests')
      .update(updates)
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      console.error('Error updating book availability request:', error);
      return res.status(500).json({ error: 'Failed to update book availability request' });
    }

    return res.status(200).json({ 
      request: data,
      message: 'Book availability request updated successfully' 
    });
  } catch (error) {
    console.error('Unexpected error in PATCH /api/book-availability-requests/[requestId]:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * DELETE /api/book-availability-requests/[requestId]
 * Delete a book availability request (store owner only)
 */
async function handleDeleteRequest(req: NextApiRequest, res: NextApiResponse, requestId: string) {
  try {
    const { error } = await supabase
      .from('book_availability_requests')
      .delete()
      .eq('id', requestId);

    if (error) {
      console.error('Error deleting book availability request:', error);
      return res.status(500).json({ error: 'Failed to delete book availability request' });
    }

    return res.status(200).json({ 
      message: 'Book availability request deleted successfully' 
    });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/book-availability-requests/[requestId]:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
