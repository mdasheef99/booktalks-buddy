import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { BookListingUpdateData } from '@/types/bookListings';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { listingId } = req.query;

  if (!listingId || typeof listingId !== 'string') {
    return res.status(400).json({ error: 'Invalid listing ID' });
  }

  if (req.method === 'GET') {
    return handleGetListing(req, res, listingId);
  } else if (req.method === 'PUT') {
    return handleUpdateListing(req, res, listingId);
  } else if (req.method === 'DELETE') {
    return handleDeleteListing(req, res, listingId);
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

/**
 * GET /api/book-listings/[listingId]
 * Get a specific book listing
 */
async function handleGetListing(req: NextApiRequest, res: NextApiResponse, listingId: string) {
  try {
    const { data, error } = await supabase
      .from('book_listings')
      .select('*')
      .eq('id', listingId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Book listing not found' });
      }
      console.error('Error fetching book listing:', error);
      return res.status(500).json({ error: 'Failed to fetch book listing' });
    }

    return res.status(200).json({ listing: data });
  } catch (error) {
    console.error('Unexpected error in GET /api/book-listings/[listingId]:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * PUT /api/book-listings/[listingId]
 * Update a book listing (requires store owner authentication)
 */
async function handleUpdateListing(req: NextApiRequest, res: NextApiResponse, listingId: string) {
  try {
    const updateData = req.body as BookListingUpdateData & { reviewed_by?: string };

    // Validate status if provided
    if (updateData.status) {
      const validStatuses = ['pending', 'approved', 'rejected'];
      if (!validStatuses.includes(updateData.status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
    }

    // Validate store owner notes length if provided
    if (updateData.store_owner_notes && updateData.store_owner_notes.length > 500) {
      return res.status(400).json({ error: 'Store owner notes too long (max 500 characters)' });
    }

    // Prepare update data
    const updatePayload: any = {};
    
    if (updateData.status) {
      updatePayload.status = updateData.status;
      updatePayload.reviewed_at = new Date().toISOString();
    }
    
    if (updateData.store_owner_notes !== undefined) {
      updatePayload.store_owner_notes = updateData.store_owner_notes.trim() || null;
    }
    
    if (updateData.reviewed_by) {
      updatePayload.reviewed_by = updateData.reviewed_by;
    }

    // Check if listing exists first
    const { data: existingListing, error: fetchError } = await supabase
      .from('book_listings')
      .select('id, store_id')
      .eq('id', listingId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Book listing not found' });
      }
      console.error('Error fetching book listing for update:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch book listing' });
    }

    // Update the listing
    const { data, error } = await supabase
      .from('book_listings')
      .update(updatePayload)
      .eq('id', listingId)
      .select()
      .single();

    if (error) {
      console.error('Error updating book listing:', error);
      return res.status(500).json({ error: 'Failed to update book listing' });
    }

    return res.status(200).json({ listing: data });
  } catch (error) {
    console.error('Unexpected error in PUT /api/book-listings/[listingId]:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * DELETE /api/book-listings/[listingId]
 * Delete a book listing (requires store owner authentication)
 */
async function handleDeleteListing(req: NextApiRequest, res: NextApiResponse, listingId: string) {
  try {
    // First get the listing to check if it exists and get image URLs for cleanup
    const { data: listing, error: fetchError } = await supabase
      .from('book_listings')
      .select('*')
      .eq('id', listingId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Book listing not found' });
      }
      console.error('Error fetching book listing for deletion:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch book listing' });
    }

    // Delete the listing from database
    const { error: deleteError } = await supabase
      .from('book_listings')
      .delete()
      .eq('id', listingId);

    if (deleteError) {
      console.error('Error deleting book listing:', deleteError);
      return res.status(500).json({ error: 'Failed to delete book listing' });
    }

    // Clean up images from storage (optional - could be done in background)
    const imageUrls = [listing.image_1_url, listing.image_2_url, listing.image_3_url]
      .filter(Boolean) as string[];

    if (imageUrls.length > 0) {
      try {
        const filePaths = imageUrls.map(url => {
          const urlParts = url.split('/');
          const fileName = urlParts[urlParts.length - 1];
          const folderName = urlParts[urlParts.length - 2];
          return `${folderName}/${fileName}`;
        });

        await supabase.storage
          .from('book-listing-images')
          .remove(filePaths);
      } catch (cleanupError) {
        console.error('Error cleaning up images:', cleanupError);
        // Don't fail the request if image cleanup fails
      }
    }

    return res.status(200).json({ message: 'Book listing deleted successfully' });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/book-listings/[listingId]:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
