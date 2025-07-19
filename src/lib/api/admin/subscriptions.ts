/**
 * Admin Subscription Management API
 * 
 * Provides store owners with comprehensive subscription system monitoring and management
 * capabilities. Built on reliable database infrastructure with graceful error handling.
 * 
 * Created: 2025-01-16
 * Part of: Admin Dashboard Implementation - Phase 1
 */

import { supabase } from '@/lib/supabase';

// =========================
// Type Definitions
// =========================

export interface SubscriptionOverview {
  // Core subscription metrics
  activeSubscriptions: number;
  expiredSubscriptions: number;
  totalUsers: number;
  
  // User tier distribution
  privilegedUsers: number;
  privilegedPlusUsers: number;
  memberUsers: number;
  
  // Critical health indicators
  usersWithInvalidEntitlements: number;
  
  // Recent activity (24h)
  subscriptionsCreated24h: number;
  subscriptionsExpired24h: number;
  
  // System health
  lastHealthCheckStatus: string | null;
  lastHealthCheckTime: string | null;
  
  // Metadata
  lastUpdated: string;
  dataSource: 'subscription_dashboard' | 'fallback_queries';
}

export interface ProblematicUser {
  userId: string;
  username: string | null;
  email: string | null;
  membershipTier: string;
  hasActiveSubscription: boolean;
  lastSubscriptionEnd: string | null;
  issueDescription: string;
  actionRequired: 'downgrade_tier' | 'verify_subscription' | 'contact_user' | 'manual_review';
  severity: 'critical' | 'warning' | 'info';
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  score: number; // 0-100
  issues: string[];
  recommendations: string[];
  lastChecked: string;
  criticalIssueCount: number;
  warningIssueCount: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  timestamp: string;
  source: string;
}

// =========================
// Core API Functions
// =========================

/**
 * Get comprehensive subscription system overview
 * Primary data source: subscription_dashboard view
 */
export async function getSubscriptionOverview(): Promise<ApiResponse<SubscriptionOverview>> {
  try {
    console.log('[Admin API] Fetching subscription overview...');
    
    // Try primary data source: subscription_dashboard view
    const { data, error } = await supabase
      .from('subscription_dashboard')
      .select('*')
      .single();

    if (error) {
      console.warn('[Admin API] subscription_dashboard view failed:', error.message);
      // Fallback to manual queries
      return await getSubscriptionOverviewFallback();
    }

    if (!data) {
      throw new Error('No data returned from subscription_dashboard view');
    }

    // Calculate member users (total - privileged - privileged_plus)
    const memberUsers = Math.max(0, 
      (data.privileged_users || 0) + (data.privileged_plus_users || 0) > 0 
        ? data.privileged_users + data.privileged_plus_users 
        : 0
    );

    const overview: SubscriptionOverview = {
      activeSubscriptions: data.active_subscriptions || 0,
      expiredSubscriptions: data.expired_subscriptions || 0,
      totalUsers: data.privileged_users + data.privileged_plus_users + memberUsers,
      privilegedUsers: data.privileged_users || 0,
      privilegedPlusUsers: data.privileged_plus_users || 0,
      memberUsers: memberUsers,
      usersWithInvalidEntitlements: data.users_with_invalid_entitlements || 0,
      subscriptionsCreated24h: data.subscriptions_created_24h || 0,
      subscriptionsExpired24h: data.subscriptions_expired_24h || 0,
      lastHealthCheckStatus: data.last_health_check_status,
      lastHealthCheckTime: data.last_health_check_time,
      lastUpdated: new Date().toISOString(),
      dataSource: 'subscription_dashboard'
    };

    console.log('[Admin API] Subscription overview retrieved successfully');
    return {
      success: true,
      data: overview,
      error: null,
      timestamp: new Date().toISOString(),
      source: 'subscription_dashboard'
    };

  } catch (error) {
    console.error('[Admin API] Error fetching subscription overview:', error);
    
    // Attempt fallback approach
    return await getSubscriptionOverviewFallback();
  }
}

/**
 * Fallback method for subscription overview using direct table queries
 */
