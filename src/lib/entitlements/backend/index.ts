/**
 * Backend Enforcement Module
 *
 * This module provides backend enforcement logic for the entitlements system,
 * including API middleware, membership limit enforcement, and role activity tracking.
 */

// Re-export all backend enforcement functionality
export * from './middleware';
export * from './enforcement';
export * from './tracking';
export * from './utils';
export * from './types';
