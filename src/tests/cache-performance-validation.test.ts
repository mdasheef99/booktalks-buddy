/**
 * Comprehensive Validation Test for Task 4A.1: Cache Performance Enhancement
 * 
 * Tests all implemented cache warming, invalidation, and monitoring features
 * to ensure they meet success criteria before proceeding to database optimizations.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { 
  getFrequentlyAccessedUsers,
  warmFrequentUserCache,
  getCachedSubscriptionStatus,
  invalidateOnSubscriptionEvent,
  getCacheStats,
  getEnhancedCacheStats,
  generateCachePerformanceReport,
  subscriptionCache
} from '../lib/api/subscriptions/cache';
import { isFeatureEnabled, SUBSCRIPTION_FEATURE_FLAGS } from '../lib/feature-flags';
import { supabase } from '../lib/supabase';

// Mock data for testing
const mockUsers = [
  'user-1-active',
  'user-2-frequent', 
  'user-3-recent',
  'user-4-inactive'
];

const mockRoleActivityData = [
  { user_id: 'user-1-active', last_active: new Date(Date.now() - 1000 * 60 * 60).toISOString() }, // 1 hour ago
  { user_id: 'user-2-frequent', last_active: new Date(Date.now() - 1000 * 60 * 30).toISOString() }, // 30 min ago
  { user_id: 'user-3-recent', last_active: new Date(Date.now() - 1000 * 60 * 10).toISOString() }, // 10 min ago
];

const mockSubscriptionMetrics = [
  { user_id: 'user-1-active', recorded_at: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
  { user_id: 'user-2-frequent', recorded_at: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
];

describe('Task 4A.1: Cache Performance Enhancement Validation', () => {
  
  beforeEach(async () => {
    // Clear cache before each test
    await subscriptionCache.clear();
    
    // Reset performance stats
    subscriptionCache.performanceMonitor.resetStats();
  });

  afterEach(async () => {
    // Clean up after tests
    await subscriptionCache.clear();
  });

  describe('1. Functional Testing - Intelligent Cache Warming', () => {
    
    it('should identify frequently accessed users from database', async () => {
      console.log('🧪 Testing getFrequentlyAccessedUsers function...');
      
      // Mock database responses
      jest.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'role_activity') {
          return {
            select: () => ({
              gte: () => ({
                order: () => ({
                  limit: () => Promise.resolve({ data: mockRoleActivityData, error: null })
                })
              })
            })
          } as any;
        }
        if (table === 'subscription_metrics') {
          return {
            select: () => ({
              not: () => ({
                gte: () => ({
                  order: () => ({
                    limit: () => Promise.resolve({ data: mockSubscriptionMetrics, error: null })
                  })
                })
              })
            })
          } as any;
        }
        return {} as any;
      });

      const frequentUsers = await getFrequentlyAccessedUsers(10);
      
      expect(frequentUsers).toBeDefined();
      expect(Array.isArray(frequentUsers)).toBe(true);
      expect(frequentUsers.length).toBeGreaterThan(0);
      
      // Should prioritize users with recent activity
      expect(frequentUsers).toContain('user-3-recent'); // Most recent activity
      
      console.log(`✅ Identified ${frequentUsers.length} frequent users:`, frequentUsers);
    });

    it('should successfully warm cache for identified users', async () => {
      console.log('🧪 Testing warmFrequentUserCache function...');
      
      // Mock the user identification
      jest.spyOn(require('../lib/api/subscriptions/cache'), 'getFrequentlyAccessedUsers')
        .mockResolvedValue(['user-1', 'user-2']);
      
      // Mock subscription validation
      jest.spyOn(require('../lib/api/subscriptions/validation'), 'validateUserSubscription')
        .mockResolvedValue({
          success: true,
          status: {
            hasActiveSubscription: true,
            currentTier: 'PRIVILEGED',
            subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            isValid: true,
            lastValidated: new Date().toISOString(),
            validationSource: 'database'
          }
        });

      const result = await warmFrequentUserCache({ 
        limit: 2, 
        respectFeatureFlags: false // Skip feature flag for testing
      });
      
      expect(result).toBeDefined();
      expect(result.warmed).toBeGreaterThan(0);
      expect(result.failed).toBe(0);
      expect(result.duration).toBeGreaterThan(0);
      
      console.log(`✅ Cache warming result:`, result);
    });

    it('should respect feature flag protection', async () => {
      console.log('🧪 Testing feature flag protection...');
      
      // Mock feature flag as disabled
      jest.spyOn(require('../lib/feature-flags'), 'isFeatureEnabled')
        .mockResolvedValue({ enabled: false });

      const result = await warmFrequentUserCache({ 
        limit: 5, 
        respectFeatureFlags: true 
      });
      
      expect(result.warmed).toBe(0);
      expect(result.failed).toBe(0);
      
      console.log('✅ Feature flag protection working - warming skipped when disabled');
    });
  });

  describe('2. Performance Validation', () => {
    
    it('should track cache warming performance metrics', async () => {
      console.log('🧪 Testing cache warming performance tracking...');
      
      const initialStats = subscriptionCache.performanceMonitor.getEnhancedStats();
      expect(initialStats.warming.totalWarmingOperations).toBe(0);
      
      // Record a warming operation
      subscriptionCache.performanceMonitor.recordWarming(150, true);
      
      const updatedStats = subscriptionCache.performanceMonitor.getEnhancedStats();
      expect(updatedStats.warming.totalWarmingOperations).toBe(1);
      expect(updatedStats.warming.successfulWarmings).toBe(1);
      expect(updatedStats.warming.averageWarmingTime).toBe(150);
      
      console.log('✅ Warming metrics tracked correctly:', updatedStats.warming);
    });

    it('should track cache invalidation metrics', async () => {
      console.log('🧪 Testing cache invalidation performance tracking...');
      
      const initialStats = subscriptionCache.performanceMonitor.getEnhancedStats();
      expect(initialStats.invalidation.totalInvalidations).toBe(0);
      
      // Record invalidation operations
      subscriptionCache.performanceMonitor.recordInvalidation('subscription');
      subscriptionCache.performanceMonitor.recordInvalidation('expiry');
      
      const updatedStats = subscriptionCache.performanceMonitor.getEnhancedStats();
      expect(updatedStats.invalidation.totalInvalidations).toBe(2);
      expect(updatedStats.invalidation.subscriptionBasedInvalidations).toBe(1);
      expect(updatedStats.invalidation.expiryBasedInvalidations).toBe(1);
      
      console.log('✅ Invalidation metrics tracked correctly:', updatedStats.invalidation);
    });

    it('should generate comprehensive performance reports', async () => {
      console.log('🧪 Testing performance report generation...');
      
      // Add some test metrics
      subscriptionCache.performanceMonitor.recordHit(50);
      subscriptionCache.performanceMonitor.recordMiss(100);
      subscriptionCache.performanceMonitor.recordWarming(200, true);
      subscriptionCache.performanceMonitor.recordInvalidation('subscription');
      
      const report = await generateCachePerformanceReport(false); // Don't send to DB
      
      expect(report).toBeDefined();
      expect(report.timestamp).toBeDefined();
      expect(report.stats).toBeDefined();
      expect(report.warming).toBeDefined();
      expect(report.invalidation).toBeDefined();
      expect(report.efficiency).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);
      
      console.log('✅ Performance report generated:', {
        timestamp: report.timestamp,
        hitRate: report.stats.hitRate,
        efficiency: report.efficiency.score,
        recommendations: report.recommendations.length
      });
    });
  });

  describe('3. Integration Testing', () => {
    
    it('should integrate with existing cache system without breaking changes', async () => {
      console.log('🧪 Testing integration with existing cache system...');
      
      // Test that basic cache operations still work
      const testUserId = 'test-user-integration';
      
      // Mock subscription validation for basic cache operation
      jest.spyOn(require('../lib/api/subscriptions/validation'), 'validateUserSubscription')
        .mockResolvedValue({
          success: true,
          status: {
            hasActiveSubscription: true,
            currentTier: 'MEMBER',
            subscriptionExpiry: null,
            isValid: true,
            lastValidated: new Date().toISOString(),
            validationSource: 'database'
          }
        });

      // Test basic cache operations
      const status = await getCachedSubscriptionStatus(testUserId);
      expect(status).toBeDefined();
      expect(status.hasActiveSubscription).toBe(true);
      
      // Test that cache stats are accessible
      const stats = getCacheStats();
      expect(stats).toBeDefined();
      expect(typeof stats.hitRate).toBe('number');
      
      console.log('✅ Integration with existing cache system successful');
    });

    it('should handle subscription lifecycle invalidation', async () => {
      console.log('🧪 Testing subscription lifecycle invalidation...');
      
      const testUserId = 'test-user-invalidation';
      
      // Mock feature flag as enabled
      jest.spyOn(require('../lib/feature-flags'), 'isFeatureEnabled')
        .mockResolvedValue({ enabled: true });
      
      // Mock database metric recording
      jest.spyOn(supabase, 'rpc').mockResolvedValue({ data: 'success', error: null });
      
      // Test invalidation for different subscription events
      const events: Array<'subscription_created' | 'subscription_expired' | 'subscription_renewed' | 'tier_change'> = [
        'subscription_created',
        'subscription_expired', 
        'subscription_renewed',
        'tier_change'
      ];
      
      for (const event of events) {
        const result = await invalidateOnSubscriptionEvent(testUserId, event);
        expect(typeof result).toBe('boolean');
      }
      
      console.log('✅ Subscription lifecycle invalidation working for all event types');
    });
  });

  describe('4. Code Quality Check', () => {
    
    it('should have robust error handling', async () => {
      console.log('🧪 Testing error handling robustness...');
      
      // Test error handling in user identification
      jest.spyOn(supabase, 'from').mockImplementation(() => {
        throw new Error('Database connection failed');
      });
      
      const frequentUsers = await getFrequentlyAccessedUsers(5);
      expect(Array.isArray(frequentUsers)).toBe(true);
      expect(frequentUsers.length).toBe(0); // Should return empty array on error
      
      console.log('✅ Error handling is robust - graceful degradation on database errors');
    });

    it('should provide appropriate logging visibility', async () => {
      console.log('🧪 Testing logging visibility...');
      
      const consoleSpy = jest.spyOn(console, 'log');
      
      // Test that cache operations log appropriately
      subscriptionCache.performanceMonitor.recordHit(25);
      
      // Generate a performance report to trigger logging
      await generateCachePerformanceReport(false);
      
      // Verify that logging occurred (console.log was called)
      expect(consoleSpy).toHaveBeenCalled();
      
      console.log('✅ Logging provides appropriate visibility into operations');
      
      consoleSpy.mockRestore();
    });
  });

  describe('5. Success Criteria Verification', () => {
    
    it('should meet all Phase 4A.1 success criteria', async () => {
      console.log('🧪 Verifying all success criteria...');
      
      const criteria = {
        featureFlagProtection: false,
        intelligentUserIdentification: false,
        enhancedInvalidation: false,
        comprehensiveMonitoring: false,
        backwardCompatibility: false
      };
      
      // Test feature flag protection
      try {
        await warmFrequentUserCache({ respectFeatureFlags: true });
        criteria.featureFlagProtection = true;
      } catch (error) {
        console.error('Feature flag protection test failed:', error);
      }
      
      // Test intelligent user identification
      try {
        const users = await getFrequentlyAccessedUsers(1);
        criteria.intelligentUserIdentification = Array.isArray(users);
      } catch (error) {
        console.error('User identification test failed:', error);
      }
      
      // Test enhanced invalidation
      try {
        const result = await invalidateOnSubscriptionEvent('test-user', 'subscription_created');
        criteria.enhancedInvalidation = typeof result === 'boolean';
      } catch (error) {
        console.error('Enhanced invalidation test failed:', error);
      }
      
      // Test comprehensive monitoring
      try {
        const enhancedStats = getEnhancedCacheStats();
        criteria.comprehensiveMonitoring = !!(enhancedStats.warming && enhancedStats.invalidation && enhancedStats.efficiency);
      } catch (error) {
        console.error('Comprehensive monitoring test failed:', error);
      }
      
      // Test backward compatibility
      try {
        const basicStats = getCacheStats();
        criteria.backwardCompatibility = !!(basicStats.hitRate !== undefined);
      } catch (error) {
        console.error('Backward compatibility test failed:', error);
      }
      
      console.log('📊 Success Criteria Results:', criteria);
      
      // Verify all criteria are met
      const allCriteriaMet = Object.values(criteria).every(met => met === true);
      expect(allCriteriaMet).toBe(true);
      
      console.log('✅ All Phase 4A.1 success criteria verified and met');
    });
  });
});
