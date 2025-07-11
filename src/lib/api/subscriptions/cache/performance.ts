/**
 * Cache Performance Monitoring Module
 *
 * Handles performance monitoring, cache hit/miss tracking, optimization algorithms,
 * and metrics collection. Extracted from cache.ts refactoring.
 *
 * Created: 2025-07-10
 * Part of: Phase 1A - cache.ts Refactoring
 */

import type { CacheStats } from './types';
import { supabase } from '@/lib/supabase';
import { isFeatureEnabled, SUBSCRIPTION_FEATURE_FLAGS } from '@/lib/feature-flags';

// =========================
// Performance Monitoring
// =========================

/**
 * Enhanced performance monitor for cache operations
 */
export class CachePerformanceMonitor {
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalRequests: 0,
    hitRate: 0,
    averageResponseTime: 0,
  };

  private warmingStats = {
    totalWarmingOperations: 0,
    successfulWarmings: 0,
    failedWarmings: 0,
    averageWarmingTime: 0,
  };

  private invalidationStats = {
    totalInvalidations: 0,
    subscriptionBasedInvalidations: 0,
    expiryBasedInvalidations: 0,
    manualInvalidations: 0,
  };

  private lastReportTime = Date.now();

  /**
   * Record a cache hit
   */
  recordHit(responseTime: number): void {
    this.stats.hits++;
    this.stats.totalRequests++;
    this.updateAverageResponseTime(responseTime);
    this.updateHitRate();
  }

  /**
   * Record a cache miss
   */
  recordMiss(responseTime: number): void {
    this.stats.misses++;
    this.stats.totalRequests++;
    this.updateAverageResponseTime(responseTime);
    this.updateHitRate();
  }

  /**
   * Record a cache eviction
   */
  recordEviction(): void {
    this.stats.evictions++;
  }

  /**
   * Get current performance statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Record cache warming operation
   */
  recordWarming(duration: number, success: boolean): void {
    this.warmingStats.totalWarmingOperations++;
    if (success) {
      this.warmingStats.successfulWarmings++;
    } else {
      this.warmingStats.failedWarmings++;
    }

    // Update average warming time
    this.warmingStats.averageWarmingTime =
      (this.warmingStats.averageWarmingTime * (this.warmingStats.totalWarmingOperations - 1) + duration) /
      this.warmingStats.totalWarmingOperations;
  }

  /**
   * Record cache invalidation operation
   */
  recordInvalidation(type: 'subscription' | 'expiry' | 'manual'): void {
    this.invalidationStats.totalInvalidations++;

    switch (type) {
      case 'subscription':
        this.invalidationStats.subscriptionBasedInvalidations++;
        break;
      case 'expiry':
        this.invalidationStats.expiryBasedInvalidations++;
        break;
      case 'manual':
        this.invalidationStats.manualInvalidations++;
        break;
    }
  }

  /**
   * Get comprehensive performance statistics
   */
  getEnhancedStats(): CacheStats & {
    warming: typeof this.warmingStats;
    invalidation: typeof this.invalidationStats;
    efficiency: { score: number; recommendation: string };
  } {
    const efficiency = calculateCacheEfficiency(this.stats);

    return {
      ...this.stats,
      warming: { ...this.warmingStats },
      invalidation: { ...this.invalidationStats },
      efficiency,
    };
  }

  /**
   * Reset performance statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalRequests: 0,
      hitRate: 0,
      averageResponseTime: 0,
    };

    this.warmingStats = {
      totalWarmingOperations: 0,
      successfulWarmings: 0,
      failedWarmings: 0,
      averageWarmingTime: 0,
    };

    this.invalidationStats = {
      totalInvalidations: 0,
      subscriptionBasedInvalidations: 0,
      expiryBasedInvalidations: 0,
      manualInvalidations: 0,
    };

    this.lastReportTime = Date.now();
  }

  /**
   * Generate performance report and optionally send to monitoring system
   */
  async generatePerformanceReport(sendToDatabase: boolean = false): Promise<{
    timestamp: string;
    stats: CacheStats;
    warming: typeof this.warmingStats;
    invalidation: typeof this.invalidationStats;
    efficiency: { score: number; recommendation: string };
    recommendations: string[];
  }> {
    const efficiency = calculateCacheEfficiency(this.stats);
    const recommendations = this.generateRecommendations();

    const report = {
      timestamp: new Date().toISOString(),
      stats: { ...this.stats },
      warming: { ...this.warmingStats },
      invalidation: { ...this.invalidationStats },
      efficiency,
      recommendations,
    };

    // Send to database if enabled and feature flag allows
    if (sendToDatabase) {
      try {
        const monitoringEnabled = await isFeatureEnabled(
          SUBSCRIPTION_FEATURE_FLAGS.SUBSCRIPTION_MONITORING
        );

        if (monitoringEnabled.enabled) {
          await this.sendPerformanceMetrics(report);
        }
      } catch (error) {
        console.error('[Performance Monitor] Error sending metrics to database:', error);
      }
    }

    return report;
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    // Hit rate recommendations
    if (this.stats.hitRate < 0.85) {
      recommendations.push('Consider implementing intelligent cache warming to improve hit rate');
    }

    // Response time recommendations
    if (this.stats.averageResponseTime > 100) {
      recommendations.push('Cache operations are slow - consider query optimization');
    }

    // Warming efficiency recommendations
    if (this.warmingStats.totalWarmingOperations > 0) {
      const warmingSuccessRate = this.warmingStats.successfulWarmings / this.warmingStats.totalWarmingOperations;
      if (warmingSuccessRate < 0.9) {
        recommendations.push('Cache warming has high failure rate - investigate user identification logic');
      }
    }

    // Invalidation pattern recommendations
    if (this.invalidationStats.totalInvalidations > 0) {
      const subscriptionInvalidationRate = this.invalidationStats.subscriptionBasedInvalidations / this.invalidationStats.totalInvalidations;
      if (subscriptionInvalidationRate < 0.5) {
        recommendations.push('Most invalidations are not subscription-based - consider improving subscription event tracking');
      }
    }

    return recommendations;
  }

  /**
   * Send performance metrics to database
   */
  private async sendPerformanceMetrics(report: any): Promise<void> {
    try {
      await supabase.rpc('record_subscription_metric', {
        p_metric_type: 'cache_performance',
        p_metric_data: {
          cache_stats: report.stats,
          warming_stats: report.warming,
          invalidation_stats: report.invalidation,
          efficiency: report.efficiency,
          recommendations: report.recommendations,
          report_timestamp: report.timestamp
        },
        p_source: 'cache_performance_monitor'
      });

      console.log('[Performance Monitor] Performance metrics sent to database');
    } catch (error) {
      console.error('[Performance Monitor] Failed to send performance metrics:', error);
      throw error;
    }
  }

  /**
   * Update average response time
   */
  private updateAverageResponseTime(responseTime: number): void {
    this.stats.averageResponseTime =
      (this.stats.averageResponseTime * (this.stats.totalRequests - 1) + responseTime) / this.stats.totalRequests;
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    this.stats.hitRate = this.stats.hits / this.stats.totalRequests;
  }
}

