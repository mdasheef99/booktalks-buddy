/**
 * Role Classification Logging Utilities
 * 
 * This module provides logging and monitoring utilities for role
 * classification decisions and audit trails.
 * 
 * Part of: Role Classification System Refactoring
 * Created: 2025-01-11
 */

import type { SubscriptionValidationDecision } from '../types';

/**
 * Logs role classification decision for monitoring
 * 
 * @param userId - User ID
 * @param decision - Validation decision
 * @param context - Additional context
 */
export function logRoleClassificationDecision(
  userId: string,
  decision: SubscriptionValidationDecision,
  context: string = 'entitlement_calculation'
): void {
  console.log(`[Role Classification] Decision for user ${userId}:`, {
    shouldValidate: decision.shouldValidate,
    reason: decision.reason,
    exemptRoles: decision.exemptRoles.length,
    enforcedRoles: decision.enforcedRoles.length,
    context
  });
}
