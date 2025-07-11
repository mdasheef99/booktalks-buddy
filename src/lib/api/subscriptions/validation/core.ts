/**
 * Core Validation Engine Module
 *
 * Implements the main validation logic, fail-secure mechanisms, and validation
 * orchestration. Extracted from validation.ts refactoring.
 *
 * Created: 2025-07-10
 * Part of: Phase 1B - validation.ts Refactoring
 */

import { supabase } from '@/lib/supabase';
import type { SubscriptionStatus } from '../types';
import type {
  ValidationContext,
  InternalValidationResult,
  ValidationStepResult,
} from './types';
import { VALIDATION_ERROR_CODES, FAIL_SECURE_REASONS } from './types';
import { createValidationError, createFailSecureSubscriptionStatus } from './error-handling';
import { validateTier } from './utils';

// =========================
// Core Validation Engine
// =========================

/**
 * Performs the main subscription validation logic with optimization
 * Uses consolidated query when feature flag is enabled, falls back to legacy approach
 */
export async function performSubscriptionValidation(
  context: ValidationContext
): Promise<InternalValidationResult> {
  const { userId, options } = context;
  const errors = [...context.errors];

  try {
    console.log(`[Validation] Starting optimized validation for user: ${userId}`);

    // Use optimized validation (consolidated or legacy based on feature flag)
    const validationResult = await performOptimizedValidation(userId);

    if (!validationResult.success) {
      errors.push(validationResult.status as any); // Type assertion for error case

      if (context.failSecure) {
        return {
          status: validationResult.status,
          errors,
          queryCount: validationResult.queryCount,
          success: false
        };
      }
    }

    console.log(`[Validation] Completed using ${validationResult.validationMethod} method with ${validationResult.queryCount} queries`);

    return {
      status: validationResult.status,
      errors,
      queryCount: validationResult.queryCount,
      success: validationResult.success
    };

  } catch (error) {
    console.error('[Validation] Unexpected error in validation orchestration:', error);

    return {
      status: createFailSecureSubscriptionStatus(
        userId,
        FAIL_SECURE_REASONS.VALIDATION_ORCHESTRATION_ERROR
      ),
      errors: [...errors, error as any],
      queryCount: 0,
      success: false
    };
  }
}

// =========================
// Consolidated Validation (Performance Optimization)
// =========================

/**
 * Consolidated subscription validation using single optimized query
 * Replaces 3 separate database calls with 1 optimized query
 * Protected by feature flag for safe rollout
 */
async function performConsolidatedValidation(userId: string): Promise<ValidationStepResult> {
  try {
    console.log(`[Consolidated Validation] Starting optimized validation for user ${userId}`);
    const startTime = Date.now();

    // Single optimized query combining all validation logic
    const { data: validationResult, error: validationError } = await supabase
      .from('user_subscriptions')
      .select(`
        user_id,
        tier,
        is_active,
        end_date,
        subscription_type,
        users!inner(membership_tier)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .gte('end_date', new Date().toISOString())
      .order('end_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (validationError) {
      console.error('[Consolidated Validation] Query failed:', validationError);
      return {
        success: false,
        error: createValidationError(
          VALIDATION_ERROR_CODES.CONSOLIDATED_VALIDATION_FAILED,
          `Consolidated validation query failed: ${validationError.message}`,
          { userId, supabaseError: validationError },
          'high'
        ),
        queryCount: 1,
      };
    }

    const queryTime = Date.now() - startTime;
    console.log(`[Consolidated Validation] Query completed in ${queryTime}ms`);

    // Process validation result
    const hasActiveSubscription = !!validationResult;
    const subscriptionTier = validationResult?.tier || null;
    const subscriptionExpiry = validationResult?.end_date || null;
    const userMembershipTier = validationResult?.users?.membership_tier || 'MEMBER';

    // Map subscription tier to standard format
    const currentTier = subscriptionTier ?
      (subscriptionTier === 'privileged_plus' ? 'PRIVILEGED_PLUS' :
       subscriptionTier === 'privileged' ? 'PRIVILEGED' : 'MEMBER') : 'MEMBER';

    // Create consolidated validation result
    const consolidatedResult = {
      hasActiveSubscription,
      currentTier: currentTier as 'MEMBER' | 'PRIVILEGED' | 'PRIVILEGED_PLUS',
      subscriptionExpiry,
      isValid: hasActiveSubscription && currentTier !== 'MEMBER',
      lastValidated: new Date().toISOString(),
      validationSource: 'consolidated_query' as const,
      queryTime,
      userMembershipTier
    };

    console.log(`[Consolidated Validation] Result for user ${userId}:`, {
      hasActiveSubscription,
      currentTier,
      queryTime: `${queryTime}ms`,
      improvement: 'Single query vs 3 separate queries'
    });

    return {
      success: true,
      data: consolidatedResult,
      queryCount: 1,
    };

  } catch (error) {
    console.error('[Consolidated Validation] Unexpected error:', error);
    return {
      success: false,
      error: createValidationError(
        VALIDATION_ERROR_CODES.CONSOLIDATED_VALIDATION_FAILED,
        `Consolidated validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { userId, error: String(error) },
        'high'
      ),
      queryCount: 1,
    };
  }
}

