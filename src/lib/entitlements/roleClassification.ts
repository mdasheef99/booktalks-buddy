/**
 * Role Classification System for Subscription Enforcement
 *
 * REFACTORED: This file now serves as the main entry point for the modular
 * role classification system. All functionality has been organized into
 * focused modules while maintaining 100% backward compatibility.
 *
 * Created: 2025-01-08
 * Refactored: 2025-01-11
 * Part of: Phase 3.1 - Administrative Role Exemption System
 */

// Re-export all types and interfaces
export * from './roleClassification/types';

// Re-export constants
export * from './roleClassification/constants';

// Re-export core functionality
export * from './roleClassification/core/classification';
export * from './roleClassification/core/administrativeRoles';
export * from './roleClassification/core/userRoles';

// Re-export utilities
export * from './roleClassification/utils/validation';
export * from './roleClassification/utils/logging';



