/**
 * Subscription Utilities
 * 
 * Utility functions for handling subscription expiration calculations,
 * formatting, and status determination for admin user management.
 * 
 * Created: 2025-01-16
 * Part of: Admin User Management Enhancement
 */

import { differenceInDays, differenceInMonths, differenceInWeeks, isPast, isToday } from 'date-fns';

export interface SubscriptionStatus {
  status: 'active' | 'expiring_soon' | 'expired' | 'no_subscription';
  daysRemaining: number;
  formattedTimeRemaining: string;
  colorClass: string;
  bgColorClass: string;
  iconClass: string;
}

/**
 * Calculate subscription status and time remaining
 */
export function calculateSubscriptionStatus(
  endDate: string | Date | null,
  membershipTier: string
): SubscriptionStatus {
  // Handle users without paid subscriptions
  if (!endDate || membershipTier === 'MEMBER') {
    return {
      status: 'no_subscription',
      daysRemaining: 0,
      formattedTimeRemaining: 'No active subscription',
      colorClass: 'text-gray-600',
      bgColorClass: 'bg-gray-100',
      iconClass: 'text-gray-500'
    };
  }

  const expirationDate = new Date(endDate);
  const now = new Date();
  const daysRemaining = differenceInDays(expirationDate, now);

  // Determine status based on days remaining
  let status: SubscriptionStatus['status'];
  let colorClass: string;
  let bgColorClass: string;
  let iconClass: string;

  if (isPast(expirationDate) && !isToday(expirationDate)) {
    // Expired
    status = 'expired';
    colorClass = 'text-red-700';
    bgColorClass = 'bg-red-100 border-red-200';
    iconClass = 'text-red-600';
  } else if (daysRemaining <= 7) {
    // Expiring soon (within 7 days)
    status = 'expiring_soon';
    colorClass = 'text-amber-700';
    bgColorClass = 'bg-amber-100 border-amber-200';
    iconClass = 'text-amber-600';
  } else {
    // Active with time remaining
    status = 'active';
    colorClass = 'text-green-700';
    bgColorClass = 'bg-green-100 border-green-200';
    iconClass = 'text-green-600';
  }

  return {
    status,
    daysRemaining,
    formattedTimeRemaining: formatTimeRemaining(daysRemaining, expirationDate),
    colorClass,
    bgColorClass,
    iconClass
  };
}

/**
 * Format time remaining in a user-friendly way
 */
function formatTimeRemaining(daysRemaining: number, expirationDate: Date): string {
  const now = new Date();

  if (isPast(expirationDate) && !isToday(expirationDate)) {
    // Expired
    const daysExpired = Math.abs(daysRemaining);
    if (daysExpired === 1) {
      return 'Expired 1 day ago';
    } else if (daysExpired < 30) {
      return `Expired ${daysExpired} days ago`;
    } else {
      const monthsExpired = differenceInMonths(now, expirationDate);
      return monthsExpired === 1 ? 'Expired 1 month ago' : `Expired ${monthsExpired} months ago`;
    }
  }

  if (isToday(expirationDate)) {
    return 'Expires today';
  }

  // Active subscription
  if (daysRemaining === 1) {
    return 'Expires tomorrow';
  } else if (daysRemaining < 7) {
    return `${daysRemaining} days remaining`;
  } else if (daysRemaining < 30) {
    const weeksRemaining = differenceInWeeks(expirationDate, now);
    if (weeksRemaining === 1) {
      return '1 week remaining';
    } else if (weeksRemaining > 1) {
      return `${weeksRemaining} weeks remaining`;
    } else {
      return `${daysRemaining} days remaining`;
    }
  } else {
    const monthsRemaining = differenceInMonths(expirationDate, now);
    if (monthsRemaining === 1) {
      return '1 month remaining';
    } else if (monthsRemaining > 1) {
      return `${monthsRemaining} months remaining`;
    } else {
      return `${daysRemaining} days remaining`;
    }
  }
}

/**
 * Get subscription priority for sorting (higher number = higher priority)
 */
export function getSubscriptionPriority(status: SubscriptionStatus['status']): number {
  switch (status) {
    case 'expired':
      return 4; // Highest priority
    case 'expiring_soon':
      return 3;
    case 'active':
      return 2;
    case 'no_subscription':
      return 1; // Lowest priority
    default:
      return 0;
  }
}

/**
 * Check if subscription status requires attention
 */
export function requiresAttention(status: SubscriptionStatus['status']): boolean {
  return status === 'expired' || status === 'expiring_soon';
}

/**
 * Get appropriate action text for subscription status
 */
export function getActionText(status: SubscriptionStatus['status']): string {
  switch (status) {
    case 'expired':
      return 'Renew subscription';
    case 'expiring_soon':
      return 'Extend subscription';
    case 'active':
      return 'Manage subscription';
    case 'no_subscription':
      return 'Add subscription';
    default:
      return 'Manage subscription';
  }
}
