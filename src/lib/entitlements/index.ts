/**
 * Entitlements Service
 *
 * This module provides functions for calculating and checking user entitlements
 * based on their roles in the system.
 */

// Re-export all constants and types
export * from './constants';
export * from './permissions';
export * from './roles';
export * from './membership';

// Re-export backend enforcement
export * from './backend';

// Re-export cache functionality (includes getUserEntitlements)
export * from './cache';

// Core entitlements service - main exports and public API
// All functionality has been moved to specialized modules for better organization