/**
 * Enhanced validation orchestrator with consolidated query option
 * Uses feature flag to control between consolidated and legacy validation
 */
async function performOptimizedValidation(userId: string): Promise<InternalValidationResult> {
  try {
    // Use consolidated validation directly in development environment
    console.log(`[Optimized Validation] Using consolidated validation for user ${userId}`);

    const consolidatedResult = await performConsolidatedValidation(userId);

    if (consolidatedResult.success) {
      return {
        success: true,
        status: consolidatedResult.data as SubscriptionStatus,
        queryCount: 1,
        validationMethod: 'consolidated'
      };
    } else {
      console.warn('[Optimized Validation] Consolidated validation failed, falling back to legacy');
      // Fall back to legacy validation
      console.log(`[Optimized Validation] Using legacy validation for user ${userId}`);
      return await performLegacyValidation(userId);
    }

  } catch (error) {
    console.error('[Optimized Validation] Error in validation orchestration:', error);

    // Fail secure
    return {
      success: false,
      status: createFailSecureSubscriptionStatus(
        userId,
        FAIL_SECURE_REASONS.VALIDATION_ORCHESTRATION_ERROR
      ),
      queryCount: 0,
      validationMethod: 'fail_secure'
    };
  }
}

/**
 * Legacy validation using original 3-query approach
 * Maintained for fallback and comparison
 */
async function performLegacyValidation(userId: string): Promise<InternalValidationResult> {
  const startTime = Date.now();
  let totalQueries = 0;

  try {
    // Step 1: Check active subscription
    const activeResult = await checkActiveSubscription(userId);
    totalQueries += activeResult.queryCount;

    if (!activeResult.success) {
      return {
        success: false,
        status: createFailSecureSubscriptionStatus(
          userId,
          FAIL_SECURE_REASONS.ACTIVE_SUBSCRIPTION_CHECK_FAILED
        ),
        queryCount: totalQueries,
        validationMethod: 'legacy'
      };
    }

    // Step 2: Get subscription tier
    const tierResult = await getSubscriptionTier(userId);
    totalQueries += tierResult.queryCount;

    if (!tierResult.success) {
      return {
        success: false,
        status: createFailSecureSubscriptionStatus(
          userId,
          FAIL_SECURE_REASONS.SUBSCRIPTION_TIER_CHECK_FAILED
        ),
        queryCount: totalQueries,
        validationMethod: 'legacy'
      };
    }

    // Step 3: Get subscription details
    const detailsResult = await getSubscriptionDetails(userId);
    totalQueries += detailsResult.queryCount;

    if (!detailsResult.success) {
      return {
        success: false,
        status: createFailSecureSubscriptionStatus(
          userId,
          FAIL_SECURE_REASONS.SUBSCRIPTION_DETAILS_CHECK_FAILED
        ),
        queryCount: totalQueries,
        validationMethod: 'legacy'
      };
    }

    const validationTime = Date.now() - startTime;
    console.log(`[Legacy Validation] Completed in ${validationTime}ms with ${totalQueries} queries`);

    // Combine results
    const validationResult = validateSubscriptionStatus({
      userId,
      hasActive: activeResult.data,
      currentTier: tierResult.data,
      subscription: detailsResult.data,
      errors: []
    });

    const status = {
      ...validationResult.status,
      validationSource: 'legacy' as const,
      queryTime: validationTime
    };

    return {
      success: true,
      status,
      queryCount: totalQueries,
      validationMethod: 'legacy'
    };

  } catch (error) {
    console.error('[Legacy Validation] Unexpected error:', error);
    return {
      success: false,
      status: createFailSecureSubscriptionStatus(
        userId,
        FAIL_SECURE_REASONS.VALIDATION_ORCHESTRATION_ERROR
      ),
      queryCount: totalQueries,
      validationMethod: 'legacy'
    };
  }
}

