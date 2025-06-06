/**
 * Role Activity Tracking
 *
 * This module provides role activity tracking for backend operations,
 * monitoring permission usage and role-based actions.
 *
 * Implements requirements from Phase 2 Task 3: Backend Enforcement Logic
 */

import { supabase } from '../../supabase';
import { RoleActivityData } from './types';

/**
 * Track role activity for backend operations
 *
 * Records when users perform actions using specific roles/permissions
 * for auditing, analytics, and optimization purposes.
 */
export async function trackRoleActivity(
  userId: string,
  roleType: string,
  contextId?: string,
  contextType?: 'platform' | 'store' | 'club'
): Promise<void> {
  try {
    // Use the existing database function for role activity tracking
    await supabase.rpc('update_role_activity', {
      p_user_id: userId,
      p_role_type: roleType,
      p_context_id: contextId || '00000000-0000-0000-0000-000000000000',
      p_context_type: contextType
    });
  } catch (error) {
    console.error('Error tracking role activity:', error);
    // Don't throw - activity tracking should not break main functionality
  }
}

/**
 * Enhanced role activity tracking with detailed metadata
 *
 * Provides more comprehensive tracking for complex operations
 */
export async function trackDetailedRoleActivity(
  data: RoleActivityData
): Promise<void> {
  try {
    const {
      userId,
      roleType,
      action,
      contextId,
      contextType,
      metadata = {}
    } = data;

    // Enhanced tracking with action details
    await supabase
      .from('role_activity')
      .insert({
        user_id: userId,
        role_type: roleType,
        action_performed: action,
        context_id: contextId || '00000000-0000-0000-0000-000000000000',
        context_type: contextType,
        metadata: metadata,
        performed_at: new Date().toISOString()
      });

  } catch (error) {
    console.error('Error tracking detailed role activity:', error);
    // Fallback to basic tracking
    await trackRoleActivity(data.userId, data.roleType, data.contextId, data.contextType);
  }
}

/**
 * Track permission check events for performance monitoring
 *
 * Records permission check performance and cache hit rates
 */
