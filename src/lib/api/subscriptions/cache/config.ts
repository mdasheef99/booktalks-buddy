/**
 * Cache Configuration Module
 *
 * Handles cache configuration, default settings, environment-specific configs,
 * and validation. Extracted from cache.ts refactoring.
 *
 * Created: 2025-07-10
 * Part of: Phase 1A - cache.ts Refactoring
 */

import type { CacheConfig } from './types';
import { DEFAULT_CACHE_CONFIG, MIN_CACHE_TTL } from './types';

// =========================
// Environment-Specific Configurations
// =========================

/**
 * Development environment cache configuration
 */
export const DEVELOPMENT_CACHE_CONFIG: CacheConfig = {
  ttl: 60, // 1 minute for faster development iteration
  maxEntries: 1000,
  compression: false, // Disable compression for easier debugging
  keyPrefix: 'dev_subscription:',
};

/**
 * Production environment cache configuration
 */
export const PRODUCTION_CACHE_CONFIG: CacheConfig = {
  ttl: 600, // 10 minutes for production stability
  maxEntries: 50000,
  compression: true,
  keyPrefix: 'prod_subscription:',
};

/**
 * Testing environment cache configuration
 */
export const TESTING_CACHE_CONFIG: CacheConfig = {
  ttl: 30, // 30 seconds for fast test execution
  maxEntries: 100,
  compression: false,
  keyPrefix: 'test_subscription:',
};

// =========================
// Configuration Validation
// =========================

/**
 * Validate cache configuration
 */
export function validateCacheConfig(config: Partial<CacheConfig>): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate TTL
  if (config.ttl !== undefined) {
    if (config.ttl < MIN_CACHE_TTL) {
      errors.push(`TTL must be at least ${MIN_CACHE_TTL} seconds`);
    }
    if (config.ttl > 3600) {
      warnings.push('TTL over 1 hour may cause stale data issues');
    }
  }

  // Validate max entries
  if (config.maxEntries !== undefined) {
    if (config.maxEntries < 10) {
      errors.push('Max entries must be at least 10');
    }
    if (config.maxEntries > 100000) {
      warnings.push('Max entries over 100,000 may cause memory issues');
    }
  }

  // Validate key prefix
  if (config.keyPrefix !== undefined) {
    if (config.keyPrefix.length === 0) {
      errors.push('Key prefix cannot be empty');
    }
    if (config.keyPrefix.length > 50) {
      warnings.push('Long key prefix may impact performance');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get environment-specific cache configuration
 */
export function getEnvironmentCacheConfig(): CacheConfig {
  const env = process.env.NODE_ENV || 'development';

  switch (env) {
    case 'production':
      return PRODUCTION_CACHE_CONFIG;
    case 'test':
      return TESTING_CACHE_CONFIG;
    case 'development':
    default:
      return DEVELOPMENT_CACHE_CONFIG;
  }
}

/**
 * Merge cache configurations with validation
 */
export function mergeCacheConfig(
  base: CacheConfig,
  override: Partial<CacheConfig>
): { config: CacheConfig; validation: ReturnType<typeof validateCacheConfig> } {
  const validation = validateCacheConfig(override);

  if (!validation.isValid) {
    console.warn('[Cache Config] Invalid configuration provided:', validation.errors);
    return { config: base, validation };
  }

  const merged = { ...base, ...override };

  if (validation.warnings.length > 0) {
    console.warn('[Cache Config] Configuration warnings:', validation.warnings);
  }

  return { config: merged, validation };
}

/**
 * Create optimized cache configuration based on usage patterns
 */
export function createOptimizedCacheConfig(options: {
  expectedUsers?: number;
  averageSessionDuration?: number; // in minutes
  memoryConstraints?: 'low' | 'medium' | 'high';
}): CacheConfig {
  const { expectedUsers = 1000, averageSessionDuration = 30, memoryConstraints = 'medium' } = options;

  let config = { ...DEFAULT_CACHE_CONFIG };

  // Adjust max entries based on expected users
  if (expectedUsers < 100) {
    config.maxEntries = 500;
  } else if (expectedUsers < 1000) {
    config.maxEntries = 2000;
  } else if (expectedUsers < 10000) {
    config.maxEntries = 10000;
  } else {
    config.maxEntries = 25000;
  }

  // Adjust TTL based on session duration
  config.ttl = Math.max(MIN_CACHE_TTL, Math.min(averageSessionDuration * 60, 1800));

  // Adjust based on memory constraints
  switch (memoryConstraints) {
    case 'low':
      config.maxEntries = Math.floor(config.maxEntries * 0.5);
      config.compression = true;
      break;
    case 'high':
      config.maxEntries = Math.floor(config.maxEntries * 2);
      config.compression = false;
      break;
    default:
      // medium - use calculated values
      break;
  }

  return config;
}
