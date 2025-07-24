/**
 * Account Management Service
 * 
 * Core service for user account deletion, suspension, and management operations.
 * Integrates with existing moderation system and provides comprehensive audit trails.
 * 
 * Created: 2025-01-17
 * Part of: Phase 2 - Core Account Management APIs
 */

import { supabase } from '@/lib/supabase';
import { getUserProfile } from '@/services/profileService';
import { invalidateUserCache, invalidateOnSubscriptionEvent } from '@/lib/api/subscriptions/cache';
import { invalidateUserEntitlements } from '@/lib/entitlements/cache/enhanced';
import type {
  ReportSeverity,
  ModerationActionType,
  CreateModerationActionData
} from '@/types/reporting';

// =========================
// Types and Interfaces
// =========================

export interface AccountStatus {
  account_status: 'active' | 'suspended' | 'deleted' | null;
  status_changed_by?: string;
  status_changed_at?: string;
  deleted_at?: string;
  deleted_by?: string;
}

export interface SuspensionOptions {
  reason: string;
  severity: ReportSeverity;
  duration_hours?: number; // null for permanent
  notify_user?: boolean;
  club_id?: string; // for club-specific suspensions
}

export interface ClubSuspensionOptions {
  reason: string;
  duration_hours?: number;
  escalate_if_threshold?: boolean; // Check for 3+ club suspensions
}

export interface DeletionOptions {
  reason: string;
  type: 'soft' | 'hard';
  backup_data?: boolean;
}

