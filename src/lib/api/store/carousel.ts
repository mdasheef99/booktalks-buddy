import { supabase } from '@/lib/supabase';

export interface CarouselItem {
  id: string;
  store_id: string;
  position: number;
  display_order: number;
  book_title: string;
  book_author: string;
  book_isbn?: string;
  custom_description?: string;
  featured_badge?: 'new_arrival' | 'staff_pick' | 'bestseller' | 'on_sale' | 'featured' | 'none';
  overlay_text?: string;
  book_image_url?: string;
  book_image_alt?: string;
  click_destination_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCarouselItemData {
  store_id: string;
  position: number;
  book_title: string;
  book_author: string;
  book_isbn?: string;
  custom_description?: string;
  featured_badge?: 'new_arrival' | 'staff_pick' | 'bestseller' | 'on_sale' | 'featured' | 'none';
  overlay_text?: string;
  book_image_url?: string;
  book_image_alt?: string;
  click_destination_url?: string;
  is_active?: boolean;
}

export interface UpdateCarouselItemData {
  position?: number;
  book_title?: string;
  book_author?: string;
  book_isbn?: string;
  custom_description?: string;
  featured_badge?: 'new_arrival' | 'staff_pick' | 'bestseller' | 'on_sale' | 'featured' | 'none';
  overlay_text?: string;
  book_image_url?: string;
  book_image_alt?: string;
  click_destination_url?: string;
  is_active?: boolean;
}

/**
 * Carousel API service for managing store carousel items
 */
export class CarouselAPI {
  /**
   * Get all carousel items for a store
   */
  static async getCarouselItems(storeId: string): Promise<CarouselItem[]> {
    const { data, error } = await supabase
      .from('store_carousel_items')
      .select('*')
      .eq('store_id', storeId)
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching carousel items:', error);
      throw new Error('Failed to fetch carousel items');
    }

    return data || [];
  }

  /**
   * Get active carousel items for a store (for public display)
   */
  static async getActiveCarouselItems(storeId: string): Promise<CarouselItem[]> {
    const { data, error } = await supabase
      .from('store_carousel_items')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .order('position', { ascending: true })
      .limit(6);

    if (error) {
      console.error('Error fetching active carousel items:', error);
      throw new Error('Failed to fetch carousel items');
    }

    return data || [];
  }

  /**
   * Get a single carousel item by ID
   */
  static async getCarouselItem(itemId: string): Promise<CarouselItem | null> {
    const { data, error } = await supabase
      .from('store_carousel_items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Item not found
      }
      console.error('Error fetching carousel item:', error);
      throw new Error('Failed to fetch carousel item');
    }

    return data;
  }

  /**
   * Create a new carousel item
   */
  static async createCarouselItem(itemData: CreateCarouselItemData): Promise<CarouselItem> {
    const { data, error } = await supabase
      .from('store_carousel_items')
      .insert({
        ...itemData,
        display_order: itemData.position,
        is_active: itemData.is_active ?? true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating carousel item:', error);
      throw new Error('Failed to create carousel item');
    }

    return data;
  }

  /**
   * Update a carousel item
   */
  static async updateCarouselItem(
    itemId: string, 
    updates: UpdateCarouselItemData
  ): Promise<CarouselItem> {
    const updateData: any = { ...updates };
    
    // Update display_order if position is changed
    if (updates.position !== undefined) {
      updateData.display_order = updates.position;
    }

    const { data, error } = await supabase
      .from('store_carousel_items')
      .update(updateData)
      .eq('id', itemId)
      .select()
      .single();

    if (error) {
      console.error('Error updating carousel item:', error);
      throw new Error('Failed to update carousel item');
    }

    return data;
  }

  /**
   * Delete a carousel item
   */
  static async deleteCarouselItem(itemId: string): Promise<void> {
    const { error } = await supabase
      .from('store_carousel_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error deleting carousel item:', error);
      throw new Error('Failed to delete carousel item');
    }
  }

  /**
   * Reorder carousel items
   */
  static async reorderCarouselItems(
    storeId: string, 
    itemPositions: { id: string; position: number }[]
  ): Promise<void> {
    // Use a transaction to update all positions atomically
    const updates = itemPositions.map(({ id, position }) => ({
      id,
      position,
      display_order: position
    }));

    for (const update of updates) {
      const { error } = await supabase
        .from('store_carousel_items')
        .update({ 
          position: update.position, 
          display_order: update.display_order 
        })
        .eq('id', update.id)
        .eq('store_id', storeId);

      if (error) {
        console.error('Error updating carousel item position:', error);
        throw new Error('Failed to reorder carousel items');
      }
    }
  }

  /**
   * Get next available position for a store
   */
  static async getNextPosition(storeId: string): Promise<number> {
    const { data, error } = await supabase
      .from('store_carousel_items')
      .select('position')
      .eq('store_id', storeId)
      .order('position', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error getting next position:', error);
      return 1;
    }

    if (!data || data.length === 0) {
      return 1;
    }

    const maxPosition = data[0].position;
    return Math.min(maxPosition + 1, 6); // Max 6 items
  }

  /**
   * Check if position is available
   */
  static async isPositionAvailable(storeId: string, position: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('store_carousel_items')
      .select('id')
      .eq('store_id', storeId)
      .eq('position', position)
      .limit(1);

    if (error) {
      console.error('Error checking position availability:', error);
      return false;
    }

    return !data || data.length === 0;
  }
}
