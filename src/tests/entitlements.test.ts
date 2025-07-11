/**
 * Entitlements System Tests
 * 
 * Tests for the subscription entitlements system to debug data errors.
 */

import { describe, it, expect } from 'vitest';
import { calculateUserEntitlements } from '@/lib/entitlements/membership';

describe('Entitlements System', () => {
  describe('Data Access', () => {
    it('should get user entitlements without data destructuring errors', async () => {
      // Test with a known user ID from our test data
      const testUserId = 'efdf6150-d861-4f2c-b59c-5d71c115493b';
      
      try {
        const entitlements = await calculateUserEntitlements(testUserId);
        
        console.log('🏁 Entitlements result:', entitlements);
        
        // Should return an array of entitlements
        expect(Array.isArray(entitlements)).toBe(true);
        expect(entitlements.length).toBeGreaterThan(0);
        
      } catch (error) {
        console.error('❌ Entitlements error:', error);
        throw error;
      }
    });
    
    it('should handle non-existent user gracefully', async () => {
      const fakeUserId = '00000000-0000-0000-0000-000000000000';
      
      try {
        const entitlements = await calculateUserEntitlements(fakeUserId);
        
        console.log('🏁 Non-existent user entitlements:', entitlements);
        
        // Should still return basic entitlements
        expect(Array.isArray(entitlements)).toBe(true);
        
      } catch (error) {
        console.error('❌ Non-existent user error:', error);
        // This should not throw an error, but if it does, we need to fix it
        throw error;
      }
    });
  });
});
