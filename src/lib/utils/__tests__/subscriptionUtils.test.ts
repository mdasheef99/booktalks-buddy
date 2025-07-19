/**
 * Tests for subscription utilities
 * 
 * Tests subscription status calculation, formatting, and utility functions
 * for admin user management subscription features.
 */

import { 
  calculateSubscriptionStatus, 
  getSubscriptionPriority, 
  requiresAttention, 
  getActionText 
} from '../subscriptionUtils';

describe('subscriptionUtils', () => {
  const mockNow = new Date('2025-01-16T12:00:00Z');
  
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(mockNow);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe('calculateSubscriptionStatus', () => {
    it('should return no_subscription status for MEMBER tier', () => {
      const result = calculateSubscriptionStatus(null, 'MEMBER');
      
      expect(result.status).toBe('no_subscription');
      expect(result.formattedTimeRemaining).toBe('No active subscription');
      expect(result.colorClass).toBe('text-gray-600');
    });

    it('should return no_subscription status when no end date provided', () => {
      const result = calculateSubscriptionStatus(null, 'PRIVILEGED');
      
      expect(result.status).toBe('no_subscription');
      expect(result.formattedTimeRemaining).toBe('No active subscription');
    });

    it('should return expired status for past dates', () => {
      const expiredDate = new Date('2025-01-10T12:00:00Z'); // 6 days ago
      const result = calculateSubscriptionStatus(expiredDate, 'PRIVILEGED');
      
      expect(result.status).toBe('expired');
      expect(result.formattedTimeRemaining).toBe('Expired 6 days ago');
      expect(result.colorClass).toBe('text-red-700');
      expect(result.daysRemaining).toBe(-6);
    });

    it('should return expiring_soon status for dates within 7 days', () => {
      const soonDate = new Date('2025-01-20T12:00:00Z'); // 4 days from now
      const result = calculateSubscriptionStatus(soonDate, 'PRIVILEGED');
      
      expect(result.status).toBe('expiring_soon');
      expect(result.formattedTimeRemaining).toBe('4 days remaining');
      expect(result.colorClass).toBe('text-amber-700');
      expect(result.daysRemaining).toBe(4);
    });

    it('should return active status for dates more than 7 days away', () => {
      const futureDate = new Date('2025-02-16T12:00:00Z'); // 31 days from now
      const result = calculateSubscriptionStatus(futureDate, 'PRIVILEGED');
      
      expect(result.status).toBe('active');
      expect(result.formattedTimeRemaining).toBe('1 month remaining');
      expect(result.colorClass).toBe('text-green-700');
      expect(result.daysRemaining).toBe(31);
    });

    it('should handle today expiration', () => {
      const todayDate = new Date('2025-01-16T12:00:00Z'); // Today
      const result = calculateSubscriptionStatus(todayDate, 'PRIVILEGED');
      
      expect(result.status).toBe('expiring_soon');
      expect(result.formattedTimeRemaining).toBe('Expires today');
    });

    it('should handle tomorrow expiration', () => {
      const tomorrowDate = new Date('2025-01-17T12:00:00Z'); // Tomorrow
      const result = calculateSubscriptionStatus(tomorrowDate, 'PRIVILEGED');
      
      expect(result.status).toBe('expiring_soon');
      expect(result.formattedTimeRemaining).toBe('Expires tomorrow');
    });

    it('should format weeks correctly', () => {
      const twoWeeksDate = new Date('2025-01-30T12:00:00Z'); // 14 days from now
      const result = calculateSubscriptionStatus(twoWeeksDate, 'PRIVILEGED');
      
      expect(result.status).toBe('active');
      expect(result.formattedTimeRemaining).toBe('2 weeks remaining');
    });

    it('should format months correctly for expired subscriptions', () => {
      const twoMonthsAgo = new Date('2024-11-16T12:00:00Z'); // 2 months ago
      const result = calculateSubscriptionStatus(twoMonthsAgo, 'PRIVILEGED');
      
      expect(result.status).toBe('expired');
      expect(result.formattedTimeRemaining).toBe('Expired 2 months ago');
    });
  });

  describe('getSubscriptionPriority', () => {
    it('should return correct priorities', () => {
      expect(getSubscriptionPriority('expired')).toBe(4);
      expect(getSubscriptionPriority('expiring_soon')).toBe(3);
      expect(getSubscriptionPriority('active')).toBe(2);
      expect(getSubscriptionPriority('no_subscription')).toBe(1);
    });
  });

  describe('requiresAttention', () => {
    it('should return true for expired and expiring_soon', () => {
      expect(requiresAttention('expired')).toBe(true);
      expect(requiresAttention('expiring_soon')).toBe(true);
    });

    it('should return false for active and no_subscription', () => {
      expect(requiresAttention('active')).toBe(false);
      expect(requiresAttention('no_subscription')).toBe(false);
    });
  });

  describe('getActionText', () => {
    it('should return appropriate action text', () => {
      expect(getActionText('expired')).toBe('Renew subscription');
      expect(getActionText('expiring_soon')).toBe('Extend subscription');
      expect(getActionText('active')).toBe('Manage subscription');
      expect(getActionText('no_subscription')).toBe('Add subscription');
    });
  });

  describe('edge cases', () => {
    it('should handle string dates', () => {
      const result = calculateSubscriptionStatus('2025-01-20T12:00:00Z', 'PRIVILEGED');
      expect(result.status).toBe('expiring_soon');
      expect(result.daysRemaining).toBe(4);
    });

    it('should handle PRIVILEGED_PLUS tier', () => {
      const futureDate = new Date('2025-02-16T12:00:00Z');
      const result = calculateSubscriptionStatus(futureDate, 'PRIVILEGED_PLUS');
      
      expect(result.status).toBe('active');
      expect(result.formattedTimeRemaining).toBe('1 month remaining');
    });

    it('should handle invalid dates gracefully', () => {
      const result = calculateSubscriptionStatus('invalid-date', 'PRIVILEGED');
      expect(result.status).toBe('no_subscription');
    });
  });
});
