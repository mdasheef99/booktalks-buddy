/**
 * Validation-Specific Type Definitions
 *
 * Type definitions specifically for the subscription validation system.
 * Extracted from the main types.ts file as part of validation.ts refactoring.
 *
 * Created: 2025-07-10
 * Part of: Phase 1B - validation.ts Refactoring
 */

import type {
  SubscriptionStatus,
  ValidationError,
  ValidationPerformanceMetrics,
  ValidationOptions,
  DEFAULT_VALIDATION_OPTIONS,
  MAX_VALIDATION_TIMEOUT
} from '../types';

// Re-export commonly used types for convenience
export type {
  SubscriptionStatus,
  ValidationError,
  ValidationPerformanceMetrics,
  ValidationOptions
} from '../types';

// Import and re-export validation constants
export { DEFAULT_VALIDATION_OPTIONS, MAX_VALIDATION_TIMEOUT } from '../types';

// =========================
// Validation-Specific Types
// =========================

/**
 * Internal validation context for tracking validation state
 */
export interface ValidationContext {
  /** User ID being validated */
  userId: string;

  /** Validation start time */
  startTime: number;

  /** Current validation options */
  options: ValidationOptions;

  /** Accumulated errors during validation */
  errors: ValidationError[];

  /** Number of database queries performed */
  queryCount: number;

  /** Whether validation should fail secure */
  failSecure: boolean;
}

/**
 * Result of internal validation operations
 */
export interface InternalValidationResult {
  /** Validated subscription status */
  status: SubscriptionStatus;

  /** Validation errors encountered */
  errors: ValidationError[];

  /** Number of database queries performed */
  queryCount: number;
}

/**
 * Batch validation configuration
 */
export interface BatchValidationConfig {
  /** Number of users to process in each batch */
  batchSize: number;

  /** Delay between batches in milliseconds */
  batchDelay: number;

  /** Maximum concurrent validations */
  maxConcurrency: number;

  /** Whether to continue on individual failures */
  continueOnError: boolean;
}

/**
 * Validation step result for internal processing
 */
export interface ValidationStepResult {
  /** Whether the step was successful */
  success: boolean;

  /** Data returned from the step */
  data?: any;

  /** Error if step failed */
  error?: ValidationError;

  /** Number of queries performed in this step */
  queryCount: number;
}

// =========================
// Validation Constants
// =========================

/**
 * Default batch validation configuration
 */
export const DEFAULT_BATCH_CONFIG: BatchValidationConfig = {
  batchSize: 10,
  batchDelay: 100,
  maxConcurrency: 5,
  continueOnError: true,
};

/**
 * Validation error severity levels
 */
export const VALIDATION_SEVERITY_LEVELS = ['low', 'medium', 'high', 'critical'] as const;

/**
 * Validation error codes
 */
export const VALIDATION_ERROR_CODES = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  ACTIVE_SUBSCRIPTION_CHECK_FAILED: 'ACTIVE_SUBSCRIPTION_CHECK_FAILED',
  SUBSCRIPTION_TIER_CHECK_FAILED: 'SUBSCRIPTION_TIER_CHECK_FAILED',
  SUBSCRIPTION_DETAILS_CHECK_FAILED: 'SUBSCRIPTION_DETAILS_CHECK_FAILED',
  SUBSCRIPTION_EXPIRED: 'SUBSCRIPTION_EXPIRED',
  CONSOLIDATED_VALIDATION_FAILED: 'CONSOLIDATED_VALIDATION_FAILED',
  UNEXPECTED_VALIDATION_ERROR: 'UNEXPECTED_VALIDATION_ERROR',
  BATCH_VALIDATION_FAILED: 'BATCH_VALIDATION_FAILED',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
} as const;

/**
 * Fail-secure reasons for tracking why validation failed secure
 */
export const FAIL_SECURE_REASONS = {
  DATABASE_ERROR: 'database_error',
  SYSTEM_ERROR: 'system_error',
  VALIDATION_ERROR: 'validation_error',
  TIMEOUT_ERROR: 'timeout_error',
  UNKNOWN_ERROR: 'unknown_error',
  VALIDATION_ORCHESTRATION_ERROR: 'validation_orchestration_error',
  ACTIVE_SUBSCRIPTION_CHECK_FAILED: 'active_subscription_check_failed',
  SUBSCRIPTION_TIER_CHECK_FAILED: 'subscription_tier_check_failed',
  SUBSCRIPTION_DETAILS_CHECK_FAILED: 'subscription_details_check_failed',
} as const;
