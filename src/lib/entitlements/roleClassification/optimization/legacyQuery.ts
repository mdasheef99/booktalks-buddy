/**
 * Legacy Role Classification Query Implementation
 * 
 * This module provides the original multi-query approach for role classification.
 * Maintained for fallback and comparison purposes.
 * 
 * Part of: Role Classification System Refactoring
 * Created: 2025-01-11
 */

import { supabase } from '../../../supabase';
import { checkPlatformOwnerStatus } from '../core/administrativeRoles';
import type { RoleClassification, AdministrativeRole, UserRole } from '../types';

/**
 * Legacy role classification using original multi-query approach
 * Maintained for fallback and comparison
 */
export async function performLegacyRoleClassification(userId: string): Promise<RoleClassification> {
  const startTime = Date.now();

  try {
    const administrativeRoles: AdministrativeRole[] = [];
    const userRoles: UserRole[] = [];

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

    // Check club leadership
    const { data: ledClubs } = await supabase
      .from('book_clubs')
      .select('id, created_at')
      .eq('lead_user_id', userId);

    for (const club of ledClubs || []) {
      userRoles.push({
        type: 'CLUB_LEADERSHIP',
        clubId: club.id,
        grantedAt: club.created_at || new Date().toISOString(),
        requiresSubscription: true
      });
    }

    // Check club moderator roles
    const { data: moderatedClubs } = await supabase
      .from('club_moderators')
      .select('club_id, assigned_at')
      .eq('user_id', userId);

    for (const modClub of moderatedClubs || []) {
      userRoles.push({
        type: 'CLUB_MODERATOR',
        clubId: modClub.club_id,
        grantedAt: modClub.assigned_at || new Date().toISOString(),
        requiresSubscription: true
      });
    }

    // Determine classification
    const exemptFromValidation = administrativeRoles.length > 0;
    const requiresSubscriptionValidation = !exemptFromValidation && userRoles.length > 0;

    let classificationReason: string;
    if (exemptFromValidation) {
      classificationReason = `Administrative exemption: ${administrativeRoles.map(r => r.type).join(', ')}`;
    } else if (requiresSubscriptionValidation) {
      classificationReason = `User role enforcement: ${userRoles.map(r => r.type).join(', ')}`;
    } else {
      classificationReason = 'No special roles - standard member';
    }

    const classificationTime = Date.now() - startTime;
    console.log(`[Legacy Role Classification] Completed in ${classificationTime}ms with multiple queries`);

    return {
      userId,
      administrativeRoles,
      userRoles,
      requiresSubscriptionValidation,
      exemptFromValidation,
      classificationReason
    };

  } catch (error) {
    console.error('[Legacy Role Classification] Error in legacy classification:', error);

    // Fail secure classification
    return {
      userId,
      administrativeRoles: [],
      userRoles: [],
      requiresSubscriptionValidation: false,
      exemptFromValidation: false,
      classificationReason: 'Legacy classification error - defaulting to standard member'
    };
  }
}
