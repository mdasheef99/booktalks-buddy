/**
 * Entitlements Cache Initialization
 * 
 * This module initializes the entitlements caching system with the appropriate
 * configuration based on the environment.
 */

import { configureEntitlementsCache } from './cache';

/**
 * Initialize the entitlements caching system
 * 
 * This function should be called when the application starts.
 */
export function initEntitlementsCache() {
  // Configure the cache based on the environment
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  configureEntitlementsCache({
    // In development, use a shorter expiration time for easier testing
    EXPIRATION: isDevelopment ? 2 * 60 * 1000 : 5 * 60 * 1000, // 2 minutes in dev, 5 minutes in prod
    
    // Use a prefix that includes the environment to avoid conflicts
    KEY_PREFIX: `entitlements_${isDevelopment ? 'dev' : 'prod'}_`,
    
    // Enable debug logging in development
    DEBUG: isDevelopment
  });
  
  if (isDevelopment) {
    console.debug('[EntitlementsCache] Initialized with development configuration');
  }
}

/**
 * Reset the entitlements cache
 * 
 * This function can be called to reset the cache when needed, such as
 * when testing or when a user's permissions have changed significantly.
 */
export function resetEntitlementsCache() {
  // Re-initialize the cache with default settings
  initEntitlementsCache();
  
  // Clear any existing cache entries
  try {
    // Find all entitlements cache keys
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('entitlements_')) {
        keysToRemove.push(key);
      }
    }
    
    // Remove all found keys
    keysToRemove.forEach(key => {
      sessionStorage.removeItem(key);
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[EntitlementsCache] Reset cache, removed ${keysToRemove.length} entries`);
    }
  } catch (error) {
    console.error('Failed to reset entitlements cache:', error);
  }
}