export interface ClubSuspension {
  id: string;
  user_id: string;
  club_id: string;
  suspended_by: string;
  reason: string;
  suspended_at: string;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CleanupResult {
  tables_affected: string[];
  records_deleted: number;
  records_anonymized: number;
  errors: string[];
}

// =========================
// Core Account Management Functions
// =========================

/**
 * Create moderation action for audit trail
 */
export async function createModerationAction(
  actionData: CreateModerationActionData,
  moderatorId: string
): Promise<void> {
  try {
    // Get moderator profile for audit trail
    const moderatorProfile = await getUserProfile(moderatorId);
    if (!moderatorProfile?.username) {
      throw new Error('Moderator must have a valid username');
    }

    // Calculate expiration if duration is provided
    let expires_at = null;
    if (actionData.duration_hours) {
      const expirationDate = new Date();
      expirationDate.setHours(expirationDate.getHours() + actionData.duration_hours);
      expires_at = expirationDate.toISOString();
    }

    const { error } = await supabase
      .from('moderation_actions')
      .insert({
        action_type: actionData.action_type,
        target_type: actionData.target_type,
        target_id: actionData.target_id,
        target_user_id: actionData.target_user_id || null,
        moderator_id: moderatorId,
        moderator_username: moderatorProfile.username,
        moderator_role: 'admin', // TODO: Get actual role from entitlements
        reason: actionData.reason,
        severity: actionData.severity,
        duration_hours: actionData.duration_hours || null,
        expires_at,
        club_id: actionData.club_id || null,
        related_report_id: actionData.related_report_id || null,
        status: 'active'
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error creating moderation action:', error);
    throw new Error('Failed to create moderation action');
  }
}

/**
 * Suspend user account (platform-wide)
 */
export async function suspendUser(
  adminId: string,
  userId: string,
  options: SuspensionOptions
): Promise<void> {
  try {
    // Validate admin permissions (basic check - full validation in middleware)
    if (adminId === userId) {
      throw new Error('Cannot suspend your own account');
    }

    // Calculate expiration if duration is provided
    let expires_at = null;
    if (options.duration_hours) {
      const expirationDate = new Date();
      expirationDate.setHours(expirationDate.getHours() + options.duration_hours);
      expires_at = expirationDate.toISOString();
    }

    // Update user account status
    const { error: updateError } = await supabase
      .from('users')
      .update({
        account_status: 'suspended',
        status_changed_by: adminId,
        status_changed_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    // Create moderation action for audit trail
    await createModerationAction({
      action_type: 'user_suspension',
      target_type: 'user',
      target_id: userId,
      target_user_id: userId,
      reason: options.reason,
      severity: options.severity,
      duration_hours: options.duration_hours,
      club_id: options.club_id
    }, adminId);

    // Invalidate user caches
    await invalidateUserCache(userId);
    await invalidateOnSubscriptionEvent(userId, 'subscription_expired');

    console.log(`User ${userId} suspended by ${adminId}`);
  } catch (error) {
    console.error('Error suspending user:', error);
    throw new Error('Failed to suspend user account');
  }
}

/**
 * Suspend user from specific club
 */
export async function suspendFromClub(
  adminId: string,
  userId: string,
  clubId: string,
  options: ClubSuspensionOptions
): Promise<void> {
  try {
    // Calculate expiration if duration is provided
    let expires_at = null;
    if (options.duration_hours) {
      const expirationDate = new Date();
      expirationDate.setHours(expirationDate.getHours() + options.duration_hours);
      expires_at = expirationDate.toISOString();
    }

    // Create or update club suspension
    const { error: suspensionError } = await supabase
      .from('club_suspensions')
      .upsert({
        user_id: userId,
        club_id: clubId,
        suspended_by: adminId,
        reason: options.reason,
        expires_at,
        is_active: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,club_id'
      });

    if (suspensionError) throw suspensionError;

    // Create moderation action for audit trail
    await createModerationAction({
      action_type: 'club_restriction',
      target_type: 'user',
      target_id: userId,
      target_user_id: userId,
      reason: options.reason,
      severity: 'medium', // Default severity for club suspensions
      duration_hours: options.duration_hours,
      club_id: clubId
    }, adminId);

    // Check for escalation if enabled
    if (options.escalate_if_threshold) {
      await checkSuspensionEscalation(adminId, userId);
    }

    console.log(`User ${userId} suspended from club ${clubId} by ${adminId}`);
  } catch (error) {
    console.error('Error suspending user from club:', error);
    throw new Error('Failed to suspend user from club');
  }
}

/**
 * Check if user should be escalated to platform suspension (3+ club suspensions)
 */
async function checkSuspensionEscalation(adminId: string, userId: string): Promise<void> {
  try {
    // Count active club suspensions
    const { data: suspensions, error } = await supabase
      .from('club_suspensions')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) throw error;

    // Escalate if 3 or more active club suspensions
    if (suspensions && suspensions.length >= 3) {
      await suspendUser(adminId, userId, {
        reason: `Automatic escalation: ${suspensions.length} active club suspensions`,
        severity: 'high',
        duration_hours: 168 // 7 days default
      });

      console.log(`User ${userId} escalated to platform suspension (${suspensions.length} club suspensions)`);
    }
  } catch (error) {
    console.error('Error checking suspension escalation:', error);
    // Don't throw - escalation failure shouldn't block club suspension
  }
}

/**
 * Activate user account (remove suspension)
 */
export async function activateUser(
  adminId: string,
  userId: string,
  reason: string
): Promise<void> {
  try {
    // Update user account status
    const { error: updateError } = await supabase
      .from('users')
      .update({
        account_status: 'active',
        status_changed_by: adminId,
        status_changed_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    // Revoke related moderation actions
    const { error: revokeError } = await supabase
      .from('moderation_actions')
      .update({
        status: 'revoked',
        revoked_by: adminId,
        revoked_at: new Date().toISOString(),
        revoked_reason: reason
      })
      .eq('target_user_id', userId)
      .eq('action_type', 'user_suspension')
      .eq('status', 'active');

    if (revokeError) throw revokeError;

    // Invalidate user caches
    await invalidateUserCache(userId);

    console.log(`User ${userId} activated by ${adminId}`);
  } catch (error) {
    console.error('Error activating user:', error);
    throw new Error('Failed to activate user account');
  }
}

/**
 * Delete user account (soft or hard deletion)
 */
export async function deleteUser(
  adminId: string,
  userId: string,
  options: DeletionOptions
): Promise<void> {
  try {
    // Validate admin permissions and identify deletion type
    if (adminId === userId) {
      // Self-deletion case
      console.log(`Self-deletion initiated by user ${userId}`);
    } else {
      // Admin-initiated deletion case
      console.log(`Admin deletion initiated by ${adminId} for user ${userId}`);

      // TODO: Add admin permission validation here if needed
      // For now, we trust that the calling code has validated permissions
    }

    // Check for club ownership before deletion
    const { data: ownedClubs, error: clubError } = await supabase
      .from('book_clubs')
      .select('id, name')
      .eq('lead_user_id', userId);

    if (clubError) throw clubError;

    if (ownedClubs && ownedClubs.length > 0) {
      const clubNames = ownedClubs.map(club => `"${club.name}"`).join(', ');

      throw new Error(
        `Cannot delete account while owning ${ownedClubs.length} club(s): ${clubNames}. ` +
        `Please either:\n` +
        `• Transfer ownership to another member\n` +
        `• Contact your store owner for assistance\n` +
        `• Use the club management interface to assign new leaders`
      );
    }

    if (options.type === 'soft') {
      // Soft deletion - mark as deleted but preserve data
      const { error: updateError } = await supabase
        .from('users')
        .update({
          account_status: 'deleted',
          deleted_at: new Date().toISOString(),
          deleted_by: adminId,
          status_changed_by: adminId,
          status_changed_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) throw updateError;
    } else {
      // Hard deletion - attempt to remove data
      const cleanupResult = await cleanupUserData(userId, {
        anonymize_content: true,
        preserve_analytics: true,
        backup_before_cleanup: options.backup_data
      });

      console.log('User data cleanup result:', cleanupResult);
    }

    // Create moderation action for audit trail
    await createModerationAction({
      action_type: 'user_ban', // Use ban for deletion
      target_type: 'user',
      target_id: userId,
      target_user_id: userId,
      reason: options.reason,
      severity: 'critical'
    }, adminId);

    // Invalidate user caches
    await invalidateUserCache(userId);
    await invalidateOnSubscriptionEvent(userId, 'subscription_expired');

    console.log(`User ${userId} deleted (${options.type}) by ${adminId}`);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new Error(`Failed to delete user account: ${error.message}`);
  }
}

/**
 * Clean up user data for hard deletion
 */
export async function cleanupUserData(
  userId: string,
  options: {
    anonymize_content?: boolean;
    preserve_analytics?: boolean;
    backup_before_cleanup?: boolean;
  }
): Promise<CleanupResult> {
  const result: CleanupResult = {
    tables_affected: [],
    records_deleted: 0,
    records_anonymized: 0,
    errors: []
  };

  try {
    // Tables to clean up (in dependency order)
    const cleanupTables = [
      'conversation_participants',
      'direct_messages',
      'club_members',
      'club_moderators',
      'discussion_posts',
      'discussion_topics',
      'book_reviews',
      'user_warnings',
      'payment_records', // Preserve for audit
      'user_subscriptions' // Cancel but preserve for audit
    ];

    for (const table of cleanupTables) {
      try {
        if (table === 'payment_records' || table === 'user_subscriptions') {
          // Preserve financial records for audit - just mark as deleted user
          if (options.anonymize_content) {
            const { error } = await supabase
              .from(table)
              .update({ user_id: null }) // Anonymize
              .eq('user_id', userId);

            if (!error) {
              result.tables_affected.push(table);
              result.records_anonymized++;
            } else {
              result.errors.push(`${table}: ${error.message}`);
            }
          }
        } else {
          // Delete other records
          const { error, count } = await supabase
            .from(table)
            .delete()
            .eq('user_id', userId);

          if (!error) {
            result.tables_affected.push(table);
            result.records_deleted += count || 0;
          } else {
            result.errors.push(`${table}: ${error.message}`);
          }
        }
      } catch (tableError) {
        result.errors.push(`${table}: ${tableError.message}`);
      }
    }

    // Finally, delete the user record
    const { error: userError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (!userError) {
      result.tables_affected.push('users');
      result.records_deleted++;
    } else {
      result.errors.push(`users: ${userError.message}`);
      // If user deletion fails, fall back to soft delete
      await supabase
        .from('users')
        .update({
          account_status: 'deleted',
          deleted_at: new Date().toISOString()
        })
        .eq('id', userId);
    }

  } catch (error) {
    result.errors.push(`Cleanup failed: ${error.message}`);
  }

  return result;
}

/**
 * Get user account status
 */
export async function getUserAccountStatus(userId: string): Promise<AccountStatus> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('account_status, status_changed_by, status_changed_at, deleted_at, deleted_by')
      .eq('id', userId)
      .single();

    if (error) throw error;

    return data as AccountStatus;
  } catch (error) {
    console.error('Error getting user account status:', error);
    return { account_status: null };
  }
}

/**
 * Get user club suspensions
 */
export async function getUserClubSuspensions(userId: string): Promise<ClubSuspension[]> {
  try {
    const { data, error } = await supabase
      .from('club_suspensions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data as ClubSuspension[];
  } catch (error) {
    console.error('Error getting user club suspensions:', error);
    return [];
  }
}

// =========================
// Club Ownership Transfer Functions
// =========================

/**
 * Transfer club ownership or dissolve club
 */
export async function transferClubOwnership(
  clubId: string,
  formerOwnerId: string,
  newOwnerId?: string
): Promise<{
  success: boolean;
  new_owner_id?: string;
  club_dissolved?: boolean;
}> {
  try {
    if (newOwnerId) {
      // Direct transfer to specified user
      const { error } = await supabase
        .from('book_clubs')
        .update({
          lead_user_id: newOwnerId,
          updated_at: new Date().toISOString()
        })
        .eq('id', clubId);

      if (error) throw error;

      // Invalidate entitlement caches for both users
      invalidateUserEntitlements(formerOwnerId);
      invalidateUserEntitlements(newOwnerId);

      return { success: true, new_owner_id: newOwnerId };
    } else {
      // Find longest-serving admin as successor
      const successor = await findLongestServingAdmin(clubId);

      if (successor) {
        const { error } = await supabase
          .from('book_clubs')
          .update({
            lead_user_id: successor.user_id,
            updated_at: new Date().toISOString()
          })
          .eq('id', clubId);

        if (error) throw error;

        // Invalidate entitlement caches for both users
        invalidateUserEntitlements(formerOwnerId);
        invalidateUserEntitlements(successor.user_id);

        return { success: true, new_owner_id: successor.user_id };
      } else {
        // No suitable successor - dissolve club
        await dissolveClub(clubId, 'Owner account deleted, no suitable successor');

        // Invalidate former owner's cache since they no longer own the club
        invalidateUserEntitlements(formerOwnerId);

        return { success: true, club_dissolved: true };
      }
    }
  } catch (error) {
    console.error('Error transferring club ownership:', error);
    return { success: false };
  }
}

/**
 * Find longest-serving admin for club succession
 */
async function findLongestServingAdmin(clubId: string): Promise<{ user_id: string } | null> {
  try {
    const { data, error } = await supabase
      .from('club_moderators')
      .select('user_id, appointed_at')
      .eq('club_id', clubId)
      .eq('is_active', true)
      .order('appointed_at', { ascending: true })
      .limit(1);

    if (error) throw error;

    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Error finding longest-serving admin:', error);
    return null;
  }
}

/**
 * Dissolve club when no successor available
 */
async function dissolveClub(clubId: string, reason: string): Promise<void> {
  try {
    // Mark club as dissolved (using description field since no is_active column exists)
    const { error: clubError } = await supabase
      .from('book_clubs')
      .update({
        description: `[DISSOLVED] ${reason}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', clubId);

    if (clubError) throw clubError;

    // Notify members (if notification system exists)
    // TODO: Implement member notification system

    console.log(`Club ${clubId} dissolved: ${reason}`);
  } catch (error) {
    console.error('Error dissolving club:', error);
    throw error;
  }
}

// =========================
// Subscription Integration Functions
// =========================

/**
 * Cancel user subscriptions on account deletion
 */
export async function cancelUserSubscriptions(userId: string): Promise<void> {
  try {
    // Mark subscriptions as cancelled but preserve for audit
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        is_active: false,
        cancelled_at: new Date().toISOString(),
        cancellation_reason: 'Account deleted'
      })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) throw error;

    console.log(`Subscriptions cancelled for user ${userId}`);
  } catch (error) {
    console.error('Error cancelling user subscriptions:', error);
    // Don't throw - subscription cancellation failure shouldn't block account deletion
  }
}

// =========================
// Validation Functions
// =========================

/**
 * Validate account management action
 */
export async function validateAccountAction(
  adminId: string,
  targetUserId: string,
  action: string
): Promise<{ isValid: boolean; errors: string[] }> {
  const errors: string[] = [];

  try {
    // Check if target user exists
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id, account_status')
      .eq('id', targetUserId)
      .single();

    if (userError || !targetUser) {
      errors.push('Target user not found');
      return { isValid: false, errors };
    }

    // Prevent self-action (except self-deletion)
    if (adminId === targetUserId && action !== 'self_delete') {
      errors.push('Cannot perform this action on your own account');
    }

    // Check current account status
    if (action === 'suspend' && targetUser.account_status === 'suspended') {
      errors.push('User is already suspended');
    }

    if (action === 'activate' && targetUser.account_status === 'active') {
      errors.push('User is already active');
    }

    if (action === 'delete' && targetUser.account_status === 'deleted') {
      errors.push('User is already deleted');
    }

    return { isValid: errors.length === 0, errors };
  } catch (error) {
    console.error('Error validating account action:', error);
    return { isValid: false, errors: ['Validation failed'] };
  }
}
