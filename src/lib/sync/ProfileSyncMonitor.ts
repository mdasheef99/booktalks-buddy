/**
 * Profile Synchronization Monitoring and Utilities
 * Provides monitoring, metrics, and administrative tools for profile sync operations
 */

import { ProfileSyncError, SyncErrorType } from './ProfileSyncError';
import { validateProfileSync, SyncValidationResult } from './ProfileSyncValidator';
import { ProfileCacheManager } from './ProfileCacheManager';

export interface SyncMetrics {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  recoveredOperations: number;
  averageValidationTime: number;
  lastOperation?: Date;
  errorBreakdown: Record<SyncErrorType, number>;
}

export interface SyncHealthReport {
  overallHealth: 'healthy' | 'warning' | 'critical';
  metrics: SyncMetrics;
  recentErrors: ProfileSyncError[];
  recommendations: string[];
  cacheStats: {
    profileCacheSize: number;
    usernameCacheSize: number;
  };
}

/**
 * Profile Sync Monitor - tracks sync operations and health
 */
export class ProfileSyncMonitor {
  private static metrics: SyncMetrics = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    recoveredOperations: 0,
    averageValidationTime: 0,
    errorBreakdown: {} as Record<SyncErrorType, number>
  };

  private static recentErrors: ProfileSyncError[] = [];
  private static readonly MAX_RECENT_ERRORS = 50;

  /**
   * Record a successful sync operation
   */
  static recordSuccess(validationTime?: number): void {
    this.metrics.totalOperations++;
    this.metrics.successfulOperations++;
    this.metrics.lastOperation = new Date();

    if (validationTime) {
      this.updateAverageValidationTime(validationTime);
    }

    this.logMetrics('success');
  }

  /**
   * Record a failed sync operation
   */
  static recordFailure(error: ProfileSyncError, recovered: boolean = false): void {
    this.metrics.totalOperations++;
    this.metrics.failedOperations++;
    this.metrics.lastOperation = new Date();

    if (recovered) {
      this.metrics.recoveredOperations++;
    }

    // Track error types
    if (!this.metrics.errorBreakdown[error.type]) {
      this.metrics.errorBreakdown[error.type] = 0;
    }
    this.metrics.errorBreakdown[error.type]++;

    // Store recent errors
    this.recentErrors.unshift(error);
    if (this.recentErrors.length > this.MAX_RECENT_ERRORS) {
      this.recentErrors = this.recentErrors.slice(0, this.MAX_RECENT_ERRORS);
    }

    this.logMetrics('failure', error);
  }

  /**
   * Update average validation time
   */
  private static updateAverageValidationTime(newTime: number): void {
    const currentAvg = this.metrics.averageValidationTime;
    const totalOps = this.metrics.totalOperations;
    
    if (totalOps === 1) {
      this.metrics.averageValidationTime = newTime;
    } else {
      this.metrics.averageValidationTime = ((currentAvg * (totalOps - 1)) + newTime) / totalOps;
    }
  }

  /**
   * Get current sync metrics
   */
  static getMetrics(): SyncMetrics {
    return { ...this.metrics };
  }

  /**
   * Get recent errors
   */
  static getRecentErrors(): ProfileSyncError[] {
    return [...this.recentErrors];
  }

  /**
   * Generate comprehensive health report
   */
  static async generateHealthReport(): Promise<SyncHealthReport> {
    const cacheStats = await ProfileCacheManager.getCacheStats();
    const recommendations: string[] = [];

    // Determine overall health
    let overallHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
    const successRate = this.metrics.totalOperations > 0 
      ? this.metrics.successfulOperations / this.metrics.totalOperations 
      : 1;

    if (successRate < 0.8) {
      overallHealth = 'critical';
      recommendations.push('Critical: Sync success rate below 80%. Investigate sync errors immediately.');
    } else if (successRate < 0.95) {
      overallHealth = 'warning';
      recommendations.push('Warning: Sync success rate below 95%. Monitor sync operations closely.');
    }

    // Check for high error rates
    const recentErrorRate = this.recentErrors.length / Math.min(this.metrics.totalOperations, 10);
    if (recentErrorRate > 0.3) {
      overallHealth = 'critical';
      recommendations.push('Critical: High recent error rate detected. Check system health.');
    }

    // Check average validation time
    if (this.metrics.averageValidationTime > 2000) {
      if (overallHealth === 'healthy') overallHealth = 'warning';
      recommendations.push('Warning: Sync validation taking longer than expected. Consider performance optimization.');
    }

    // Check cache health
    if (cacheStats.profileCacheSize > 1000) {
      recommendations.push('Info: Large profile cache detected. Consider periodic cache cleanup.');
    }

    // Check for specific error patterns
    const authErrors = this.metrics.errorBreakdown[SyncErrorType.AUTH_UPDATE_FAILED] || 0;
    const dbErrors = this.metrics.errorBreakdown[SyncErrorType.DATABASE_UPDATE_FAILED] || 0;
    
    if (authErrors > dbErrors * 2) {
      recommendations.push('Warning: High auth update failure rate. Check authentication service health.');
    } else if (dbErrors > authErrors * 2) {
      recommendations.push('Warning: High database update failure rate. Check database connectivity.');
    }

    if (recommendations.length === 0) {
      recommendations.push('System is operating normally. All sync metrics are within healthy ranges.');
    }

    return {
      overallHealth,
      metrics: this.getMetrics(),
      recentErrors: this.getRecentErrors(),
      recommendations,
      cacheStats
    };
  }

  /**
   * Reset metrics (for testing or maintenance)
   */
  static resetMetrics(): void {
    this.metrics = {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      recoveredOperations: 0,
      averageValidationTime: 0,
      errorBreakdown: {} as Record<SyncErrorType, number>
    };
    this.recentErrors = [];
    console.log('Sync metrics reset');
  }

  /**
   * Log metrics for monitoring
   */
  private static logMetrics(type: 'success' | 'failure', error?: ProfileSyncError): void {
    const logData = {
      type,
      metrics: this.metrics,
      timestamp: new Date().toISOString()
    };

    if (error) {
      console.warn('Sync operation failed:', {
        ...logData,
        error: {
          type: error.type,
          message: error.message,
          context: error.context
        }
      });
    } else {
      console.log('Sync operation succeeded:', logData);
    }
  }

  /**
   * Perform bulk sync validation for multiple users
   */
  static async validateMultipleUsers(userIds: string[]): Promise<{
    results: Map<string, SyncValidationResult>;
    summary: {
      total: number;
      valid: number;
      invalid: number;
      recovered: number;
    };
  }> {
    const results = new Map<string, SyncValidationResult>();
    let valid = 0;
    let invalid = 0;
    let recovered = 0;

    console.log(`Starting bulk sync validation for ${userIds.length} users...`);

    for (const userId of userIds) {
      try {
        const result = await validateProfileSync(userId);
        results.set(userId, result);

        if (result.valid) {
          valid++;
        } else {
          invalid++;
          if (result.recovered) {
            recovered++;
          }
        }

        // Record metrics
        if (result.valid || result.recovered) {
          this.recordSuccess(result.validationTime);
        } else {
          const error = new ProfileSyncError(
            SyncErrorType.SYNC_VALIDATION_FAILED,
            'Bulk validation failed',
            { userId, operation: 'bulk_validation' },
            true
          );
          this.recordFailure(error, result.recovered);
        }
      } catch (error) {
        const syncError = new ProfileSyncError(
          SyncErrorType.SYNC_VALIDATION_FAILED,
          'Bulk validation error',
          { userId, operation: 'bulk_validation', originalError: error as Error },
          true
        );
        this.recordFailure(syncError, false);
        
        results.set(userId, {
          valid: false,
          inconsistencies: [{
            field: 'validation_error',
            authValue: null,
            dbValue: null,
            severity: 'high',
            description: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          }],
          recovered: false,
          validationTime: 0
        });
        invalid++;
      }
    }

    const summary = {
      total: userIds.length,
      valid,
      invalid,
      recovered
    };

    console.log('Bulk sync validation completed:', summary);

    return { results, summary };
  }
}
