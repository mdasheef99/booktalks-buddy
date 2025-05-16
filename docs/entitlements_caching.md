# Entitlements Caching System

## Overview

The entitlements caching system provides an efficient way to store and retrieve user entitlements without making unnecessary database queries. This document explains the design, implementation, and usage of the enhanced caching mechanism.

## Key Features

- **Client-side persistence** using sessionStorage to maintain cache across page refreshes
- **Versioned cache** to handle schema changes gracefully
- **Configurable expiration** to balance freshness and performance
- **Cache statistics** for monitoring and debugging
- **Error handling** to gracefully handle storage issues
- **Typed interface** for better developer experience

## Cache Structure

Each cache entry is stored with the following structure:

```typescript
interface EntitlementsCache {
  entitlements: string[];  // Array of entitlement strings
  version: number;         // Cache schema version
  timestamp: number;       // When the cache was created
  userId: string;          // User ID the cache belongs to
}
```

## Configuration Options

The cache behavior can be configured with the following options:

```typescript
const CACHE_CONFIG = {
  // Cache expiration time in milliseconds (5 minutes by default)
  EXPIRATION: 5 * 60 * 1000,
  // Storage key prefix for sessionStorage
  KEY_PREFIX: 'entitlements_cache_',
  // Current cache version - increment when cache structure changes
  VERSION: 1,
  // Enable debug logging
  DEBUG: false
};
```

## API Reference

### Core Functions

#### `getUserEntitlements(userId: string, forceRefresh = false): Promise<string[]>`

Retrieves entitlements for a user, using cache if available and not expired.

- **Parameters**:
  - `userId`: The user ID to get entitlements for
  - `forceRefresh`: Whether to force a refresh of the cache (default: false)
- **Returns**: A promise that resolves to an array of entitlement strings
- **Behavior**:
  - If `forceRefresh` is true, always recalculates entitlements
  - If cache is valid and not expired, returns cached entitlements
  - Otherwise, calculates fresh entitlements and updates the cache

#### `invalidateUserEntitlements(userId: string): void`

Invalidates the entitlements cache for a specific user.

- **Parameters**:
  - `userId`: The user ID to invalidate the cache for
- **Behavior**: Removes the user's cache entry from sessionStorage

#### `clearEntitlementsCache(): void`

Clears the entire entitlements cache for all users.

- **Behavior**: Removes all entitlements cache entries from sessionStorage

### Configuration and Monitoring

#### `configureEntitlementsCache(config: Partial<typeof CACHE_CONFIG>): void`

Updates the cache configuration.

- **Parameters**:
  - `config`: Partial configuration object with options to update
- **Example**:
  ```typescript
  configureEntitlementsCache({
    EXPIRATION: 10 * 60 * 1000, // 10 minutes
    DEBUG: true
  });
  ```

#### `getEntitlementsCacheStats(): CacheStats`

Returns statistics about cache usage.

- **Returns**: Object with hit, miss, and error counts
- **Example**:
  ```typescript
  const stats = getEntitlementsCacheStats();
  console.log(`Cache hits: ${stats.hits}, misses: ${stats.misses}`);
  ```

#### `resetEntitlementsCacheStats(): void`

Resets all cache statistics to zero.

### Utility Functions

#### `getEntitlementsCacheTimestamp(userId: string): number | null`

Gets the timestamp of when the entitlements were last calculated for a user.

- **Parameters**:
  - `userId`: The user ID to get the timestamp for
- **Returns**: The timestamp in milliseconds, or null if not cached

#### `isEntitlementsCacheExpired(userId: string): boolean`

Checks if the entitlements cache for a user is expired.

- **Parameters**:
  - `userId`: The user ID to check
- **Returns**: True if the cache is expired or doesn't exist, false otherwise

#### `getCachedUserIds(): string[]`

Gets all user IDs that have cached entitlements.

- **Returns**: An array of user IDs with cached entitlements

#### `getEntitlementsCacheSize(): number`

Gets the number of users with cached entitlements.

- **Returns**: The number of users with cached entitlements

## Usage Examples

### Basic Usage

```typescript
// Get entitlements for a user (uses cache if available)
const entitlements = await getUserEntitlements(userId);

// Force refresh the cache
const freshEntitlements = await getUserEntitlements(userId, true);

// Invalidate cache for a specific user
invalidateUserEntitlements(userId);
```

### Configuration

```typescript
// Configure cache with custom settings
configureEntitlementsCache({
  EXPIRATION: 15 * 60 * 1000, // 15 minutes
  KEY_PREFIX: 'my_app_entitlements_',
  DEBUG: process.env.NODE_ENV === 'development'
});
```

### Monitoring

```typescript
// Get cache statistics
const stats = getEntitlementsCacheStats();
console.log(`Cache performance: ${stats.hits}/${stats.hits + stats.misses} hits (${stats.errors} errors)`);

// Reset statistics
resetEntitlementsCacheStats();
```

## When to Invalidate Cache

The entitlements cache should be invalidated in the following scenarios:

1. User logs in or out
2. User's account tier changes
3. User is assigned or removed from a store role
4. User becomes a club lead or is removed as one
5. User is assigned or removed as a club moderator

Example:

```typescript
// After updating a user's tier
async function updateUserTier(userId, newTier) {
  await supabase.from('users').update({ account_tier: newTier }).eq('id', userId);
  invalidateUserEntitlements(userId);
}
```

## Implementation Notes

### Storage Mechanism

The cache uses `sessionStorage` which:
- Persists across page refreshes
- Is cleared when the browser tab is closed
- Has a storage limit of ~5-10MB per domain
- Is synchronous and won't block the main thread for typical usage

### Error Handling

The cache implementation includes robust error handling:
- Storage errors (e.g., quota exceeded) are caught and logged
- Cache statistics track error counts
- If storage fails, the system falls back to calculating fresh entitlements

### Performance Considerations

- The default cache expiration is set to 5 minutes to balance freshness and performance
- Cache hits and misses are tracked to help optimize the expiration time
- Debug logging can be enabled to monitor cache behavior in development

## Future Improvements

Potential future enhancements to the caching system:

1. **Selective invalidation** - Invalidate only specific entitlements rather than the entire cache for a user
2. **Shared worker storage** - Use a shared worker to share cache across tabs
3. **Offline support** - Integrate with IndexedDB for persistent offline caching
4. **Compression** - Compress cache data to reduce storage usage
5. **Prefetching** - Preemptively calculate entitlements for frequently accessed users
