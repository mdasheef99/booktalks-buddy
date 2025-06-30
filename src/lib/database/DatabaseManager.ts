/**
 * Enhanced Database Manager with comprehensive error handling
 * Provides robust database operations with retry logic and graceful degradation
 */

import { supabase } from '@/lib/supabase';
import { ErrorManager, AppError, ErrorType, ErrorSeverity } from '@/lib/errors/ErrorManager';
import { NetworkManager } from '@/lib/network/NetworkManager';

export interface DatabaseOperation {
  table: string;
  operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert';
  data?: any;
  filters?: Record<string, any>;
  columns?: string;
}

export interface DatabaseResult<T = any> {
  data: T | null;
  error: AppError | null;
  fromCache?: boolean;
}

export interface CacheConfig {
  enabled: boolean;
  ttl: number; // Time to live in milliseconds
  key: string;
}

export class DatabaseManager {
  private static cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private static networkManager = NetworkManager.getInstance();

  /**
   * Execute database operation with comprehensive error handling
   */
  static async executeOperation<T>(
    operation: DatabaseOperation,
    cacheConfig?: CacheConfig
  ): Promise<DatabaseResult<T>> {
    const operationId = this.generateOperationId(operation);

    try {
      // Check cache first if enabled
      if (cacheConfig?.enabled) {
        const cached = this.getFromCache(cacheConfig.key);
        if (cached) {
          return { data: cached, error: null, fromCache: true };
        }
      }

      // Execute operation with network retry
      const result = await this.networkManager.withNetworkRetry(
        () => this.performDatabaseOperation<T>(operation),
        {
          maxRetries: 3,
          baseDelay: 1000,
          retryCondition: (error) => this.isRetryableError(error)
        }
      );

      // Cache successful results
      if (cacheConfig?.enabled && result.data) {
        this.setCache(cacheConfig.key, result.data, cacheConfig.ttl);
      }

      return result;
    } catch (error) {
      const appError = this.createDatabaseError(error, operation);
      
      // Try to return cached data as fallback
      if (cacheConfig?.enabled) {
        const staleData = this.getFromCache(cacheConfig.key, true); // Allow stale data
        if (staleData) {
          console.warn('Returning stale cached data due to database error');
          return { data: staleData, error: appError, fromCache: true };
        }
      }

      return { data: null, error: appError };
    }
  }

