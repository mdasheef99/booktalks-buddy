import { supabase } from '../../supabase';
import { getUserEntitlements, invalidateUserEntitlements } from '@/lib/entitlements/cache';
import { canManageUserTiers } from '@/lib/entitlements';
import { canManageClub } from '@/lib/entitlements/permissions';
import { convertTierForSubscription } from '@/lib/utils/tierUtils';

/**
 * Admin Management Functions
 */

/**
 * List all members for admin view
 */
export async function listAdminMembers(userId: string) {
  // Check if user has admin permissions
  const entitlements = await getUserEntitlements(userId);

  const hasAdminPermission = entitlements.includes('CAN_MANAGE_USER_TIERS') ||
                            entitlements.includes('CAN_MANAGE_ALL_CLUBS') ||
                            entitlements.includes('CAN_MANAGE_ALL_STORES') ||
                            entitlements.includes('CAN_MANAGE_STORE_SETTINGS');

  if (!hasAdminPermission) {
    console.log('🚨 List members permission check failed for user:', userId);
    console.log('🔑 User entitlements:', entitlements);
    throw new Error('Unauthorized: Only administrators can list all members');
  }

  const { data, error } = await supabase.from('users').select('*');
  if (error) throw error;
  return data;
}

/**
 * Remove a member from a club (admin only)
 * Note: This is duplicated in bookclubs/members.ts for organizational purposes
 */
export async function removeMember(adminId: string, userIdToRemove: string, clubId: string) {
  // Get user entitlements and check club management permission
  const entitlements = await getUserEntitlements(adminId);

  // Get club's store ID for contextual permission checking
  const { data: club } = await supabase
    .from('book_clubs')
    .select('store_id')
    .eq('id', clubId)
    .single();

  const canManage = club ? canManageClub(entitlements, clubId, club.store_id) : false;

  if (!canManage) {
    console.log('🚨 Remove member permission check failed for user:', adminId);
    console.log('📍 Club ID:', clubId);
    console.log('🔑 User entitlements:', entitlements);
    throw new Error('Unauthorized: Only club administrators can remove members');
  }

  const { error } = await supabase
    .from('club_members')
    .delete()
    .eq('user_id', userIdToRemove)
    .eq('club_id', clubId);

  if (error) throw error;
  return { success: true };
}

/**
 * Invite a member to a club (admin only)
 * Note: This is duplicated in bookclubs/members.ts for organizational purposes
 */
export async function inviteMember(adminId: string, clubId: string, inviteeEmail: string) {
  // Get user entitlements and check club management permission
  const entitlements = await getUserEntitlements(adminId);

  // Get club's store ID for contextual permission checking
  const { data: club } = await supabase
    .from('book_clubs')
    .select('store_id')
    .eq('id', clubId)
    .single();

  const canManage = club ? canManageClub(entitlements, clubId, club.store_id) : false;

  if (!canManage) {
    console.log('🚨 Club invite permission check failed for user:', adminId);
    console.log('📍 Club ID:', clubId);
    console.log('🔑 User entitlements:', entitlements);
    throw new Error('Unauthorized: Only club administrators can invite members');
  }

  // Implement invite logic (e.g., insert into invites table or send email)
  // Placeholder implementation:
  return { success: true, message: 'Invite sent (placeholder)' };
}

/**
 * Update a user's membership tier
 * @param adminId - ID of the admin making the change
 * @param userId - ID of the user to update
 * @param tier - New tier ('MEMBER', 'PRIVILEGED', or 'PRIVILEGED_PLUS')
 * @param storeId - ID of the store context
 * @param subscriptionType - Type of subscription ('monthly' or 'annual')
 * @param paymentReference - Optional reference for the payment
 * @param amount - Optional payment amount
 * @param notes - Optional notes about the payment
 */
export async function updateUserTier(
  adminId: string,
  userId: string,
  tier: string,
  storeId: string,
  subscriptionType?: 'monthly' | 'annual',
  paymentReference?: string,
  amount?: number,
  notes?: string
) {
  // Check if the admin has permission to manage user tiers
  const entitlements = await getUserEntitlements(adminId);
  if (!canManageUserTiers(entitlements, storeId)) {
    throw new Error('You do not have permission to manage user tiers');
  }

  // Note: Tier validation is now done inside the try block

  try {
    // Validate tier value
    const validTiers = ['MEMBER', 'PRIVILEGED', 'PRIVILEGED_PLUS'];
    if (!validTiers.includes(tier)) {
      throw new Error(`Invalid tier: ${tier}. Must be one of: ${validTiers.join(', ')}`);
    }

    // Update the user's tier in the database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .update({ membership_tier: tier })
      .eq('id', userId)
      .select()
      .single();

    if (userError) {
      throw new Error('Failed to update user tier: ' + userError.message);
    }

    // Invalidate the user's entitlements cache since their tier has changed
    invalidateUserEntitlements(userId);

    // Also invalidate the admin's cache if they're different
    if (adminId !== userId) {
      invalidateUserEntitlements(adminId);
    }

    // If upgrading to a paid tier, create a subscription and payment record
    if (tier !== 'MEMBER' && subscriptionType) {
      // Convert tier to lowercase format for database constraint
      const subscriptionTier = convertTierForSubscription(tier);
      console.log(`📝 Converting tier for subscription: ${tier} → ${subscriptionTier}`);

      // Use the helper function to create subscription and payment in one transaction
      const { data: subscriptionId, error: subscriptionError } = await supabase
        .rpc('create_subscription_with_payment', {
          p_user_id: userId,
          p_store_id: storeId,
          p_tier: subscriptionTier,
          p_subscription_type: subscriptionType,
          p_recorded_by: adminId,
          p_amount: amount,
          p_payment_reference: paymentReference,
          p_notes: notes
        });

      if (subscriptionError) {
        throw new Error('Failed to create subscription and payment: ' + subscriptionError.message);
      }
    }

    return {
      success: true,
      message: 'User tier updated successfully',
      user: {
        id: userData.id,
        membership_tier: userData.membership_tier
      }
    };
  } catch (error: any) {
    throw error;
  }
}
