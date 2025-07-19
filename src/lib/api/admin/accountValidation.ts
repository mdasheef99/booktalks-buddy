/**
 * Account Management Validation Service
 * 
 * Comprehensive validation for account management operations.
 * Integrates with existing entitlements system for permission checking.
 * 
 * Created: 2025-01-17
 * Part of: Phase 2 - Core Account Management APIs
 */

import { supabase } from '@/lib/supabase';
import { getUserEntitlements } from '@/lib/entitlements';

// =========================
// Types and Interfaces
// =========================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface AccountActionContext {
  adminId: string;
  targetUserId: string;
  action: 'suspend' | 'delete' | 'activate' | 'club_suspend';
  clubId?: string;
  reason?: string;
}

// =========================
// Permission Validation
// =========================

/**
 * Validate admin permissions for account management
 */
export async function validateAdminPermissions(
  adminId: string,
  action: string
): Promise<ValidationResult> {
  const errors: string[] = [];

  try {
    // Get admin entitlements
    const entitlements = await getUserEntitlements(adminId);

    // Check for required permission
    if (!entitlements.includes('CAN_MANAGE_USER_TIERS')) {
      errors.push('Insufficient permissions for account management');
    }

    // Additional checks for specific actions
    if (action === 'delete' && !entitlements.includes('CAN_MANAGE_USER_TIERS')) {
      errors.push('Account deletion requires elevated permissions');
    }

    return { isValid: errors.length === 0, errors };
  } catch (error) {
    console.error('Error validating admin permissions:', error);
    return { isValid: false, errors: ['Permission validation failed'] };
  }
}

/**
 * Validate store context for account management
 */
export async function validateStoreContext(
  adminId: string,
  targetUserId: string
): Promise<ValidationResult> {
  const errors: string[] = [];

  try {
    // Check if admin is store administrator
    const { data: adminStore, error: adminError } = await supabase
      .from('store_administrators')
      .select('store_id, role')
      .eq('user_id', adminId)
      .eq('is_active', true)
      .single();

    if (adminError && adminError.code !== 'PGRST116') {
      throw adminError;
    }

    // If admin is not a store administrator, they can only manage platform-wide
    if (!adminStore) {
      // Platform admin - can manage any user
      return { isValid: true, errors: [] };
    }

    // Store admin - validate they can manage this user
    // TODO: Implement store-specific user validation if needed
    // For now, store admins can manage any user

    return { isValid: errors.length === 0, errors };
  } catch (error) {
    console.error('Error validating store context:', error);
    return { isValid: false, errors: ['Store context validation failed'] };
  }
}

// =========================
// Account State Validation
// =========================

/**
 * Validate account action against current state
 */
export async function validateAccountAction(
  context: AccountActionContext
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Validate admin permissions
    const permissionResult = await validateAdminPermissions(context.adminId, context.action);
    if (!permissionResult.isValid) {
      errors.push(...permissionResult.errors);
    }

    // Validate store context
    const storeResult = await validateStoreContext(context.adminId, context.targetUserId);
    if (!storeResult.isValid) {
      errors.push(...storeResult.errors);
    }

    // Get target user current state
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id, account_status, username, membership_tier')
      .eq('id', context.targetUserId)
      .single();

    if (userError || !targetUser) {
      errors.push('Target user not found');
      return { isValid: false, errors };
    }

    // Prevent self-action (except self-deletion)
    if (context.adminId === context.targetUserId && context.action !== 'delete') {
      errors.push('Cannot perform this action on your own account');
    }

    // Validate action against current account status
    const currentStatus = targetUser.account_status || 'active';

    switch (context.action) {
      case 'suspend':
        if (currentStatus === 'suspended') {
          errors.push('User is already suspended');
        }
        if (currentStatus === 'deleted') {
          errors.push('Cannot suspend deleted user');
        }
        break;

      case 'activate':
        if (currentStatus === 'active') {
          errors.push('User is already active');
        }
        if (currentStatus === 'deleted') {
          errors.push('Cannot activate deleted user');
        }
        break;

      case 'delete':
        if (currentStatus === 'deleted') {
          errors.push('User is already deleted');
        }
        
        // Check for club ownership
        const ownershipResult = await validateClubOwnership(context.targetUserId);
        if (!ownershipResult.isValid) {
          errors.push(...ownershipResult.errors);
        }
        break;

      case 'club_suspend':
        if (!context.clubId) {
          errors.push('Club ID required for club suspension');
        } else {
          // Check if user is already suspended from this club
          const clubSuspensionResult = await validateClubSuspension(
            context.targetUserId,
            context.clubId
          );
          if (!clubSuspensionResult.isValid) {
            errors.push(...clubSuspensionResult.errors);
          }
        }
        break;
    }

    // Validate reason if provided
    if (context.reason && context.reason.length < 10) {
      errors.push('Reason must be at least 10 characters');
    }

    return { isValid: errors.length === 0, errors, warnings };
  } catch (error) {
    console.error('Error validating account action:', error);
    return { isValid: false, errors: ['Account action validation failed'] };
  }
}

