/**
 * Administrative Role Detection and Processing
 * 
 * This module handles detection and processing of administrative roles
 * that are exempt from subscription validation.
 * 
 * Part of: Role Classification System Refactoring
 * Created: 2025-01-11
 */

import { supabase } from '../../../supabase';
import type { AdministrativeRole } from '../types';

/**
 * Checks if a user has any administrative roles that exempt them from subscription validation
 * 
 * @param userId - User ID to check
 * @returns Promise<boolean> - True if user has administrative exemption
 */
export async function hasAdministrativeExemption(userId: string): Promise<boolean> {
  try {
    // Check platform owner status
    const isPlatformOwner = await checkPlatformOwnerStatus(userId);
    if (isPlatformOwner) {
      return true;
    }

    // Check store administrator roles
    const { data: storeRoles, error: storeError } = await supabase
      .from('store_administrators')
      .select('role')
      .eq('user_id', userId);

    if (storeError) {
      console.warn('[Role Classification] Error checking store roles:', storeError);
      return false;
    }

    // Check if user has store owner or manager role
    const hasStoreAdminRole = storeRoles?.some(role => 
      role.role === 'owner' || role.role === 'manager'
    );

    return hasStoreAdminRole || false;

  } catch (error) {
    console.error('[Role Classification] Error checking administrative exemption:', error);
    return false; // Fail secure - no exemption if error
  }
}

/**
 * Checks if user is platform owner
 * 
 * @param userId - User ID to check
 * @returns Promise<boolean> - True if user is platform owner
 */
export async function checkPlatformOwnerStatus(userId: string): Promise<boolean> {
  try {
    const { data: platformOwner } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'platform_owner_id')
      .single();

    return platformOwner?.value === userId;
  } catch (error) {
    console.warn('[Role Classification] Could not check platform owner status:', error);
    return false;
  }
}

/**
 * Processes administrative roles for a user and returns structured data
 * 
 * @param userId - User ID to process roles for
 * @returns Promise<AdministrativeRole[]> - Array of administrative roles
 */
export async function processAdministrativeRoles(userId: string): Promise<AdministrativeRole[]> {
  const administrativeRoles: AdministrativeRole[] = [];

  try {
    // Check platform owner
    const isPlatformOwner = await checkPlatformOwnerStatus(userId);
    if (isPlatformOwner) {
      administrativeRoles.push({
        type: 'PLATFORM_OWNER',
        grantedAt: new Date().toISOString(),
        source: 'platform_settings'
      });
    }

    // Check store roles
    const { data: storeRoles } = await supabase
      .from('store_administrators')
      .select('store_id, role, assigned_at')
      .eq('user_id', userId);

    for (const storeRole of storeRoles || []) {
      if (storeRole.role === 'owner') {
        administrativeRoles.push({
          type: 'STORE_OWNER',
          storeId: storeRole.store_id,
          grantedAt: storeRole.assigned_at || new Date().toISOString(),
          source: 'store_administrators'
        });
      } else if (storeRole.role === 'manager') {
        administrativeRoles.push({
          type: 'STORE_MANAGER',
          storeId: storeRole.store_id,
          grantedAt: storeRole.assigned_at || new Date().toISOString(),
          source: 'store_administrators'
        });
      }
    }

    return administrativeRoles;

  } catch (error) {
    console.error('[Administrative Roles] Error processing administrative roles:', error);
    return []; // Return empty array on error
  }
}
