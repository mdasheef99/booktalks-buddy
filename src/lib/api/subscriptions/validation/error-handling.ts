/**
 * Error Handling and Fail-Secure Module
 *
 * Comprehensive error handling, fail-secure defaults, and validation result creation
 * for the subscription validation system.
 *
 * Created: 2025-07-10
 * Part of: Phase 1B - validation.ts Refactoring
 */

import type {
  SubscriptionStatus,
  SubscriptionValidationResult,
  ValidationError,
  ValidationPerformanceMetrics
} from '../types';

// =========================
// Error Creation Functions
// =========================

/**
 * Creates a validation error object with consistent structure
 */
export function createValidationError(
  code: string,
  message: string,
  details: any,
  severity: 'low' | 'medium' | 'high' | 'critical'
): ValidationError {
  return {
    code,
    message,
    details,
    timestamp: new Date().toISOString(),
    severity,
  };
}

// =========================
// Fail-Secure Functions
// =========================

/**
 * Creates a fail-secure subscription status for error conditions
 */
export function createFailSecureSubscriptionStatus(
  userId: string,
  reason: string
): SubscriptionStatus {
  return {
    hasActiveSubscription: false,
    currentTier: 'MEMBER',
    subscriptionExpiry: null,
    isValid: false,
    lastValidated: new Date().toISOString(),
    validationSource: 'fallback',
    warnings: [`Fail-secure mode activated: ${reason}`],
  };
}

/**
 * Creates a fail-secure validation result for error conditions
 */
export function createFailSecureValidationResult(
  userId: string,
  errors: ValidationError[],
  startTime: number
): SubscriptionValidationResult {
  const endTime = Date.now();

  return {
    userId,
    status: createFailSecureSubscriptionStatus(userId, 'validation_error'),
    errors,
    performanceMetrics: {
      queryTime: endTime - startTime,
      cacheHit: false,
      queryCount: 0,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
    },
    success: false,
  };
}

// =========================
// Error Classification
// =========================

/**
 * Determines if an error should trigger fail-secure mode
 */
export function shouldFailSecure(error: ValidationError): boolean {
  // Critical and high severity errors should trigger fail-secure
  if (error.severity === 'critical' || error.severity === 'high') {
    return true;
  }

  // Specific error codes that should trigger fail-secure
  const failSecureCodes = [
    'VALIDATION_FAILED',
    'ACTIVE_SUBSCRIPTION_CHECK_FAILED',
    'UNEXPECTED_VALIDATION_ERROR',
    'TIMEOUT_ERROR',
  ];

  return failSecureCodes.includes(error.code);
}

/**
 * Determines if errors are recoverable
 */
export function areErrorsRecoverable(errors: ValidationError[]): boolean {
  return errors.every(error =>
    error.severity === 'low' || error.severity === 'medium'
  );
}

// =========================
// Error Aggregation
// =========================

/**
 * Aggregates multiple validation errors into a summary
 */
export function aggregateValidationErrors(errors: ValidationError[]): {
  totalErrors: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  shouldFailSecure: boolean;
  summary: string;
} {
  const criticalCount = errors.filter(e => e.severity === 'critical').length;
  const highCount = errors.filter(e => e.severity === 'high').length;
  const mediumCount = errors.filter(e => e.severity === 'medium').length;
  const lowCount = errors.filter(e => e.severity === 'low').length;

  const shouldFailSecureFlag = errors.some(shouldFailSecure);

  const summary = [
    criticalCount > 0 && `${criticalCount} critical`,
    highCount > 0 && `${highCount} high`,
    mediumCount > 0 && `${mediumCount} medium`,
    lowCount > 0 && `${lowCount} low`,
  ].filter(Boolean).join(', ') + ' severity errors';

  return {
    totalErrors: errors.length,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    shouldFailSecure: shouldFailSecureFlag,
    summary,
  };
}

// =========================
// Performance Metrics Creation
// =========================

/**
 * Creates performance metrics for validation operations
 */
export function createPerformanceMetrics(
  startTime: number,
  queryCount: number,
  cacheHit: boolean = false
): ValidationPerformanceMetrics {
  const endTime = Date.now();

  return {
    queryTime: endTime - startTime,
    cacheHit,
    queryCount,
    startTime: new Date(startTime).toISOString(),
    endTime: new Date(endTime).toISOString(),
  };
}
