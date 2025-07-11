/**
 * Subscription Components Index
 * 
 * Centralized exports for all subscription-aware UI components
 */

// Main subscription components
export { SubscriptionStatus, CompactSubscriptionStatus } from './SubscriptionStatus';
export { 
  PremiumFeatureGate, 
  PremiumClubCreation, 
  PremiumContentAccess, 
  ExclusiveFeatureAccess 
} from './PremiumFeatureGate';
export { 
  SubscriptionUpgradePrompt, 
  PrivilegedUpgradePrompt, 
  PrivilegedPlusUpgradePrompt 
} from './SubscriptionUpgradePrompt';
export { 
  FeatureAvailabilityIndicator,
  ClubCreationIndicator,
  PremiumContentIndicator,
  ExclusiveContentIndicator,
  DirectMessagingIndicator
} from './FeatureAvailabilityIndicator';

// Re-export types if needed
export type { SubscriptionStatus as SubscriptionStatusType } from '@/lib/api/subscriptions/types';
