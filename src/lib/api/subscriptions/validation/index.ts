/**
 * Validation Module Index - Comprehensive Re-exports
 *
 * Maintains 100% backward compatibility by re-exporting all public APIs
 * from the modular validation implementation. This ensures existing imports
 * continue to work without any changes.
 *
 * Created: 2025-07-10
 * Part of: Phase 1B - validation.ts Refactoring
 */

import { supabase } from '@/lib/supabase';
import type {
  SubscriptionValidationResult,
  EntitlementValidationResult,
  ValidationOptions,
  ValidationError,
  ValidationPerformanceMetrics
} from '../types';
import type { ValidationContext } from './types';
import { MAX_VALIDATION_TIMEOUT, DEFAULT_VALIDATION_OPTIONS } from './types';
import { performSubscriptionValidation } from './core';
import { batchValidateSubscriptions } from './batch';
import { hasActiveSubscription, getUserSubscriptionTier } from './utils';
import { createValidationError, createFailSecureValidationResult, createPerformanceMetrics } from './error-handling';

// =========================
// Main Validation Functions
// =========================

/**
 * Validates a user's subscription status with comprehensive error handling
 */
export async function validateUserSubscription(
  userId: string,
  options: ValidationOptions = {}
): Promise<SubscriptionValidationResult> {
  const startTime = Date.now();
  const validationOptions = { ...DEFAULT_VALIDATION_OPTIONS, ...options };

  // Validate timeout
  const timeoutMs = Math.min(
    validationOptions.timeout || DEFAULT_VALIDATION_OPTIONS.timeout!,
    MAX_VALIDATION_TIMEOUT
  );

  try {
    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Validation timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    // Create validation context
    const context: ValidationContext = {
      userId,
      startTime,
      options: validationOptions,
      errors: [],
      queryCount: 0,
      failSecure: validationOptions.failSecure || true,
    };

    // Create validation promise
    const validationPromise = performSubscriptionValidation(context);

    // Race between validation and timeout
    const result = await Promise.race([validationPromise, timeoutPromise]);

    const performanceMetrics = createPerformanceMetrics(
      startTime,
      result.queryCount,
      result.status.validationSource === 'cache'
    );

    return {
      userId,
      status: result.status,
      errors: result.errors,
      performanceMetrics,
      success: result.errors.length === 0,
    };

  } catch (error) {
    console.error('Subscription validation failed:', error);

    const validationError = createValidationError(
      'VALIDATION_FAILED',
      error instanceof Error ? error.message : 'Unknown validation error',
      { userId, error: String(error) },
      'critical'
    );

    return createFailSecureValidationResult(userId, [validationError], startTime);
  }
}

/**
 * Validates and corrects user entitlements using the backend function
 */
export async function validateUserEntitlements(
  userId: string
): Promise<EntitlementValidationResult> {
  try {
    console.log(`[Entitlements] Validating entitlements for user: ${userId}`);

    const { data, error } = await supabase
      .rpc('validate_user_entitlements', { p_user_id: userId });

    if (error) {
      console.error('Entitlement validation error:', error);
      throw new Error(`Entitlement validation failed: ${error.message}`);
    }

    const result: EntitlementValidationResult = {
      userId: data.user_id,
      currentTier: data.current_membership_tier,
      subscriptionTier: data.subscription_tier,
      hasActiveSubscription: data.has_active_subscription,
      needsUpdate: data.needs_update,
      updatedTier: data.updated_tier,
      issues: data.issues || [],
      success: true,
    };

    console.log(`[Entitlements] Validation completed for user ${userId}:`, {
      needsUpdate: result.needsUpdate,
      currentTier: result.currentTier,
      subscriptionTier: result.subscriptionTier,
      issueCount: result.issues.length,
    });

    return result;

  } catch (error) {
    console.error('Error validating entitlements:', error);

    // Return fail-secure result
    return {
      userId,
      currentTier: 'MEMBER',
      subscriptionTier: 'MEMBER',
      hasActiveSubscription: false,
      needsUpdate: false,
      updatedTier: null,
      issues: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      success: false,
    };
  }
}

// =========================
// Re-export Utility Functions
// =========================

export { batchValidateSubscriptions } from './batch';
export { hasActiveSubscription, getUserSubscriptionTier } from './utils';