// =========================
// Performance Utilities
// =========================

/**
 * Calculate cache efficiency metrics
 */
export function calculateCacheEfficiency(stats: CacheStats): {
  efficiency: number;
  recommendation: string;
} {
  const { hitRate, averageResponseTime, evictions, totalRequests } = stats;

  let efficiency = 0;
  let recommendation = '';

  // Calculate efficiency score (0-100)
  if (totalRequests === 0) {
    efficiency = 0;
    recommendation = 'No cache activity recorded';
  } else {
    // Hit rate contributes 60% to efficiency
    const hitRateScore = hitRate * 60;

    // Response time contributes 25% (lower is better)
    const responseTimeScore = Math.max(0, 25 - (averageResponseTime / 10));

    // Eviction rate contributes 15% (lower is better)
    const evictionRate = evictions / totalRequests;
    const evictionScore = Math.max(0, 15 - (evictionRate * 100));

    efficiency = Math.round(hitRateScore + responseTimeScore + evictionScore);

    // Generate recommendations
    if (hitRate < 0.7) {
      recommendation = 'Consider increasing cache TTL or cache size';
    } else if (averageResponseTime > 50) {
      recommendation = 'Cache operations are slow - consider optimization';
    } else if (evictionRate > 0.1) {
      recommendation = 'High eviction rate - consider increasing cache size';
    } else {
      recommendation = 'Cache performance is optimal';
    }
  }

  return { efficiency, recommendation };
}
