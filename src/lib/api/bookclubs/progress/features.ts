/**
 * Reading Progress Management - Feature Toggle Functions
 * 
 * This module contains functions for managing progress tracking
 * feature toggles and club-level settings.
 */

import { supabase } from '../../../supabase';
import { getUserEntitlements } from '@/lib/entitlements/cache';
import { canManageClub } from '@/lib/entitlements/permissions';
import { validateClubId, validateUserId } from './validation';
import type { FeatureToggleResponse } from './types';

// =========================
// Feature Toggle Functions
// =========================

/**
 * Toggle progress tracking for a club (club leads only)
 * 
 * @param userId - ID of user making the request
 * @param clubId - Club ID
 * @param enabled - Whether to enable or disable progress tracking
 * @returns Success response
 * @throws Error if user lacks permission or operation fails
 */
export async function toggleClubProgressTracking(
  userId: string,
  clubId: string,
  enabled: boolean
): Promise<FeatureToggleResponse> {
  try {
    // Validate inputs
    validateUserId(userId);
    validateClubId(clubId);

    // Get user entitlements and check club management permission
    const entitlements = await getUserEntitlements(userId);

    // Get club's store ID for contextual permission checking
    const { data: club } = await supabase
      .from('book_clubs')
      .select('store_id')
      .eq('id', clubId)
      .single();

    const canManage = club ? canManageClub(entitlements, clubId, club.store_id) : false;

    if (!canManage) {
      console.log('🚨 Toggle progress tracking permission check failed for user:', userId);
      console.log('📍 Club ID:', clubId);
      console.log('🔑 User entitlements:', entitlements);
      throw new Error('Unauthorized: Only club leads can toggle progress tracking');
    }

    // Update the club's progress tracking setting
    const { error } = await supabase
      .from('book_clubs')
      .update({ progress_tracking_enabled: enabled })
      .eq('id', clubId);

    if (error) {
      console.error('Error toggling progress tracking:', error);
      throw new Error(`Failed to ${enabled ? 'enable' : 'disable'} progress tracking: ${error.message}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error in toggleClubProgressTracking:', error);
    throw error;
  }
}

/**
 * Check if progress tracking is enabled for a club
 * 
 * @param clubId - Club ID
 * @returns True if progress tracking is enabled
 */
export async function isProgressTrackingEnabled(clubId: string): Promise<boolean> {
  try {
    validateClubId(clubId);

    const { data, error } = await supabase
      .from('book_clubs')
      .select('progress_tracking_enabled')
      .eq('id', clubId)
      .single();

    if (error) {
      console.error('Error checking progress tracking status:', error);
      return false;
    }

    return data?.progress_tracking_enabled || false;
  } catch (error) {
    console.error('Error in isProgressTrackingEnabled:', error);
    return false;
  }
}

/**
 * Get progress tracking settings for multiple clubs
 * 
 * @param clubIds - Array of club IDs
 * @returns Map of club ID to enabled status
 */
export async function getProgressTrackingSettings(
  clubIds: string[]
): Promise<Map<string, boolean>> {
  try {
    if (clubIds.length === 0) {
      return new Map();
    }

    const { data, error } = await supabase
      .from('book_clubs')
      .select('id, progress_tracking_enabled')
      .in('id', clubIds);

    if (error) {
      console.error('Error fetching progress tracking settings:', error);
      return new Map();
    }

    const settingsMap = new Map<string, boolean>();
    data?.forEach(club => {
      settingsMap.set(club.id, club.progress_tracking_enabled || false);
    });

    return settingsMap;
  } catch (error) {
    console.error('Error in getProgressTrackingSettings:', error);
    return new Map();
  }
}

/**
 * Enable progress tracking for a club with validation
 * 
 * @param userId - ID of user making the request
 * @param clubId - Club ID
 * @returns Success response
 */
export async function enableProgressTracking(
  userId: string,
  clubId: string
): Promise<FeatureToggleResponse> {
  return await toggleClubProgressTracking(userId, clubId, true);
}

/**
 * Disable progress tracking for a club with validation
 * 
 * @param userId - ID of user making the request
 * @param clubId - Club ID
 * @returns Success response
 */
export async function disableProgressTracking(
  userId: string,
  clubId: string
): Promise<FeatureToggleResponse> {
  return await toggleClubProgressTracking(userId, clubId, false);
}

/**
 * Check if user can manage progress tracking for a club
 * 
 * @param userId - User ID
 * @param clubId - Club ID
 * @returns True if user can manage progress tracking
 */
export async function canManageProgressTracking(
  userId: string,
  clubId: string
): Promise<boolean> {
  try {
    validateUserId(userId);
    validateClubId(clubId);

    // Get user entitlements and check club management permission
    const entitlements = await getUserEntitlements(userId);

    // Get club's store ID for contextual permission checking
    const { data: club } = await supabase
      .from('book_clubs')
      .select('store_id')
      .eq('id', clubId)
      .single();

    return club ? canManageClub(entitlements, clubId, club.store_id) : false;
  } catch (error) {
    console.error('Error in canManageProgressTracking:', error);
    return false;
  }
}
