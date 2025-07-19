/**
 * Account Cleanup Background Jobs
 * 
 * Automated background processing for account management operations.
 * Integrates with existing scheduled_tasks infrastructure.
 * 
 * Created: 2025-01-17
 * Part of: Phase 2 - Core Account Management APIs
 */

import { supabase } from '@/lib/supabase';
import { cleanupUserData, transferClubOwnership, cancelUserSubscriptions } from './accountManagement';

// =========================
// Types and Interfaces
// =========================

export interface CleanupJobResult {
  processed_count: number;
  success_count: number;
  error_count: number;
  errors: string[];
  execution_time_ms: number;
}

export interface RetentionCleanupOptions {
  retention_days: number;
  batch_size: number;
  max_runtime_minutes: number;
}

// =========================
// Retention Policy Enforcement
// =========================

/**
 * Process expired soft-deleted accounts (30-day retention)
 */
export async function processExpiredDeletions(
  options: RetentionCleanupOptions = {
    retention_days: 30,
    batch_size: 50,
    max_runtime_minutes: 10
  }
): Promise<CleanupJobResult> {
  const startTime = Date.now();
  const result: CleanupJobResult = {
    processed_count: 0,
    success_count: 0,
    error_count: 0,
    errors: [],
    execution_time_ms: 0
  };

  try {
    // Calculate cutoff date for retention
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - options.retention_days);

    // Find expired soft-deleted accounts
    const { data: expiredUsers, error: queryError } = await supabase
      .from('users')
      .select('id, username, deleted_at')
      .eq('account_status', 'deleted')
      .not('deleted_at', 'is', null)
      .lt('deleted_at', cutoffDate.toISOString())
      .limit(options.batch_size);

    if (queryError) throw queryError;

    if (!expiredUsers || expiredUsers.length === 0) {
      result.execution_time_ms = Date.now() - startTime;
      return result;
    }

    console.log(`Processing ${expiredUsers.length} expired user deletions`);

    // Process each expired user
    for (const user of expiredUsers) {
      try {
        // Check runtime limit
        const runtimeMinutes = (Date.now() - startTime) / (1000 * 60);
        if (runtimeMinutes >= options.max_runtime_minutes) {
          console.log(`Runtime limit reached (${options.max_runtime_minutes} minutes)`);
          break;
        }

        result.processed_count++;

        // Transfer club ownership before cleanup
        await handleClubOwnershipForDeletion(user.id);

        // Cancel subscriptions
        await cancelUserSubscriptions(user.id);

        // Perform hard cleanup
        const cleanupResult = await cleanupUserData(user.id, {
          anonymize_content: true,
          preserve_analytics: true,
          backup_before_cleanup: true
        });

        if (cleanupResult.errors.length === 0) {
          result.success_count++;
          console.log(`Successfully cleaned up user ${user.id} (${user.username})`);
        } else {
          result.error_count++;
          result.errors.push(`User ${user.id}: ${cleanupResult.errors.join(', ')}`);
        }

      } catch (userError) {
        result.error_count++;
        result.errors.push(`User ${user.id}: ${userError.message}`);
        console.error(`Error processing user ${user.id}:`, userError);
      }
    }

  } catch (error) {
    result.errors.push(`Job failed: ${error.message}`);
    console.error('Error in processExpiredDeletions:', error);
  }

  result.execution_time_ms = Date.now() - startTime;
  return result;
}

/**
 * Handle club ownership transfer for deleted users
 */
async function handleClubOwnershipForDeletion(userId: string): Promise<void> {
  try {
    // Find clubs owned by the user
    const { data: ownedClubs, error } = await supabase
      .from('book_clubs')
      .select('id, name')
      .eq('lead_user_id', userId);

    if (error) throw error;

    if (ownedClubs && ownedClubs.length > 0) {
      console.log(`Transferring ownership of ${ownedClubs.length} clubs for user ${userId}`);

      // Transfer ownership for each club
      for (const club of ownedClubs) {
        const transferResult = await transferClubOwnership(club.id, userId);
        
        if (transferResult.success) {
          if (transferResult.new_owner_id) {
            console.log(`Club ${club.id} transferred to ${transferResult.new_owner_id}`);
          } else if (transferResult.club_dissolved) {
            console.log(`Club ${club.id} dissolved (no suitable successor)`);
          }
        } else {
          console.error(`Failed to transfer ownership of club ${club.id}`);
        }
      }
    }
  } catch (error) {
    console.error('Error handling club ownership for deletion:', error);
    // Don't throw - club ownership issues shouldn't block user cleanup
  }
}

// =========================
// Suspension Expiry Processing
// =========================

/**
 * Process expired user suspensions
 */
