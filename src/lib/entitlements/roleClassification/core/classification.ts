/**
 * Main Role Classification Orchestrator
 * 
 * This module provides the main classification logic and orchestration
 * between optimized and legacy classification approaches.
 * 
 * Part of: Role Classification System Refactoring
 * Created: 2025-01-11
 */

import { isFeatureEnabled, SUBSCRIPTION_FEATURE_FLAGS } from '../../../feature-flags';
import { performConsolidatedRoleClassification } from '../optimization/consolidatedQuery';
import { performLegacyRoleClassification } from '../optimization/legacyQuery';
import type { RoleClassification } from '../types';

/**
 * Enhanced role classification orchestrator with consolidated query option
 * Uses feature flag to control between consolidated and legacy classification
 */
async function performOptimizedRoleClassification(userId: string): Promise<RoleClassification> {
  try {
    // Check if consolidated role classification is enabled
    const consolidatedClassificationEnabled = await isFeatureEnabled(
      SUBSCRIPTION_FEATURE_FLAGS.ROLE_BASED_ENFORCEMENT
    );

    if (consolidatedClassificationEnabled.enabled) {
      console.log(`[Optimized Role Classification] Using consolidated classification for user ${userId}`);

      try {
        return await performConsolidatedRoleClassification(userId);
      } catch (error) {
        console.warn('[Optimized Role Classification] Consolidated classification failed, falling back to legacy:', error);
        // Fall through to legacy classification
      }
    }

    // Legacy classification (existing multi-query approach)
    console.log(`[Optimized Role Classification] Using legacy classification for user ${userId}`);
    return await performLegacyRoleClassification(userId);

  } catch (error) {
    console.error('[Optimized Role Classification] Error in classification orchestration:', error);

    // Fail secure classification
    return {
      userId,
      administrativeRoles: [],
      userRoles: [],
      requiresSubscriptionValidation: false,
      exemptFromValidation: false,
      classificationReason: 'Classification error - defaulting to standard member'
    };
  }
}

/**
 * Comprehensive role classification for a user with optimization
 * Uses consolidated query when feature flag is enabled, falls back to legacy approach
 *
 * @param userId - User ID to classify
 * @returns Promise<RoleClassification> - Complete role classification
 */
export async function classifyUserRoles(userId: string): Promise<RoleClassification> {
  try {
    console.log(`[Role Classification] Starting optimized classification for user: ${userId}`);

    // Use optimized classification (consolidated or legacy based on feature flag)
    return await performOptimizedRoleClassification(userId);

  } catch (error) {
    console.error('[Role Classification] Error in classification orchestration:', error);

    // Fail secure classification
    return {
      userId,
      administrativeRoles: [],
      userRoles: [],
      requiresSubscriptionValidation: false,
      exemptFromValidation: false,
      classificationReason: 'Classification orchestration error - defaulting to standard member'
    };
  }
}
