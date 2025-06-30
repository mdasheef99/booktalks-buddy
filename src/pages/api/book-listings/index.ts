import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { BookListingFormData, BookListingData } from '@/types/bookListings';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGetListings(req, res);
  } else if (req.method === 'POST') {
    return handleCreateListing(req, res);
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

/**
 * GET /api/book-listings
 * Get book listings for a store (requires store owner authentication)
 */
async function handleGetListings(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { storeId, status } = req.query;

    if (!storeId) {
      return res.status(400).json({ error: 'Store ID is required' });
    }

    // Build query
    let query = supabase
      .from('book_listings')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    // Filter by status if provided
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching book listings:', error);
      return res.status(500).json({ error: 'Failed to fetch book listings' });
    }

    return res.status(200).json({ listings: data });
  } catch (error) {
    console.error('Unexpected error in GET /api/book-listings:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/book-listings
 * Create a new book listing (public endpoint for customers)
 */
async function handleCreateListing(req: NextApiRequest, res: NextApiResponse) {
  try {
    const listingData = req.body as BookListingFormData & {
      store_id: string;
      image_1_url?: string;
      image_2_url?: string;
      image_3_url?: string;
    };

    // Validate required fields
    const requiredFields = ['store_id', 'customer_name', 'customer_email', 'customer_phone', 'book_title', 'book_author', 'book_condition'];
    const missingFields = requiredFields.filter(field => !listingData[field as keyof typeof listingData]);

    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        missingFields 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(listingData.customer_email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate book condition
    const validConditions = ['excellent', 'very_good', 'good', 'fair', 'poor'];
    if (!validConditions.includes(listingData.book_condition)) {
      return res.status(400).json({ error: 'Invalid book condition' });
    }

    // Validate asking price if provided
    if (listingData.asking_price !== undefined) {
      const price = Number(listingData.asking_price);
      if (isNaN(price) || price < 0 || price > 9999.99) {
        return res.status(400).json({ error: 'Invalid asking price' });
      }
    }

    // Validate string lengths
    if (listingData.customer_name.length > 100) {
      return res.status(400).json({ error: 'Customer name too long (max 100 characters)' });
    }
    if (listingData.customer_email.length > 255) {
      return res.status(400).json({ error: 'Customer email too long (max 255 characters)' });
    }
    if (!listingData.customer_phone || listingData.customer_phone.length > 20) {
      return res.status(400).json({ error: 'Customer phone is required and must be 20 characters or less' });
    }
    if (listingData.book_title.length > 200) {
      return res.status(400).json({ error: 'Book title too long (max 200 characters)' });
    }
    if (listingData.book_author.length > 100) {
      return res.status(400).json({ error: 'Book author too long (max 100 characters)' });
    }
    if (listingData.book_description && listingData.book_description.length > 1000) {
      return res.status(400).json({ error: 'Book description too long (max 1000 characters)' });
    }

    // Prepare data for insertion
    const insertData = {
      store_id: listingData.store_id,
      customer_name: listingData.customer_name.trim(),
      customer_email: listingData.customer_email.trim().toLowerCase(),
      customer_phone: listingData.customer_phone.trim(),
      book_title: listingData.book_title.trim(),
      book_author: listingData.book_author.trim(),
      book_isbn: listingData.book_isbn?.trim() || null,
      book_condition: listingData.book_condition,
      book_description: listingData.book_description?.trim() || null,
      asking_price: listingData.asking_price || null,
      image_1_url: listingData.image_1_url || null,
      image_2_url: listingData.image_2_url || null,
      image_3_url: listingData.image_3_url || null,
      status: 'pending'
    };

    const { data, error } = await supabase
      .from('book_listings')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Error creating book listing:', error);
      return res.status(500).json({ error: 'Failed to create book listing' });
    }

    return res.status(201).json({ listing: data });
  } catch (error) {
    console.error('Unexpected error in POST /api/book-listings:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
