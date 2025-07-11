/**
 * Validation Utilities Module
 *
 * Validation helpers, tier checking, subscription status utilities, and common
 * validation functions for the subscription system.
 *
 * Created: 2025-07-10
 * Part of: Phase 1B - validation.ts Refactoring
 */

import { supabase } from '@/lib/supabase';
import type { TIER_HIERARCHY } from '../types';

// =========================
// Tier Validation Utilities
// =========================

/**
 * Validates and normalizes a subscription tier
 */
export function validateTier(tier: string | null | undefined): 'MEMBER' | 'PRIVILEGED' | 'PRIVILEGED_PLUS' {
  if (!tier || typeof tier !== 'string') {
    return 'MEMBER';
  }

  const normalizedTier = tier.toUpperCase().trim();

  switch (normalizedTier) {
    case 'PRIVILEGED':
      return 'PRIVILEGED';
    case 'PRIVILEGED_PLUS':
    case 'PRIVILEGED PLUS':
    case 'PRIVILEGEDPLUS':
      return 'PRIVILEGED_PLUS';
    case 'MEMBER':
    default:
      return 'MEMBER';
  }
}

/**
 * Compares two subscription tiers
 */
export function compareTiers(
  tier1: string,
  tier2: string
): -1 | 0 | 1 {
  const { TIER_HIERARCHY } = require('../types');

  const normalizedTier1 = validateTier(tier1);
  const normalizedTier2 = validateTier(tier2);

  const level1 = TIER_HIERARCHY[normalizedTier1] || 1;
  const level2 = TIER_HIERARCHY[normalizedTier2] || 1;

  if (level1 < level2) return -1;
  if (level1 > level2) return 1;
  return 0;
}

/**
 * Checks if a tier has sufficient privileges for an operation
 */
export function hasSufficientTier(
  userTier: string,
  requiredTier: string
): boolean {
  return compareTiers(userTier, requiredTier) >= 0;
}

// =========================
// Subscription Status Utilities
// =========================

/**
 * Checks if a subscription is expired
 */
export function isSubscriptionExpired(expiryDate: string | null): boolean {
  if (!expiryDate) {
    return false; // No expiry date means no expiration
  }

  try {
    const expiry = new Date(expiryDate);
    const now = new Date();
    return expiry <= now;
  } catch (error) {
    console.warn('Invalid expiry date format:', expiryDate);
    return true; // Fail secure - treat invalid dates as expired
  }
}

/**
 * Calculates days until subscription expires
 */
export function getDaysUntilExpiry(expiryDate: string | null): number | null {
  if (!expiryDate) {
    return null;
  }

  try {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  } catch (error) {
    console.warn('Invalid expiry date format:', expiryDate);
    return 0; // Fail secure
  }
}

/**
 * Determines if a subscription is near expiry (within warning threshold)
 */
export function isNearExpiry(
  expiryDate: string | null,
  warningDays: number = 7
): boolean {
  const daysUntilExpiry = getDaysUntilExpiry(expiryDate);
  return daysUntilExpiry !== null && daysUntilExpiry <= warningDays && daysUntilExpiry > 0;
}

// =========================
// Quick Validation Functions
// =========================

/**
 * Quick check for active subscription (minimal database query)
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('is_active, end_date')
      .eq('user_id', userId)
      .eq('is_active', true)
      .gte('end_date', new Date().toISOString())
      .limit(1);

    if (error) {
      console.error('Active subscription check failed:', error);
      return false; // Fail secure
    }

    return (data && data.length > 0) || false;
  } catch (error) {
    console.error('Active subscription check failed:', error);
    return false; // Fail secure
  }
}

/**
 * Quick tier lookup for a user
 */
export async function getUserSubscriptionTier(userId: string): Promise<string> {
  try {
    // First check for active subscription tier
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('tier')
      .eq('user_id', userId)
      .eq('is_active', true)
      .gte('end_date', new Date().toISOString())
      .order('end_date', { ascending: false })
      .limit(1)
      .single();

    if (!subError && subscription?.tier) {
      return validateTier(subscription.tier);
    }

    // Fallback to membership tier from users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('membership_tier')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Subscription tier lookup failed:', userError);
      return 'MEMBER'; // Fail secure
    }

    return validateTier(user?.membership_tier || 'MEMBER');
  } catch (error) {
    console.error('Subscription tier lookup failed:', error);
    return 'MEMBER'; // Fail secure
  }
}

// =========================
// Validation Context Utilities
// =========================

/**
 * Creates a timeout promise for validation operations
 */
export function createTimeoutPromise(timeoutMs: number): Promise<never> {
  return new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Validation timeout after ${timeoutMs}ms`));
    }, timeoutMs);
  });
}

/**
 * Validates user ID format
 */
export function isValidUserId(userId: string): boolean {
  if (!userId || typeof userId !== 'string') {
    return false;
  }

  // Basic UUID format validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(userId);
}

/**
 * Sanitizes user input for validation
 */
export function sanitizeUserId(userId: any): string | null {
  if (!userId) {
    return null;
  }

  const sanitized = String(userId).trim();
  return isValidUserId(sanitized) ? sanitized : null;
}