export async function trackPermissionCheck(
  userId: string,
  permission: string,
  granted: boolean,
  checkDuration: number,
  cacheHit: boolean,
  contextId?: string
): Promise<void> {
  try {
    await trackDetailedRoleActivity({
      userId,
      roleType: 'PERMISSION_CHECK',
      action: 'CHECK_PERMISSION',
      contextId,
      metadata: {
        permission,
        granted,
        checkDuration,
        cacheHit,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('Error tracking permission check:', error);
  }
}

/**
 * Track membership limit enforcement events
 *
 * Records when membership limits are checked and enforced
 */
export async function trackMembershipLimitCheck(
  userId: string,
  limitType: string,
  allowed: boolean,
  reason?: string,
  contextId?: string
): Promise<void> {
  try {
    await trackDetailedRoleActivity({
      userId,
      roleType: 'MEMBERSHIP_LIMIT',
      action: 'CHECK_LIMIT',
      contextId,
      metadata: {
        limitType,
        allowed,
        reason,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('Error tracking membership limit check:', error);
  }
}

/**
 * Track API middleware enforcement events
 *
 * Records when API middleware blocks or allows requests
 */
export async function trackMiddlewareEnforcement(
  userId: string,
  endpoint: string,
  method: string,
  allowed: boolean,
  requiredPermission?: string,
  contextId?: string
): Promise<void> {
  try {
    await trackDetailedRoleActivity({
      userId,
      roleType: 'API_MIDDLEWARE',
      action: 'ENFORCE_PERMISSION',
      contextId,
      metadata: {
        endpoint,
        method,
        allowed,
        requiredPermission,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('Error tracking middleware enforcement:', error);
  }
}

/**
 * Get role activity statistics for a user
 *
 * Provides insights into user's role usage patterns
 */
export async function getUserRoleActivityStats(
  userId: string,
  timeRange: 'day' | 'week' | 'month' = 'week'
): Promise<any> {
  try {
    const timeRangeHours = {
      day: 24,
      week: 168,
      month: 720
    };

    const hoursAgo = timeRangeHours[timeRange];
    const startTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('role_activity')
      .select('role_type, action_performed, context_type, performed_at')
      .eq('user_id', userId)
      .gte('performed_at', startTime)
      .order('performed_at', { ascending: false });

    if (error) throw error;

    // Aggregate statistics
    const stats = {
      totalActions: data.length,
      roleUsage: {} as Record<string, number>,
      contextUsage: {} as Record<string, number>,
      actionTypes: {} as Record<string, number>,
      timeRange
    };

    data.forEach(activity => {
      // Count role usage
      stats.roleUsage[activity.role_type] = (stats.roleUsage[activity.role_type] || 0) + 1;

      // Count context usage
      if (activity.context_type) {
        stats.contextUsage[activity.context_type] = (stats.contextUsage[activity.context_type] || 0) + 1;
      }

      // Count action types
      if (activity.action_performed) {
        stats.actionTypes[activity.action_performed] = (stats.actionTypes[activity.action_performed] || 0) + 1;
      }
    });

    return stats;
  } catch (error) {
    console.error('Error getting user role activity stats:', error);
    return {
      totalActions: 0,
      roleUsage: {},
      contextUsage: {},
      actionTypes: {},
      timeRange,
      error: 'Failed to retrieve statistics'
    };
  }
}

/**
 * Get system-wide role activity metrics
 *
 * Provides platform-level insights for optimization
 */
export async function getSystemRoleActivityMetrics(
  timeRange: 'day' | 'week' | 'month' = 'day'
): Promise<any> {
  try {
    const timeRangeHours = {
      day: 24,
      week: 168,
      month: 720
    };

    const hoursAgo = timeRangeHours[timeRange];
    const startTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('role_activity')
      .select('role_type, action_performed, context_type, metadata')
      .gte('performed_at', startTime);

    if (error) throw error;

    // Aggregate system metrics
    const metrics = {
      totalActivities: data.length,
      uniqueUsers: new Set(data.map(a => a.user_id)).size,
      mostUsedRoles: {} as Record<string, number>,
      mostUsedContexts: {} as Record<string, number>,
      permissionCheckMetrics: {
        totalChecks: 0,
        averageDuration: 0,
        cacheHitRate: 0
      },
      timeRange
    };

    let totalDuration = 0;
    let totalCacheHits = 0;
    let permissionChecks = 0;

    data.forEach(activity => {
      // Count role usage
      metrics.mostUsedRoles[activity.role_type] = (metrics.mostUsedRoles[activity.role_type] || 0) + 1;

      // Count context usage
      if (activity.context_type) {
        metrics.mostUsedContexts[activity.context_type] = (metrics.mostUsedContexts[activity.context_type] || 0) + 1;
      }

      // Aggregate permission check metrics
      if (activity.role_type === 'PERMISSION_CHECK' && activity.metadata) {
        permissionChecks++;
        if (activity.metadata.checkDuration) {
          totalDuration += activity.metadata.checkDuration;
        }
        if (activity.metadata.cacheHit) {
          totalCacheHits++;
        }
      }
    });

    // Calculate permission check metrics
    if (permissionChecks > 0) {
      metrics.permissionCheckMetrics = {
        totalChecks: permissionChecks,
        averageDuration: totalDuration / permissionChecks,
        cacheHitRate: (totalCacheHits / permissionChecks) * 100
      };
    }

    return metrics;
  } catch (error) {
    console.error('Error getting system role activity metrics:', error);
    return {
      totalActivities: 0,
      uniqueUsers: 0,
      mostUsedRoles: {},
      mostUsedContexts: {},
      permissionCheckMetrics: {
        totalChecks: 0,
        averageDuration: 0,
        cacheHitRate: 0
      },
      timeRange,
      error: 'Failed to retrieve metrics'
    };
  }
}

/**
 * Clean up old role activity records
 *
 * Maintains database performance by removing old tracking data
 */
export async function cleanupOldRoleActivity(
  retentionDays: number = 90
): Promise<void> {
  try {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from('role_activity')
      .delete()
      .lt('performed_at', cutoffDate);

    if (error) throw error;

    console.log(`Cleaned up role activity records older than ${retentionDays} days`);
  } catch (error) {
    console.error('Error cleaning up old role activity:', error);
  }
}
