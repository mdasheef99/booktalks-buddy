import { supabase } from '@/lib/supabase';

export interface CustomQuote {
  id: string;
  store_id: string;
  quote_text: string;
  quote_author?: string;
  quote_source?: string;
  quote_category: 'general' | 'inspirational' | 'literary' | 'seasonal' | 'store_specific';
  quote_tags?: string[];
  is_active: boolean;
  display_order: number;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface QuoteFormData {
  quote_text: string;
  quote_author?: string;
  quote_source?: string;
  quote_category: 'general' | 'inspirational' | 'literary' | 'seasonal' | 'store_specific';
  quote_tags?: string[];
  is_active: boolean;
  start_date?: string;
  end_date?: string;
}

/**
 * Quote Management API for Store Owners
 * Provides CRUD operations for custom quotes
 */
export class QuotesAPI {
  /**
   * Fetch all quotes for a store
   */
  static async getStoreQuotes(storeId: string): Promise<CustomQuote[]> {
    const { data, error } = await supabase
      .from('store_custom_quotes')
      .select('*')
      .eq('store_id', storeId)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching store quotes:', error);
      throw new Error('Failed to fetch quotes');
    }

    return data || [];
  }

  /**
   * Fetch only currently active quotes for a store (OPTIMIZED)
   */
  static async getActiveStoreQuotes(storeId: string): Promise<CustomQuote[]> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('store_custom_quotes')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .or(`start_date.is.null,start_date.lte.${now}`)
      .or(`end_date.is.null,end_date.gt.${now}`)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching active store quotes:', error);
      throw new Error('Failed to fetch active quotes');
    }

    return data || [];
  }

  /**
   * Get current active quote for display
   */
  static async getCurrentActiveQuote(storeId: string): Promise<CustomQuote | null> {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('store_custom_quotes')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .or(`start_date.is.null,start_date.lte.${now}`)
      .or(`end_date.is.null,end_date.gt.${now}`)
      .order('display_order', { ascending: true })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - no active quotes
        return null;
      }
      console.error('Error fetching current active quote:', error);
      throw new Error('Failed to fetch current quote');
    }

    return data;
  }

  /**
   * Create a new quote
   */
  static async createQuote(storeId: string, quoteData: QuoteFormData): Promise<CustomQuote> {
    // Get the next display order
    const { data: maxOrderData } = await supabase
      .from('store_custom_quotes')
      .select('display_order')
      .eq('store_id', storeId)
      .order('display_order', { ascending: false })
      .limit(1);

    const nextOrder = maxOrderData && maxOrderData.length > 0 
      ? maxOrderData[0].display_order + 1 
      : 1;

    const { data, error } = await supabase
      .from('store_custom_quotes')
      .insert({
        store_id: storeId,
        ...quoteData,
        display_order: nextOrder,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating quote:', error);
      throw new Error('Failed to create quote');
    }

    return data;
  }

  /**
   * Update an existing quote
   */
  static async updateQuote(storeId: string, quoteId: string, updates: Partial<QuoteFormData>): Promise<void> {
    const { error } = await supabase
      .from('store_custom_quotes')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', quoteId)
      .eq('store_id', storeId);

    if (error) {
      console.error('Error updating quote:', error);
      throw new Error('Failed to update quote');
    }
  }

  /**
   * Delete a quote
   */
  static async deleteQuote(storeId: string, quoteId: string): Promise<void> {
    const { error } = await supabase
      .from('store_custom_quotes')
      .delete()
      .eq('id', quoteId)
      .eq('store_id', storeId);

    if (error) {
      console.error('Error deleting quote:', error);
      throw new Error('Failed to delete quote');
    }
  }

  /**
   * Reorder quotes by updating display_order
   */
  static async reorderQuotes(storeId: string, quoteIds: string[]): Promise<void> {
    const updates = quoteIds.map((id, index) => ({
      id,
      display_order: index + 1,
      updated_at: new Date().toISOString(),
    }));

    for (const update of updates) {
      const { error } = await supabase
        .from('store_custom_quotes')
        .update({
          display_order: update.display_order,
          updated_at: update.updated_at,
        })
        .eq('id', update.id)
        .eq('store_id', storeId);

      if (error) {
        console.error('Error reordering quotes:', error);
        throw new Error('Failed to reorder quotes');
      }
    }
  }

  /**
   * Toggle quote active status
   */
  static async toggleQuoteStatus(storeId: string, quoteId: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('store_custom_quotes')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', quoteId)
      .eq('store_id', storeId);

    if (error) {
      console.error('Error toggling quote status:', error);
      throw new Error('Failed to update quote status');
    }
  }

  /**
   * Get quotes by category
   */
  static async getQuotesByCategory(
    storeId: string, 
    category: CustomQuote['quote_category']
  ): Promise<CustomQuote[]> {
    const { data, error } = await supabase
      .from('store_custom_quotes')
      .select('*')
      .eq('store_id', storeId)
      .eq('quote_category', category)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching quotes by category:', error);
      throw new Error('Failed to fetch quotes by category');
    }

    return data || [];
  }

  /**
   * Search quotes by text content
   */
  static async searchQuotes(storeId: string, searchTerm: string): Promise<CustomQuote[]> {
    const { data, error } = await supabase
      .from('store_custom_quotes')
      .select('*')
      .eq('store_id', storeId)
      .or(`quote_text.ilike.%${searchTerm}%,quote_author.ilike.%${searchTerm}%,quote_source.ilike.%${searchTerm}%`)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error searching quotes:', error);
      throw new Error('Failed to search quotes');
    }

    return data || [];
  }
}