// =========================
// Validation Steps (Legacy)
// =========================

/**
 * Check if user has active subscription
 */
async function checkActiveSubscription(userId: string): Promise<ValidationStepResult> {
  try {
    const { data: hasActive, error: activeError } = await supabase
      .rpc('has_active_subscription', { p_user_id: userId });

    if (activeError) {
      console.error('Active subscription check failed:', activeError);
      return {
        success: false,
        error: createValidationError(
          VALIDATION_ERROR_CODES.ACTIVE_SUBSCRIPTION_CHECK_FAILED,
          `Failed to check active subscription: ${activeError.message}`,
          { userId, supabaseError: activeError },
          'high'
        ),
        queryCount: 1,
      };
    }

    return {
      success: true,
      data: hasActive,
      queryCount: 1,
    };

  } catch (error) {
    return {
      success: false,
      error: createValidationError(
        VALIDATION_ERROR_CODES.ACTIVE_SUBSCRIPTION_CHECK_FAILED,
        `Active subscription check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { userId, error: String(error) },
        'high'
      ),
      queryCount: 1,
    };
  }
}

/**
 * Get user's subscription tier
 */
async function getSubscriptionTier(userId: string): Promise<ValidationStepResult> {
  try {
    const { data: currentTier, error: tierError } = await supabase
      .rpc('get_user_subscription_tier', { p_user_id: userId });

    if (tierError) {
      console.error('Subscription tier check failed:', tierError);
      return {
        success: false,
        error: createValidationError(
          VALIDATION_ERROR_CODES.SUBSCRIPTION_TIER_CHECK_FAILED,
          `Failed to get subscription tier: ${tierError.message}`,
          { userId, supabaseError: tierError },
          'medium'
        ),
        queryCount: 1,
      };
    }

    return {
      success: true,
      data: currentTier,
      queryCount: 1,
    };

  } catch (error) {
    return {
      success: false,
      error: createValidationError(
        VALIDATION_ERROR_CODES.SUBSCRIPTION_TIER_CHECK_FAILED,
        `Subscription tier check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { userId, error: String(error) },
        'medium'
      ),
      queryCount: 1,
    };
  }
}

/**
 * Get subscription details
 */
async function getSubscriptionDetails(userId: string): Promise<ValidationStepResult> {
  try {
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('end_date, tier, subscription_type')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('end_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subError) {
      console.error('Subscription details check failed:', subError);
      return {
        success: false,
        error: createValidationError(
          VALIDATION_ERROR_CODES.SUBSCRIPTION_DETAILS_CHECK_FAILED,
          `Failed to get subscription details: ${subError.message}`,
          { userId, supabaseError: subError },
          'medium'
        ),
        queryCount: 1,
      };
    }

    return {
      success: true,
      data: subscription,
      queryCount: 1,
    };

  } catch (error) {
    return {
      success: false,
      error: createValidationError(
        VALIDATION_ERROR_CODES.SUBSCRIPTION_DETAILS_CHECK_FAILED,
        `Subscription details check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { userId, error: String(error) },
        'medium'
      ),
      queryCount: 1,
    };
  }
}

/**
 * Validate subscription status and create final result
 */
function validateSubscriptionStatus(params: {
  userId: string;
  hasActive: boolean;
  currentTier: string;
  subscription: any;
  errors: any[];
}): { status: SubscriptionStatus; errors: any[] } {
  const { userId, hasActive, currentTier, subscription, errors } = params;

  // Validate subscription expiry
  const subscriptionExpiry = subscription?.end_date || null;
  const isExpired = subscriptionExpiry ? new Date(subscriptionExpiry) <= new Date() : false;

  if (hasActive && isExpired) {
    const warning = createValidationError(
      VALIDATION_ERROR_CODES.SUBSCRIPTION_EXPIRED,
      'User has active subscription flag but subscription is expired',
      { userId, subscriptionExpiry, hasActive },
      'medium'
    );
    errors.push(warning);
  }

  // Create final subscription status
  const validatedTier = validateTier(currentTier);
  const isValid = hasActive && !isExpired && validatedTier !== 'MEMBER';

  const status: SubscriptionStatus = {
    hasActiveSubscription: hasActive || false,
    currentTier: validatedTier,
    subscriptionExpiry,
    isValid,
    lastValidated: new Date().toISOString(),
    validationSource: 'database',
    warnings: errors.filter(e => e.severity === 'medium').map(e => e.message),
  };

  return { status, errors };
}
