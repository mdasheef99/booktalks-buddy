/**
 * Subscription Validation Functions
 *
 * This file now serves as a compatibility layer that re-exports the new modular
 * validation implementation. The actual implementation has been refactored into
 * modular components in the validation/ directory for better maintainability.
 *
 * Created: 2025-01-07
 * Refactored: 2025-07-10 (Phase 1B - Modular Validation Implementation)
 *
 * NEW MODULAR STRUCTURE:
 * - validation/types.ts - Validation-specific type definitions
 * - validation/core.ts - Core validation engine and orchestration
 * - validation/batch.ts - Batch validation processing
 * - validation/error-handling.ts - Error handling and fail-secure logic
 * - validation/utils.ts - Validation utilities and helpers
 * - validation/index.ts - Public API re-exports for backward compatibility
 */

// Re-export everything from the new modular implementation
export * from './validation/index';
