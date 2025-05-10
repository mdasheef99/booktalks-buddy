/**
 * Entitlements Caching
 * 
 * This module provides functions for caching and retrieving user entitlements.
 */

import { calculateUserEntitlements } from './index';

// Cache expiration time in milliseconds (15 minutes)
const CACHE_EXPIRATION = 15 * 60 * 1000;

// In-memory cache for entitlements
interface EntitlementsCacheEntry {
  entitlements: string[];
  timestamp: number;
}

const entitlementsCache: Record<string, EntitlementsCacheEntry> = {};

/**
 * Get entitlements for a user, using cache if available and not expired
 * 
 * @param userId The user ID to get entitlements for
 * @param forceRefresh Whether to force a refresh of the cache
 * @returns A promise that resolves to an array of entitlement strings
 */
export async function getUserEntitlements(
  userId: string,
  forceRefresh = false
): Promise<string[]> {
  const now = Date.now();
  const cached = entitlementsCache[userId];
  
  // If we have a cached entry that's not expired and we're not forcing a refresh, use it
  if (
    !forceRefresh &&
    cached &&
    now - cached.timestamp < CACHE_EXPIRATION
  ) {
    return cached.entitlements;
  }
  
  // Otherwise, calculate entitlements and update the cache
  const entitlements = await calculateUserEntitlements(userId);
  entitlementsCache[userId] = {
    entitlements,
    timestamp: now,
  };
  
  return entitlements;
}

/**
 * Invalidate the entitlements cache for a user
 * 
 * @param userId The user ID to invalidate the cache for
 */
export function invalidateUserEntitlements(userId: string): void {
  delete entitlementsCache[userId];
}

/**
 * Clear the entire entitlements cache
 */
export function clearEntitlementsCache(): void {
  Object.keys(entitlementsCache).forEach(key => {
    delete entitlementsCache[key];
  });
}

/**
 * Get the timestamp of when the entitlements were last calculated for a user
 * 
 * @param userId The user ID to get the timestamp for
 * @returns The timestamp in milliseconds, or null if not cached
 */
export function getEntitlementsCacheTimestamp(userId: string): number | null {
  return entitlementsCache[userId]?.timestamp || null;
}

/**
 * Check if the entitlements cache for a user is expired
 * 
 * @param userId The user ID to check
 * @returns True if the cache is expired or doesn't exist, false otherwise
 */
export function isEntitlementsCacheExpired(userId: string): boolean {
  const now = Date.now();
  const cached = entitlementsCache[userId];
  
  return !cached || now - cached.timestamp >= CACHE_EXPIRATION;
}

/**
 * Get all cached user IDs
 * 
 * @returns An array of user IDs that have cached entitlements
 */
export function getCachedUserIds(): string[] {
  return Object.keys(entitlementsCache);
}

/**
 * Get the size of the entitlements cache
 * 
 * @returns The number of users with cached entitlements
 */
export function getEntitlementsCacheSize(): number {
  return Object.keys(entitlementsCache).length;
}