export async function processExpiredSuspensions(): Promise<CleanupJobResult> {
  const startTime = Date.now();
  const result: CleanupJobResult = {
    processed_count: 0,
    success_count: 0,
    error_count: 0,
    errors: [],
    execution_time_ms: 0
  };

  try {
    // Find expired suspensions
    const { data: expiredActions, error: queryError } = await supabase
      .from('moderation_actions')
      .select('id, target_user_id, action_type, expires_at')
      .eq('action_type', 'user_suspension')
      .eq('status', 'active')
      .not('expires_at', 'is', null)
      .lt('expires_at', new Date().toISOString());

    if (queryError) throw queryError;

    if (!expiredActions || expiredActions.length === 0) {
      result.execution_time_ms = Date.now() - startTime;
      return result;
    }

    console.log(`Processing ${expiredActions.length} expired suspensions`);

    // Process each expired suspension
    for (const action of expiredActions) {
      try {
        result.processed_count++;

        // Mark moderation action as expired
        const { error: actionError } = await supabase
          .from('moderation_actions')
          .update({
            status: 'expired',
            updated_at: new Date().toISOString()
          })
          .eq('id', action.id);

        if (actionError) throw actionError;

        // Reactivate user account
        const { error: userError } = await supabase
          .from('users')
          .update({
            account_status: 'active',
            status_changed_at: new Date().toISOString()
          })
          .eq('id', action.target_user_id)
          .eq('account_status', 'suspended');

        if (userError) throw userError;

        result.success_count++;
        console.log(`Suspension expired for user ${action.target_user_id}`);

      } catch (actionError) {
        result.error_count++;
        result.errors.push(`Action ${action.id}: ${actionError.message}`);
        console.error(`Error processing expired suspension ${action.id}:`, actionError);
      }
    }

  } catch (error) {
    result.errors.push(`Job failed: ${error.message}`);
    console.error('Error in processExpiredSuspensions:', error);
  }

  result.execution_time_ms = Date.now() - startTime;
  return result;
}

// =========================
// Club Suspension Expiry Processing
// =========================

/**
 * Process expired club suspensions
 */
export async function processExpiredClubSuspensions(): Promise<CleanupJobResult> {
  const startTime = Date.now();
  const result: CleanupJobResult = {
    processed_count: 0,
    success_count: 0,
    error_count: 0,
    errors: [],
    execution_time_ms: 0
  };

  try {
    // Find expired club suspensions
    const { data: expiredSuspensions, error: queryError } = await supabase
      .from('club_suspensions')
      .select('id, user_id, club_id, expires_at')
      .eq('is_active', true)
      .not('expires_at', 'is', null)
      .lt('expires_at', new Date().toISOString());

    if (queryError) throw queryError;

    if (!expiredSuspensions || expiredSuspensions.length === 0) {
      result.execution_time_ms = Date.now() - startTime;
      return result;
    }

    console.log(`Processing ${expiredSuspensions.length} expired club suspensions`);

    // Process each expired club suspension
    for (const suspension of expiredSuspensions) {
      try {
        result.processed_count++;

        // Mark club suspension as inactive
        const { error: suspensionError } = await supabase
          .from('club_suspensions')
          .update({
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', suspension.id);

        if (suspensionError) throw suspensionError;

        result.success_count++;
        console.log(`Club suspension expired for user ${suspension.user_id} in club ${suspension.club_id}`);

      } catch (suspensionError) {
        result.error_count++;
        result.errors.push(`Suspension ${suspension.id}: ${suspensionError.message}`);
        console.error(`Error processing expired club suspension ${suspension.id}:`, suspensionError);
      }
    }

  } catch (error) {
    result.errors.push(`Job failed: ${error.message}`);
    console.error('Error in processExpiredClubSuspensions:', error);
  }

  result.execution_time_ms = Date.now() - startTime;
  return result;
}

// =========================
// Job Orchestration
// =========================

/**
 * Execute all account cleanup jobs
 */
export async function executeAccountCleanupJobs(): Promise<{
  retention_cleanup: CleanupJobResult;
  suspension_expiry: CleanupJobResult;
  club_suspension_expiry: CleanupJobResult;
}> {
  console.log('Starting account cleanup jobs...');

  const [retentionResult, suspensionResult, clubSuspensionResult] = await Promise.all([
    processExpiredDeletions(),
    processExpiredSuspensions(),
    processExpiredClubSuspensions()
  ]);

  console.log('Account cleanup jobs completed:', {
    retention_cleanup: retentionResult,
    suspension_expiry: suspensionResult,
    club_suspension_expiry: clubSuspensionResult
  });

  return {
    retention_cleanup: retentionResult,
    suspension_expiry: suspensionResult,
    club_suspension_expiry: clubSuspensionResult
  };
}
