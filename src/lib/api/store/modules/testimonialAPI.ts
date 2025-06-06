/**
 * Testimonial API Module
 * Handles all testimonial related operations
 */

import { supabase } from '@/lib/supabase';
import type { 
  Testimonial, 
  TestimonialFormData, 
  TestimonialApprovalStatus 
} from '../types/communityShowcaseTypes';
import { 
  TABLE_NAMES, 
  QUERY_LIMITS, 
  ERROR_MESSAGES 
} from '../constants/communityShowcaseConstants';
import { 
  getCurrentISOString,
  calculateNextDisplayOrder,
  createReorderUpdates,
  validateStoreId,
  logErrorWithContext
} from '../utils/communityShowcaseUtils';

/**
 * Testimonial API operations
 */
export class TestimonialAPI {
  /**
   * Get approved testimonials for display
   */
  static async getApprovedTestimonials(storeId: string, limit: number = QUERY_LIMITS.DEFAULT_TESTIMONIALS): Promise<Testimonial[]> {
    if (!validateStoreId(storeId)) {
      throw new Error('Invalid store ID');
    }

    const { data, error } = await supabase
      .from(TABLE_NAMES.STORE_TESTIMONIALS)
      .select('*')
      .eq('store_id', storeId)
      .eq('approval_status', 'approved')
      .order('is_featured', { ascending: false })
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logErrorWithContext('getApprovedTestimonials', error);
      throw new Error(ERROR_MESSAGES.FETCH_TESTIMONIALS);
    }

    return data || [];
  }

  /**
   * Get all testimonials for admin management
   */
  static async getAllTestimonials(storeId: string): Promise<Testimonial[]> {
    if (!validateStoreId(storeId)) {
      throw new Error('Invalid store ID');
    }

    const { data, error } = await supabase
      .from(TABLE_NAMES.STORE_TESTIMONIALS)
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (error) {
      logErrorWithContext('getAllTestimonials', error);
      throw new Error(ERROR_MESSAGES.FETCH_TESTIMONIALS);
    }

    return data || [];
  }

  /**
   * Create a new testimonial
   */
  static async createTestimonial(storeId: string, testimonialData: TestimonialFormData): Promise<Testimonial> {
    if (!validateStoreId(storeId)) {
      throw new Error('Invalid store ID');
    }

    // Get the next display order
    const { data: maxOrderData } = await supabase
      .from(TABLE_NAMES.STORE_TESTIMONIALS)
      .select('display_order')
      .eq('store_id', storeId)
      .order('display_order', { ascending: false })
      .limit(1);

    const nextOrder = calculateNextDisplayOrder(maxOrderData || []);

    const { data, error } = await supabase
      .from(TABLE_NAMES.STORE_TESTIMONIALS)
      .insert({
        store_id: storeId,
        ...testimonialData,
        display_order: nextOrder,
        approval_status: 'approved', // Auto-approve manual testimonials
      })
      .select()
      .single();

    if (error) {
      logErrorWithContext('createTestimonial', error);
      throw new Error(ERROR_MESSAGES.CREATE_TESTIMONIAL);
    }

    return data;
  }

  /**
   * Update testimonial
   */
  static async updateTestimonial(
    storeId: string, 
    testimonialId: string, 
    updates: Partial<TestimonialFormData>
  ): Promise<void> {
    if (!validateStoreId(storeId)) {
      throw new Error('Invalid store ID');
    }

    const { error } = await supabase
      .from(TABLE_NAMES.STORE_TESTIMONIALS)
      .update({
        ...updates,
        updated_at: getCurrentISOString(),
      })
      .eq('id', testimonialId)
      .eq('store_id', storeId);

    if (error) {
      logErrorWithContext('updateTestimonial', error);
      throw new Error(ERROR_MESSAGES.UPDATE_TESTIMONIAL);
    }
  }

  /**
   * Delete testimonial
   */
  static async deleteTestimonial(storeId: string, testimonialId: string): Promise<void> {
    if (!validateStoreId(storeId)) {
      throw new Error('Invalid store ID');
    }

    const { error } = await supabase
      .from(TABLE_NAMES.STORE_TESTIMONIALS)
      .delete()
      .eq('id', testimonialId)
      .eq('store_id', storeId);

    if (error) {
      logErrorWithContext('deleteTestimonial', error);
      throw new Error(ERROR_MESSAGES.DELETE_TESTIMONIAL);
    }
  }

  /**
   * Update testimonial approval status
   */
  static async updateTestimonialApproval(
    storeId: string,
    testimonialId: string,
    status: TestimonialApprovalStatus
  ): Promise<void> {
    if (!validateStoreId(storeId)) {
      throw new Error('Invalid store ID');
    }

    const { error } = await supabase
      .from(TABLE_NAMES.STORE_TESTIMONIALS)
      .update({
        approval_status: status,
        updated_at: getCurrentISOString(),
      })
      .eq('id', testimonialId)
      .eq('store_id', storeId);

    if (error) {
      logErrorWithContext('updateTestimonialApproval', error);
      throw new Error(ERROR_MESSAGES.UPDATE_APPROVAL);
    }
  }

  /**
   * Reorder testimonials
   */
  static async reorderTestimonials(storeId: string, testimonialIds: string[]): Promise<void> {
    if (!validateStoreId(storeId)) {
      throw new Error('Invalid store ID');
    }

    const updates = createReorderUpdates(testimonialIds);

    for (const update of updates) {
      const { error } = await supabase
        .from(TABLE_NAMES.STORE_TESTIMONIALS)
        .update({
          display_order: update.display_order,
          updated_at: update.updated_at,
        })
        .eq('id', update.id)
        .eq('store_id', storeId);

      if (error) {
        logErrorWithContext('reorderTestimonials', error);
        throw new Error(ERROR_MESSAGES.REORDER_TESTIMONIALS);
      }
    }
  }
}
