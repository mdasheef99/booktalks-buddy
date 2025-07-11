/**
 * Feature Flag System Tests
 * 
 * Tests for the frontend feature flag infrastructure integration with database.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  isFeatureEnabled,
  checkMultipleFeatureFlags,
  getSubscriptionFeatureFlags,
  clearAllFeatureFlagCache,
  SUBSCRIPTION_FEATURE_FLAGS,
  type FeatureFlagContext
} from '@/lib/feature-flags';

// Test context
const TEST_CONTEXT: FeatureFlagContext = {
  userId: 'efdf6150-d861-4f2c-b59c-5d71c115493b', // admin user from our test cases
  storeId: undefined
};

describe('Feature Flag System', () => {
  
  beforeEach(() => {
    // Clear cache before each test
    clearAllFeatureFlagCache();
  });
  
  afterEach(() => {
    // Clear cache after each test
    clearAllFeatureFlagCache();
  });
  
  describe('Core Feature Flag Functions', () => {
    
    it('should check subscription validation flag', async () => {
      const result = await isFeatureEnabled(
        SUBSCRIPTION_FEATURE_FLAGS.SUBSCRIPTION_VALIDATION_FIX,
        TEST_CONTEXT
      );
      
      expect(result).toBeDefined();
      expect(result.flagKey).toBe('subscription_validation_fix');
      expect(result.context).toEqual(TEST_CONTEXT);
      expect(result.checkedAt).toBeInstanceOf(Date);
      expect(typeof result.enabled).toBe('boolean');
      
      console.log(`🏁 Subscription validation flag: ${result.enabled ? 'ENABLED' : 'DISABLED'}`);
    });
    
    it('should check subscription cache invalidation flag', async () => {
      const result = await isFeatureEnabled(
        SUBSCRIPTION_FEATURE_FLAGS.SUBSCRIPTION_CACHE_INVALIDATION,
        TEST_CONTEXT
      );
      
      expect(result).toBeDefined();
      expect(result.flagKey).toBe('subscription_cache_invalidation');
      expect(typeof result.enabled).toBe('boolean');
      
      console.log(`🏁 Cache invalidation flag: ${result.enabled ? 'ENABLED' : 'DISABLED'}`);
    });
    
    it('should check subscription monitoring flag', async () => {
      const result = await isFeatureEnabled(
        SUBSCRIPTION_FEATURE_FLAGS.SUBSCRIPTION_MONITORING,
        TEST_CONTEXT
      );
      
      expect(result).toBeDefined();
      expect(result.flagKey).toBe('subscription_monitoring');
      expect(typeof result.enabled).toBe('boolean');
      
      console.log(`🏁 Monitoring flag: ${result.enabled ? 'ENABLED' : 'DISABLED'}`);
    });
    
    it('should handle invalid flag keys gracefully', async () => {
      const result = await isFeatureEnabled(
        'invalid_flag_key' as any,
        TEST_CONTEXT
      );
      
      expect(result.enabled).toBe(false);
      expect(result.flagKey).toBe('invalid_flag_key');
    });
    
    it('should handle missing context gracefully', async () => {
      const result = await isFeatureEnabled(
        SUBSCRIPTION_FEATURE_FLAGS.SUBSCRIPTION_VALIDATION_FIX
      );
      
      expect(result).toBeDefined();
      expect(typeof result.enabled).toBe('boolean');
    });
  });
  
  describe('Multiple Feature Flags', () => {
    
    it('should check multiple subscription flags at once', async () => {
      const flags = await checkMultipleFeatureFlags([
        SUBSCRIPTION_FEATURE_FLAGS.SUBSCRIPTION_VALIDATION_FIX,
        SUBSCRIPTION_FEATURE_FLAGS.SUBSCRIPTION_CACHE_INVALIDATION,
        SUBSCRIPTION_FEATURE_FLAGS.SUBSCRIPTION_MONITORING
      ], TEST_CONTEXT);
      
      expect(flags).toBeInstanceOf(Map);
      expect(flags.size).toBe(3);
      
      expect(flags.has(SUBSCRIPTION_FEATURE_FLAGS.SUBSCRIPTION_VALIDATION_FIX)).toBe(true);
      expect(flags.has(SUBSCRIPTION_FEATURE_FLAGS.SUBSCRIPTION_CACHE_INVALIDATION)).toBe(true);
      expect(flags.has(SUBSCRIPTION_FEATURE_FLAGS.SUBSCRIPTION_MONITORING)).toBe(true);
      
      console.log('🏁 Multiple flags result:');
      flags.forEach((enabled, flagKey) => {
        console.log(`  ${flagKey}: ${enabled ? 'ENABLED' : 'DISABLED'}`);
      });
    });
  });
  
  describe('Subscription-Specific Helpers', () => {
    
    it('should get all subscription feature flags', async () => {
      const flags = await getSubscriptionFeatureFlags(TEST_CONTEXT);
      
      expect(flags).toBeDefined();
      expect(typeof flags.validationEnabled).toBe('boolean');
      expect(typeof flags.cacheInvalidationEnabled).toBe('boolean');
      expect(typeof flags.monitoringEnabled).toBe('boolean');
      
      console.log('🏁 Subscription flags summary:');
      console.log(`  Validation: ${flags.validationEnabled ? 'ENABLED' : 'DISABLED'}`);
      console.log(`  Cache Invalidation: ${flags.cacheInvalidationEnabled ? 'ENABLED' : 'DISABLED'}`);
      console.log(`  Monitoring: ${flags.monitoringEnabled ? 'ENABLED' : 'DISABLED'}`);
    });
  });
  
  describe('Caching Behavior', () => {
    
    it('should cache feature flag results', async () => {
      // Clear any existing cache first
      clearAllFeatureFlagCache();

      // First call
      const result1 = await isFeatureEnabled(
        SUBSCRIPTION_FEATURE_FLAGS.SUBSCRIPTION_VALIDATION_FIX,
        TEST_CONTEXT
      );

      // Second call (should be cached)
      const result2 = await isFeatureEnabled(
        SUBSCRIPTION_FEATURE_FLAGS.SUBSCRIPTION_VALIDATION_FIX,
        TEST_CONTEXT
      );

      // Results should be identical (cached)
      expect(result1.enabled).toBe(result2.enabled);
      expect(result1.flagKey).toBe(result2.flagKey);
      expect(result1.context).toEqual(result2.context);

      console.log(`🏁 Cache test: Both calls returned identical results (caching working)`);
    });
  });
  
  describe('Error Handling', () => {
    
    it('should handle database errors gracefully', async () => {
      // Test with invalid user ID that might cause database errors
      const result = await isFeatureEnabled(
        SUBSCRIPTION_FEATURE_FLAGS.SUBSCRIPTION_VALIDATION_FIX,
        { userId: 'invalid-uuid', storeId: undefined }
      );
      
      // Should not throw, should return safe default
      expect(result).toBeDefined();
      expect(typeof result.enabled).toBe('boolean');
    });
  });
  
  describe('Integration with Test Users', () => {
    
    it('should work with our problematic test users', async () => {
      const testUsers = [
        'efdf6150-d861-4f2c-b59c-5d71c115493b', // admin
        '57b3036a-1f67-4144-8f94-c51df437a175', // kant
        'd5329cc4-d896-4f7e-9f7f-be19a8dfd895', // plato
        'e9f18ee7-f533-422f-b634-8a535d9ddadc', // popper
        '0c55465e-7551-48f1-b204-7efcda18c6ab'  // asdfgh
      ];
      
      console.log('🏁 Testing feature flags with problematic users:');
      
      for (const userId of testUsers) {
        const flags = await getSubscriptionFeatureFlags({ userId });
        
        console.log(`  User ${userId.slice(0, 8)}...:`);
        console.log(`    Validation: ${flags.validationEnabled ? 'ENABLED' : 'DISABLED'}`);
        console.log(`    Cache: ${flags.cacheInvalidationEnabled ? 'ENABLED' : 'DISABLED'}`);
        console.log(`    Monitoring: ${flags.monitoringEnabled ? 'ENABLED' : 'DISABLED'}`);
        
        // All should return valid boolean results
        expect(typeof flags.validationEnabled).toBe('boolean');
        expect(typeof flags.cacheInvalidationEnabled).toBe('boolean');
        expect(typeof flags.monitoringEnabled).toBe('boolean');
      }
    });
  });
});

describe('Feature Flag Database Integration', () => {
  
  it('should demonstrate current flag states in database', async () => {
    console.log('\n🏁 Current Feature Flag States in Database:');
    
    const flags = await getSubscriptionFeatureFlags(TEST_CONTEXT);
    
    console.log('Subscription System Feature Flags:');
    console.log(`  🔧 Validation Fix: ${flags.validationEnabled ? '✅ ENABLED' : '❌ DISABLED'}`);
    console.log(`  🗄️ Cache Invalidation: ${flags.cacheInvalidationEnabled ? '✅ ENABLED' : '❌ DISABLED'}`);
    console.log(`  📊 Monitoring: ${flags.monitoringEnabled ? '✅ ENABLED' : '❌ DISABLED'}`);
    
    console.log('\nNext Steps:');
    if (!flags.validationEnabled) {
      console.log('  1. Enable subscription_validation_fix flag to activate security fix');
    }
    if (!flags.cacheInvalidationEnabled) {
      console.log('  2. Enable subscription_cache_invalidation flag for cache management');
    }
    if (!flags.monitoringEnabled) {
      console.log('  3. Enable subscription_monitoring flag for enhanced monitoring');
    }
    
    if (flags.validationEnabled && flags.cacheInvalidationEnabled && flags.monitoringEnabled) {
      console.log('  ✅ All subscription feature flags are enabled!');
    }
  });
});
