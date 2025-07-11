/**
 * Subscription-Aware Caching System
 *
 * This file now serves as a compatibility layer that re-exports the new modular
 * cache implementation. The actual implementation has been refactored into
 * modular components in the cache/ directory for better maintainability.
 *
 * Created: 2025-01-07
 * Refactored: 2025-07-10 (Phase 1A - Modular Cache Implementation)
 *
 * NEW MODULAR STRUCTURE:
 * - cache/types.ts - Cache-specific type definitions
 * - cache/core.ts - Core cache operations and SubscriptionCache class
 * - cache/invalidation.ts - Cache invalidation and cleanup logic
 * - cache/performance.ts - Performance monitoring and metrics
 * - cache/subscription-aware.ts - Subscription-specific caching logic
 * - cache/config.ts - Cache configuration management
 * - cache/index.ts - Public API re-exports for backward compatibility
 */

// Re-export everything from the new modular implementation
export * from './cache/index';
