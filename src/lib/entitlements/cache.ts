/**
 * Entitlements Caching
 *
 * This module provides functions for caching and retrieving user entitlements.
 * It uses sessionStorage for persistence across page refreshes and includes
 * versioning and expiration for better cache management.
 *
 * All functionality has been moved to the cache/ directory for better organization.
 */

// Re-export all cache functionality from the modular cache system
export * from './cache/index';