async function getSubscriptionOverviewFallback(): Promise<ApiResponse<SubscriptionOverview>> {
  try {
    console.log('[Admin API] Using fallback queries for subscription overview...');
    
    // Get basic user counts by tier
    const { data: userCounts, error: userError } = await supabase
      .from('users')
      .select('membership_tier')
      .not('membership_tier', 'is', null);

    if (userError) {
      throw new Error(`Failed to fetch user data: ${userError.message}`);
    }

    // Calculate tier distribution
    const tierCounts = (userCounts || []).reduce((acc, user) => {
      const tier = user.membership_tier || 'MEMBER';
      acc[tier] = (acc[tier] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get subscription counts
    const { data: subscriptions, error: subError } = await supabase
      .from('user_subscriptions')
      .select('is_active, end_date');

    if (subError) {
      console.warn('[Admin API] Failed to fetch subscription data:', subError.message);
    }

    const now = new Date();
    const activeSubscriptions = (subscriptions || []).filter(
      sub => sub.is_active && new Date(sub.end_date) > now
    ).length;
    
    const expiredSubscriptions = (subscriptions || []).filter(
      sub => sub.is_active && new Date(sub.end_date) <= now
    ).length;

    // Estimate problematic users (users with premium tiers but no active subscription)
    const privilegedUsers = tierCounts['PRIVILEGED'] || 0;
    const privilegedPlusUsers = tierCounts['PRIVILEGED_PLUS'] || 0;
    const memberUsers = tierCounts['MEMBER'] || 0;
    const totalUsers = privilegedUsers + privilegedPlusUsers + memberUsers;
    
    // Rough estimate of invalid entitlements
    const estimatedInvalidEntitlements = Math.max(0, (privilegedUsers + privilegedPlusUsers) - activeSubscriptions);

    const overview: SubscriptionOverview = {
      activeSubscriptions,
      expiredSubscriptions,
      totalUsers,
      privilegedUsers,
      privilegedPlusUsers,
      memberUsers,
      usersWithInvalidEntitlements: estimatedInvalidEntitlements,
      subscriptionsCreated24h: 0, // Not available in fallback
      subscriptionsExpired24h: 0, // Not available in fallback
      lastHealthCheckStatus: null,
      lastHealthCheckTime: null,
      lastUpdated: new Date().toISOString(),
      dataSource: 'fallback_queries'
    };

    console.log('[Admin API] Fallback subscription overview completed');
    return {
      success: true,
      data: overview,
      error: 'Using fallback data - some metrics may be estimates',
      timestamp: new Date().toISOString(),
      source: 'fallback_queries'
    };

  } catch (error) {
    console.error('[Admin API] Fallback queries also failed:', error);
    
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString(),
      source: 'error_fallback'
    };
  }
}

/**
 * Get list of users with subscription/tier mismatches
 */
export async function getProblematicUsers(): Promise<ApiResponse<ProblematicUser[]>> {
  try {
    console.log('[Admin API] Fetching problematic users...');
    
    // Query users with premium tiers
    const { data: premiumUsers, error: userError } = await supabase
      .from('users')
      .select('id, username, email, membership_tier')
      .in('membership_tier', ['PRIVILEGED', 'PRIVILEGED_PLUS']);

    if (userError) {
      throw new Error(`Failed to fetch premium users: ${userError.message}`);
    }

    if (!premiumUsers || premiumUsers.length === 0) {
      return {
        success: true,
        data: [],
        error: null,
        timestamp: new Date().toISOString(),
        source: 'direct_query'
      };
    }

    // Get their subscription status
    const userIds = premiumUsers.map(user => user.id);
    const { data: subscriptions, error: subError } = await supabase
      .from('user_subscriptions')
      .select('user_id, is_active, end_date, tier')
      .in('user_id', userIds)
      .eq('is_active', true);

    if (subError) {
      console.warn('[Admin API] Failed to fetch subscriptions:', subError.message);
    }

    // Create subscription lookup
    const now = new Date();
    const activeSubscriptions = new Map();
    
    (subscriptions || []).forEach(sub => {
      if (new Date(sub.end_date) > now) {
        activeSubscriptions.set(sub.user_id, sub);
      }
    });

    // Identify problematic users
    const problematicUsers: ProblematicUser[] = premiumUsers
      .filter(user => !activeSubscriptions.has(user.id))
      .map(user => ({
        userId: user.id,
        username: user.username,
        email: user.email,
        membershipTier: user.membership_tier,
        hasActiveSubscription: false,
        lastSubscriptionEnd: null, // Would need additional query for this
        issueDescription: `User has ${user.membership_tier} tier but no active subscription`,
        actionRequired: 'downgrade_tier' as const,
        severity: 'critical' as const
      }));

    console.log(`[Admin API] Found ${problematicUsers.length} problematic users`);
    
    return {
      success: true,
      data: problematicUsers,
      error: null,
      timestamp: new Date().toISOString(),
      source: 'direct_query'
    };

  } catch (error) {
    console.error('[Admin API] Error fetching problematic users:', error);
    
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString(),
      source: 'error'
    };
  }
}

/**
 * Get system health status
 */
export async function getSystemHealth(): Promise<ApiResponse<SystemHealth>> {
  try {
    console.log('[Admin API] Checking system health...');
    
    // Get basic metrics for health assessment
    const overviewResponse = await getSubscriptionOverview();
    
    if (!overviewResponse.success || !overviewResponse.data) {
      throw new Error('Unable to fetch subscription overview for health check');
    }

    const overview = overviewResponse.data;
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check for critical issues
    if (overview.usersWithInvalidEntitlements > 0) {
      issues.push(`${overview.usersWithInvalidEntitlements} users have invalid entitlements`);
      recommendations.push('Run batch entitlement validation to fix user tier mismatches');
      score -= Math.min(50, overview.usersWithInvalidEntitlements * 10);
    }

    // Check for expired subscriptions
    if (overview.expiredSubscriptions > 0) {
      issues.push(`${overview.expiredSubscriptions} expired subscriptions need processing`);
      recommendations.push('Process expired subscriptions to clean up system state');
      score -= Math.min(30, overview.expiredSubscriptions * 5);
    }

    // Check data source reliability
    if (overview.dataSource === 'fallback_queries') {
      issues.push('Using fallback data source - some advanced features unavailable');
      recommendations.push('Investigate database function dependencies for full functionality');
      score -= 20;
    }

    // Determine overall status
    let status: SystemHealth['status'];
    if (score >= 90) status = 'healthy';
    else if (score >= 70) status = 'warning';
    else if (score >= 50) status = 'critical';
    else status = 'critical';

    const health: SystemHealth = {
      status,
      score: Math.max(0, score),
      issues,
      recommendations,
      lastChecked: new Date().toISOString(),
      criticalIssueCount: issues.filter(issue => 
        issue.includes('invalid entitlements') || issue.includes('critical')
      ).length,
      warningIssueCount: issues.length - issues.filter(issue => 
        issue.includes('invalid entitlements') || issue.includes('critical')
      ).length
    };

    console.log(`[Admin API] System health: ${status} (score: ${score})`);
    
    return {
      success: true,
      data: health,
      error: null,
      timestamp: new Date().toISOString(),
      source: 'health_check'
    };

  } catch (error) {
    console.error('[Admin API] Error checking system health:', error);
    
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Health check failed',
      timestamp: new Date().toISOString(),
      source: 'error'
    };
  }
}
