

/**
 * AuthContext - Modular Authentication System
 *
 * REFACTORED: This file now serves as the main entry point for the modular
 * authentication system. All functionality has been organized into focused
 * modules while maintaining 100% backward compatibility.
 *
 * Created: Original AuthContext
 * Refactored: 2025-01-11
 * Part of: Authentication System Refactoring
 */

// Re-export all types and interfaces
export * from './AuthContext/types';

// Re-export the main provider and hook
export { AuthProvider, useAuth } from './AuthContext/index.js';







