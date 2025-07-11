/**
 * Role Classification Validation Utilities
 * 
 * This module provides validation decision making and subscription
 * validation logic for role-based entitlements.
 * 
 * Part of: Role Classification System Refactoring
 * Created: 2025-01-11
 */

import { classifyUserRoles } from '../core/classification';
import type { SubscriptionValidationDecision } from '../types';

/**
 * Makes subscription validation decision for role-based entitlements
 * 
 * @param userId - User ID to make decision for
 * @returns Promise<SubscriptionValidationDecision> - Validation decision
 */
export async function makeSubscriptionValidationDecision(
  userId: string
): Promise<SubscriptionValidationDecision> {
  try {
    const classification = await classifyUserRoles(userId);

    return {
      shouldValidate: classification.requiresSubscriptionValidation,
      reason: classification.classificationReason,
      exemptRoles: classification.administrativeRoles,
      enforcedRoles: classification.userRoles
    };

  } catch (error) {
    console.error('[Role Classification] Error making validation decision:', error);
    
    // Fail secure - require validation if error
    return {
      shouldValidate: true,
      reason: 'Error in classification - defaulting to validation required',
      exemptRoles: [],
      enforcedRoles: []
    };
  }
}