  /**
   * Perform the actual database operation
   */
  private static async performDatabaseOperation<T>(
    operation: DatabaseOperation
  ): Promise<DatabaseResult<T>> {
    let query = supabase.from(operation.table);

    switch (operation.operation) {
      case 'select':
        query = query.select(operation.columns || '*');
        
        // Apply filters
        if (operation.filters) {
          Object.entries(operation.filters).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              query = query.in(key, value);
            } else if (value !== undefined && value !== null) {
              query = query.eq(key, value);
            }
          });
        }
        break;

      case 'insert':
        query = query.insert(operation.data);
        if (operation.columns) {
          query = query.select(operation.columns);
        }
        break;

      case 'update':
        query = query.update(operation.data);
        
        // Apply filters for update
        if (operation.filters) {
          Object.entries(operation.filters).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }
        
        if (operation.columns) {
          query = query.select(operation.columns);
        }
        break;

      case 'delete':
        // Apply filters for delete
        if (operation.filters) {
          Object.entries(operation.filters).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }
        query = query.delete();
        break;

      case 'upsert':
        query = query.upsert(operation.data);
        if (operation.columns) {
          query = query.select(operation.columns);
        }
        break;

      default:
        throw new AppError(
          ErrorType.VALIDATION_ERROR,
          `Unsupported operation: ${operation.operation}`,
          { operation },
          ErrorSeverity.HIGH
        );
    }

    const { data, error } = await query;

    if (error) {
      throw AppError.fromSupabaseError(error, {
        operation: `${operation.operation}_${operation.table}`,
        metadata: operation
      });
    }

    return { data: data as T, error: null };
  }

  /**
   * Create standardized database error
   */
  private static createDatabaseError(error: any, operation: DatabaseOperation): AppError {
    if (error instanceof AppError) {
      return error;
    }

    return AppError.fromSupabaseError(error, {
      operation: `${operation.operation}_${operation.table}`,
      metadata: operation
    });
  }

  /**
   * Check if error is retryable
   */
  private static isRetryableError(error: any): boolean {
    // Network errors are retryable
    if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
      return true;
    }

    // Temporary server errors are retryable
    if (error?.status >= 500 && error?.status < 600) {
      return true;
    }

    // Timeout errors are retryable
    if (error?.name === 'AbortError' || error?.message?.includes('timeout')) {
      return true;
    }

    return false;
  }

  /**
   * Generate unique operation ID for caching and logging
   */
  private static generateOperationId(operation: DatabaseOperation): string {
    const parts = [
      operation.operation,
      operation.table,
      JSON.stringify(operation.filters || {}),
      operation.columns || 'all'
    ];
    
    return btoa(parts.join('|')).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  }

  /**
   * Cache management
   */
  private static setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });

    // Clean up expired entries periodically
    if (this.cache.size > 100) {
      this.cleanupCache();
    }
  }

  private static getFromCache(key: string, allowStale: boolean = false): any | null {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }

    const isExpired = Date.now() - cached.timestamp > cached.ttl;
    
    if (isExpired && !allowStale) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private static cleanupCache(): void {
    const now = Date.now();
    
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear cache for specific key or all cache
   */
  static clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Batch operations with transaction-like behavior
   */
  static async executeBatch(operations: DatabaseOperation[]): Promise<DatabaseResult<any>[]> {
    const results: DatabaseResult<any>[] = [];
    const errors: AppError[] = [];

    for (const operation of operations) {
      try {
        const result = await this.executeOperation(operation);
        results.push(result);
        
        if (result.error) {
          errors.push(result.error);
        }
      } catch (error) {
        const appError = this.createDatabaseError(error, operation);
        results.push({ data: null, error: appError });
        errors.push(appError);
      }
    }

    // If any critical errors occurred, log them
    if (errors.length > 0) {
      const batchError = new AppError(
        ErrorType.DATABASE_ERROR,
        `Batch operation completed with ${errors.length} errors`,
        {
          operation: 'batch_operation',
          metadata: { totalOperations: operations.length, errorCount: errors.length }
        },
        ErrorSeverity.MEDIUM
      );

      ErrorManager.handleError(batchError, {}, false);
    }

    return results;
  }

  /**
   * Health check for database connectivity
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .select('id')
        .limit(1);

      return !error;
    } catch {
      return false;
    }
  }
}

/**
 * Convenience functions for common operations
 */
export class DatabaseHelpers {
  /**
   * Safe user profile fetch with caching
   */
  static async getUserProfile(userId: string): Promise<DatabaseResult<any>> {
    return DatabaseManager.executeOperation(
      {
        table: 'users',
        operation: 'select',
        filters: { id: userId },
        columns: 'id, username, email, avatar_url, avatar_thumbnail_url, avatar_medium_url, avatar_full_url, displayname, favorite_author, favorite_genre, bio, membership_tier'
      },
      {
        enabled: true,
        ttl: 5 * 60 * 1000, // 5 minutes
        key: `user_profile_${userId}`
      }
    );
  }

  /**
   * Safe profile update with validation
   */
  static async updateUserProfile(userId: string, updates: any): Promise<DatabaseResult<any>> {
    // Clear cache before update
    DatabaseManager.clearCache(`user_profile_${userId}`);

    return DatabaseManager.executeOperation({
      table: 'users',
      operation: 'update',
      data: updates,
      filters: { id: userId },
      columns: 'id, username, displayname, bio, favorite_author, favorite_genre'
    });
  }

  /**
   * Safe book club data fetch
   */
  static async getBookClubData(clubId: string): Promise<DatabaseResult<any>> {
    return DatabaseManager.executeOperation(
      {
        table: 'book_clubs',
        operation: 'select',
        filters: { id: clubId }
      },
      {
        enabled: true,
        ttl: 2 * 60 * 1000, // 2 minutes
        key: `book_club_${clubId}`
      }
    );
  }
}

export default DatabaseManager;
