import { supabase } from '@/lib/supabase';

// =====================================================
// Types and Interfaces
// =====================================================

export interface BookAvailabilityRequestFormData {
  // Customer Information (Required)
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  
  // Book Information (Required)
  book_title: string;
  book_author: string;
  
  // Additional Details (Optional)
  description?: string;
}

export interface BookAvailabilityRequestData extends BookAvailabilityRequestFormData {
  id: string;
  store_id: string;
  status: 'pending' | 'responded' | 'resolved';
  store_owner_notes?: string;
  responded_by?: string;
  responded_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BookAvailabilityRequestSubmission {
  formData: BookAvailabilityRequestFormData;
  storeId: string;
}

export interface BookAvailabilityRequestUpdateData {
  status?: 'pending' | 'responded' | 'resolved';
  store_owner_notes?: string;
  responded_by?: string;
}

// =====================================================
// Service Class
// =====================================================

export class BookAvailabilityRequestService {
  /**
   * Submit a new book availability request
   */
  static async submitRequest(submission: BookAvailabilityRequestSubmission): Promise<BookAvailabilityRequestData> {
    try {
      // Validate required fields
      const { formData, storeId } = submission;
      
      if (!formData.customer_name?.trim()) {
        throw new Error('Customer name is required');
      }
      if (!formData.customer_email?.trim()) {
        throw new Error('Customer email is required');
      }
      if (!formData.customer_phone?.trim()) {
        throw new Error('Customer phone is required');
      }
      if (!formData.book_title?.trim()) {
        throw new Error('Book title is required');
      }
      if (!formData.book_author?.trim()) {
        throw new Error('Book author is required');
      }
      if (!storeId) {
        throw new Error('Store ID is required');
      }

      // Prepare data for insertion
      const requestData = {
        store_id: storeId,
        customer_name: formData.customer_name.trim(),
        customer_email: formData.customer_email.trim(),
        customer_phone: formData.customer_phone.trim(),
        book_title: formData.book_title.trim(),
        book_author: formData.book_author.trim(),
        description: formData.description?.trim() || null,
        status: 'pending' as const,
      };

      // Insert into database
      const { data, error } = await supabase
        .from('book_availability_requests')
        .insert(requestData)
        .select()
        .single();

      if (error) {
        console.error('Error submitting book availability request:', error);
        throw new Error('Failed to submit book availability request');
      }

      return data;
    } catch (error) {
      console.error('BookAvailabilityRequestService.submitRequest error:', error);
      throw error;
    }
  }

  /**
   * Get book availability requests for a store (store owner only)
   */
  static async getRequestsForStore(
    storeId: string,
    filters?: {
      status?: 'pending' | 'responded' | 'resolved' | 'all';
      searchTerm?: string;
    }
  ): Promise<BookAvailabilityRequestData[]> {
    try {
      if (!storeId) {
        throw new Error('Store ID is required');
      }

      // Build query
      let query = supabase
        .from('book_availability_requests')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      // Apply status filter
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      // Apply search filter
      if (filters?.searchTerm?.trim()) {
        const searchTerm = filters.searchTerm.trim();
        query = query.or(
          `book_title.ilike.%${searchTerm}%,book_author.ilike.%${searchTerm}%,customer_name.ilike.%${searchTerm}%`
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching book availability requests:', error);
        throw new Error('Failed to fetch book availability requests');
      }

      return data || [];
    } catch (error) {
      console.error('BookAvailabilityRequestService.getRequestsForStore error:', error);
      throw error;
    }
  }

  /**
   * Get a specific book availability request by ID
   */
  static async getRequestById(requestId: string): Promise<BookAvailabilityRequestData> {
    try {
      if (!requestId) {
        throw new Error('Request ID is required');
      }

      const { data, error } = await supabase
        .from('book_availability_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Book availability request not found');
        }
        console.error('Error fetching book availability request:', error);
        throw new Error('Failed to fetch book availability request');
      }

      return data;
    } catch (error) {
      console.error('BookAvailabilityRequestService.getRequestById error:', error);
      throw error;
    }
  }

  /**
   * Update a book availability request (store owner only)
   */
  static async updateRequest(
    requestId: string,
    updateData: BookAvailabilityRequestUpdateData,
    userId?: string
  ): Promise<BookAvailabilityRequestData> {
    try {
      if (!requestId) {
        throw new Error('Request ID is required');
      }

      // Prepare update data
      const updates: any = {
        ...updateData,
        updated_at: new Date().toISOString(),
      };

      // If status is being updated to 'responded' and no responded_at exists, set it
      if (updateData.status === 'responded' && userId) {
        updates.responded_by = userId;
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
        throw new Error('Failed to update book availability request');
      }

      return data;
    } catch (error) {
      console.error('BookAvailabilityRequestService.updateRequest error:', error);
      throw error;
    }
  }

  /**
   * Delete a book availability request (store owner only)
   */
  static async deleteRequest(requestId: string): Promise<void> {
    try {
      if (!requestId) {
        throw new Error('Request ID is required');
      }

      const { error } = await supabase
        .from('book_availability_requests')
        .delete()
        .eq('id', requestId);

      if (error) {
        console.error('Error deleting book availability request:', error);
        throw new Error('Failed to delete book availability request');
      }
    } catch (error) {
      console.error('BookAvailabilityRequestService.deleteRequest error:', error);
      throw error;
    }
  }

  /**
   * Get request statistics for a store
   */
  static async getRequestStats(storeId: string): Promise<{
    total: number;
    pending: number;
    responded: number;
    resolved: number;
  }> {
    try {
      if (!storeId) {
        throw new Error('Store ID is required');
      }

      const { data, error } = await supabase
        .from('book_availability_requests')
        .select('status')
        .eq('store_id', storeId);

      if (error) {
        console.error('Error fetching request stats:', error);
        throw new Error('Failed to fetch request statistics');
      }

      const stats = {
        total: data.length,
        pending: data.filter(r => r.status === 'pending').length,
        responded: data.filter(r => r.status === 'responded').length,
        resolved: data.filter(r => r.status === 'resolved').length,
      };

      return stats;
    } catch (error) {
      console.error('BookAvailabilityRequestService.getRequestStats error:', error);
      throw error;
    }
  }
}

// =====================================================
// Validation Helpers
// =====================================================

export const validateBookAvailabilityRequestData = (data: Partial<BookAvailabilityRequestFormData>): string[] => {
  const errors: string[] = [];

  if (!data.customer_name?.trim()) {
    errors.push('Customer name is required');
  }
  if (!data.customer_email?.trim()) {
    errors.push('Customer email is required');
  }
  if (!data.customer_phone?.trim()) {
    errors.push('Customer phone is required');
  }
  if (!data.book_title?.trim()) {
    errors.push('Book title is required');
  }
  if (!data.book_author?.trim()) {
    errors.push('Book author is required');
  }

  // Email format validation
  if (data.customer_email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.customer_email.trim())) {
    errors.push('Please enter a valid email address');
  }

  // Phone format validation (basic)
  if (data.customer_phone?.trim() && !/^[\+]?[1-9][\d]{0,15}$/.test(data.customer_phone.trim())) {
    errors.push('Please enter a valid phone number');
  }

  return errors;
};
