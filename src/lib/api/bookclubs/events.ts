/**
 * Book Club Events Management
 *
 * This file is a barrel file that re-exports all event-related functionality
 * from the modular structure in the events/ directory.
 *
 * This maintains backward compatibility for any imports that haven't been updated.
 */

// Re-export everything from the modular structure
export * from './events/types';
export * from './events/core';
export * from './events/queries';
export * from './events/images';