/**
 * Validate club ownership before deletion
 */
async function validateClubOwnership(userId: string): Promise<ValidationResult> {
  const errors: string[] = [];

  try {
    const { data: ownedClubs, error } = await supabase
      .from('book_clubs')
      .select('id, name')
      .eq('lead_user_id', userId)
      .eq('is_active', true);

    if (error) throw error;

    if (ownedClubs && ownedClubs.length > 0) {
      errors.push(`User owns ${ownedClubs.length} active club(s). Transfer ownership first.`);
    }

    return { isValid: errors.length === 0, errors };
  } catch (error) {
    console.error('Error validating club ownership:', error);
    return { isValid: false, errors: ['Club ownership validation failed'] };
  }
}

/**
 * Validate club suspension
 */
async function validateClubSuspension(
  userId: string,
  clubId: string
): Promise<ValidationResult> {
  const errors: string[] = [];

  try {
    // Check if user is already suspended from this club
    const { data: existingSuspension, error } = await supabase
      .from('club_suspensions')
      .select('id, expires_at')
      .eq('user_id', userId)
      .eq('club_id', clubId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (existingSuspension) {
      if (existingSuspension.expires_at) {
        errors.push(`User is already suspended from this club until ${existingSuspension.expires_at}`);
      } else {
        errors.push('User is already permanently suspended from this club');
      }
    }

    // Check if club exists and is active
    const { data: club, error: clubError } = await supabase
      .from('book_clubs')
      .select('id, name, is_active')
      .eq('id', clubId)
      .single();

    if (clubError || !club) {
      errors.push('Club not found');
    } else if (!club.is_active) {
      errors.push('Cannot suspend from inactive club');
    }

    return { isValid: errors.length === 0, errors };
  } catch (error) {
    console.error('Error validating club suspension:', error);
    return { isValid: false, errors: ['Club suspension validation failed'] };
  }
}

// =========================
// Business Logic Validation
// =========================

/**
 * Validate suspension escalation logic
 */
export async function validateSuspensionEscalation(userId: string): Promise<{
  shouldEscalate: boolean;
  activeClubSuspensions: number;
  escalationReason?: string;
}> {
  try {
    // Count active club suspensions
    const { data: suspensions, error } = await supabase
      .from('club_suspensions')
      .select('id, club_id')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) throw error;

    const activeCount = suspensions?.length || 0;
    const shouldEscalate = activeCount >= 3;

    return {
      shouldEscalate,
      activeClubSuspensions: activeCount,
      escalationReason: shouldEscalate 
        ? `Automatic escalation: ${activeCount} active club suspensions`
        : undefined
    };
  } catch (error) {
    console.error('Error validating suspension escalation:', error);
    return {
      shouldEscalate: false,
      activeClubSuspensions: 0
    };
  }
}

/**
 * Validate data cleanup safety
 */
export async function validateDataCleanupSafety(userId: string): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Check for critical data that might be affected
    const checks = await Promise.all([
      // Check for active subscriptions
      supabase
        .from('user_subscriptions')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true),
      
      // Check for recent payments
      supabase
        .from('payment_records')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      
      // Check for club memberships
      supabase
        .from('club_members')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
    ]);

    const [subscriptions, recentPayments, clubMemberships] = checks;

    if (subscriptions.data && subscriptions.data.length > 0) {
      warnings.push(`User has ${subscriptions.data.length} active subscription(s)`);
    }

    if (recentPayments.data && recentPayments.data.length > 0) {
      warnings.push(`User has ${recentPayments.data.length} recent payment(s) (last 30 days)`);
    }

    if (clubMemberships.data && clubMemberships.data.length > 0) {
      warnings.push(`User is member of ${clubMemberships.data.length} active club(s)`);
    }

    return { isValid: true, errors, warnings };
  } catch (error) {
    console.error('Error validating data cleanup safety:', error);
    return { isValid: false, errors: ['Data cleanup safety validation failed'] };
  }
}
