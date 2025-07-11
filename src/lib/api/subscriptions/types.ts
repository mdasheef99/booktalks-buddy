/**
 * Subscription System Type Definitions
 * 
 * Comprehensive type definitions for the BookTalks Buddy subscription validation system.
 * These types ensure type safety and provide clear interfaces for subscription-related operations.
 * 
 * Created: 2025-01-07
 * Part of: Phase 1 - Foundation & API Layer
 */

// =========================
// Core Subscription Types
// =========================

/**
 * Represents the current subscription status of a user
 */
export interface SubscriptionStatus {
  /** Whether the user has an active, non-expired subscription */
  hasActiveSubscription: boolean;
  
  /** Current membership tier based on subscription validation */
  currentTier: 'MEMBER' | 'PRIVILEGED' | 'PRIVILEGED_PLUS';
  
  /** ISO string of when the subscription expires, null if no active subscription */
  subscriptionExpiry: string | null;
  
  /** Whether the subscription status is valid (active and not expired) */
  isValid: boolean;
  
  /** ISO string of when this status was last validated */
  lastValidated: string;
  
  /** Source of the validation data */
  validationSource: 'database' | 'cache' | 'fallback';
  
  /** Optional warning messages about subscription status */
  warnings?: string[];
}

/**
 * Detailed subscription information including payment and store data
 */
export interface SubscriptionDetails {
  /** Unique subscription identifier */
  id: string;
  
  /** User ID this subscription belongs to */
  userId: string;
  
  /** Subscription tier level */
  tier: 'MEMBER' | 'PRIVILEGED' | 'PRIVILEGED_PLUS';
  
  /** Type of subscription billing */
  subscriptionType: 'monthly' | 'yearly' | 'lifetime';
  
  /** ISO string of subscription start date */
  startDate: string;
  
  /** ISO string of subscription end date */
  endDate: string;
  
  /** Whether the subscription is currently active */
  isActive: boolean;
  
  /** Store ID where the subscription was purchased */
  storeId: string;
  
  /** Amount paid for the subscription */
  amount: number;
  
  /** Currency code for the payment */
  currency: string;
  
  /** Optional payment reference or transaction ID */
  paymentReference: string | null;
  
  /** Optional notes about the subscription */
  notes: string | null;
  
  /** ISO string of when the subscription was created */
  createdAt: string;
  
  /** ISO string of when the subscription was last updated */
  updatedAt: string;
}

// =========================
// Validation Result Types
// =========================

/**
 * Result of subscription validation operation
 */
export interface SubscriptionValidationResult {
  /** User ID that was validated */
  userId: string;
  
  /** Current subscription status */
  status: SubscriptionStatus;
  
  /** Any errors encountered during validation */
  errors: ValidationError[];
  
  /** Performance metrics for the validation operation */
  performanceMetrics: ValidationPerformanceMetrics;
  
  /** Whether validation was successful */
  success: boolean;
}

/**
 * Result of entitlement validation and correction operation
 */
export interface EntitlementValidationResult {
  /** User ID that was validated */
  userId: string;
  
  /** Current membership tier in database */
  currentTier: string;
  
  /** Tier based on active subscription */
  subscriptionTier: string;
  
  /** Whether user has active subscription */
  hasActiveSubscription: boolean;
  
  /** Whether the user's tier needs updating */
  needsUpdate: boolean;
  
  /** The tier the user should be updated to */
  updatedTier: string | null;
  
  /** List of issues found during validation */
  issues: string[];
  
  /** Whether the validation was successful */
  success: boolean;
}

// =========================
// Error and Performance Types
// =========================

/**
 * Validation error information
 */
export interface ValidationError {
  /** Error code for programmatic handling */
  code: string;
  
  /** Human-readable error message */
  message: string;
  
  /** Additional error details */
  details?: any;
  
  /** Timestamp when error occurred */
  timestamp: string;
  
  /** Severity level of the error */
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Performance metrics for validation operations
 */
export interface ValidationPerformanceMetrics {
  /** Total time taken for validation in milliseconds */
  queryTime: number;
  
  /** Whether the result came from cache */
  cacheHit: boolean;
  
  /** Number of database queries executed */
  queryCount: number;
  
  /** Timestamp when validation started */
  startTime: string;
  
  /** Timestamp when validation completed */
  endTime: string;
}

// =========================
// Configuration Types
// =========================

/**
 * Options for subscription validation operations
 */
export interface ValidationOptions {
  /** Whether to use cached results if available */
  useCache?: boolean;
  
  /** Timeout in milliseconds for validation operations */
  timeout?: number;
  
  /** Whether to force refresh of cached data */
  forceRefresh?: boolean;
  
  /** Whether to include detailed performance metrics */
  includeMetrics?: boolean;
  
  /** Whether to validate in fail-secure mode (deny on errors) */
  failSecure?: boolean;
}

/**
 * Cache configuration for subscription data
 */
export interface CacheConfig {
  /** Cache TTL in seconds */
  ttl: number;
  
  /** Maximum number of entries in cache */
  maxEntries: number;
  
  /** Whether to enable cache compression */
  compression: boolean;
  
  /** Cache key prefix */
  keyPrefix: string;
}

// =========================
// Feature Flag Types
// =========================

/**
 * Feature flag configuration for subscription system
 */
export interface SubscriptionFeatureFlags {
  /** Whether subscription validation is enabled */
  validationEnabled: boolean;
  
  /** Percentage of users to apply validation to (0-100) */
  rolloutPercentage: number;
  
  /** Whether to enable performance monitoring */
  performanceMonitoring: boolean;
  
  /** Whether to enable detailed error logging */
  detailedLogging: boolean;
  
  /** Whether to enable cache warming */
  cacheWarming: boolean;
}

// =========================
// Utility Types
// =========================

/**
 * Subscription tier hierarchy for comparison operations
 */
export type SubscriptionTierHierarchy = {
  MEMBER: 1;
  PRIVILEGED: 2;
  PRIVILEGED_PLUS: 3;
};

/**
 * Valid subscription states
 */
export type SubscriptionState = 'active' | 'expired' | 'cancelled' | 'pending' | 'suspended';

/**
 * Validation result status
 */
export type ValidationStatus = 'success' | 'error' | 'timeout' | 'cache_miss' | 'fallback';

/**
 * Cache operation results
 */
export type CacheOperationResult = 'hit' | 'miss' | 'error' | 'expired' | 'invalid';

// =========================
// Constants
// =========================

/**
 * Default validation options
 */
export const DEFAULT_VALIDATION_OPTIONS: ValidationOptions = {
  useCache: true,
  timeout: 5000,
  forceRefresh: false,
  includeMetrics: true,
  failSecure: true,
};

/**
 * Default cache configuration
 */
export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  ttl: 300, // 5 minutes
  maxEntries: 10000,
  compression: true,
  keyPrefix: 'subscription:',
};

/**
 * Subscription tier hierarchy for comparisons
 */
export const TIER_HIERARCHY: SubscriptionTierHierarchy = {
  MEMBER: 1,
  PRIVILEGED: 2,
  PRIVILEGED_PLUS: 3,
};

/**
 * Maximum allowed validation timeout in milliseconds
 */
export const MAX_VALIDATION_TIMEOUT = 10000;

/**
 * Minimum cache TTL in seconds
 */
export const MIN_CACHE_TTL = 60;
